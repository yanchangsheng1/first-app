import * as THREE from 'three'
import gsap from 'gsap'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPixelatedPass } from 'three/examples/jsm/postprocessing/RenderPixelatedPass.js'
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js'
import { buildGoose } from './buildGoose.js'

const TARGET = new THREE.Vector3(0, 3.5, 0)

// 相机预设方向（会按 2D/3D 的半径缩放）
const DIRS = {
  perspective: new THREE.Vector3(0.55, 0.5, 0.9),
  front: new THREE.Vector3(0, 0.12, 1),
  side: new THREE.Vector3(1, 0.12, 0.06),
  bottom: new THREE.Vector3(0, -0.9, 0.28)
}

const FINISHES = {
  matte: { roughness: 0.95, metalness: 0.0 },
  glossy: { roughness: 0.35, metalness: 0.1 },
  metal: { roughness: 0.25, metalness: 0.85 }
}

export class PixelGooseScene {
  constructor(container) {
    this.container = container
    this.clock = new THREE.Clock()
    this.pixelSize = 5
    this.autoRotate = true
    this.viewMode = '3d'
    this.cameraPreset = 'perspective'
    this.selected = null
    this.onSelectCb = null
    this._outlineScale = 1
    this._raf = null

    this.raycaster = new THREE.Raycaster()
    this.pointer = new THREE.Vector2()

    this._initRenderer()
    this._initScene()
    this._initCamera()
    this._initControls()
    this._initLights()
    this._buildWorld()
    this._initComposer()
    this._initPicking()

    this._onResize = this._onResize.bind(this)
    window.addEventListener('resize', this._onResize)

    this.animate = this.animate.bind(this)
    this._raf = requestAnimationFrame(this.animate)
  }

  _size() {
    return {
      w: this.container.clientWidth || window.innerWidth,
      h: this.container.clientHeight || window.innerHeight
    }
  }

  _initRenderer() {
    const { w, h } = this._size()
    this.renderer = new THREE.WebGLRenderer({ antialias: false })
    this.renderer.setPixelRatio(1)
    this.renderer.setSize(w, h)
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFShadowMap
    this.container.appendChild(this.renderer.domElement)
  }

  _initScene() {
    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color('#e9ecff')
    this.scene.fog = new THREE.Fog('#e9ecff', 34, 72)
  }

  _initCamera() {
    const { w, h } = this._size()
    this.camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 200)
    this._placeCamera('perspective', '3d', false)
  }

  _initControls() {
    this.controls = new OrbitControls(this.camera, this.renderer.domElement)
    this.controls.enableDamping = true
    this.controls.dampingFactor = 0.08
    this.controls.minDistance = 8
    this.controls.maxDistance = 60
    this.controls.minPolarAngle = 0.02
    this.controls.maxPolarAngle = Math.PI * 0.98
    this.controls.target.copy(TARGET)
    this.controls.addEventListener('start', () => {
      this._userInteracting = true
    })
  }

  _initLights() {
    this.scene.add(new THREE.AmbientLight('#ffffff', 1.05))
    this.scene.add(new THREE.HemisphereLight('#ffffff', '#c9b8ff', 0.7))

    const sun = new THREE.DirectionalLight('#fff3d6', 1.3)
    sun.position.set(10, 18, 8)
    sun.castShadow = true
    sun.shadow.mapSize.set(1024, 1024)
    const s = 22
    sun.shadow.camera.left = -s
    sun.shadow.camera.right = s
    sun.shadow.camera.top = s
    sun.shadow.camera.bottom = -s
    sun.shadow.camera.near = 1
    sun.shadow.camera.far = 70
    this.scene.add(sun)

    const rim = new THREE.DirectionalLight('#a9c9ff', 0.5)
    rim.position.set(-8, 6, -10)
    this.scene.add(rim)
  }

  _buildWorld() {
    // 棋盘格地面
    const tiles = 24
    const tileSize = 3
    const geo = new THREE.PlaneGeometry(tileSize, tileSize)
    const matA = new THREE.MeshStandardMaterial({ color: '#ffd6ea', roughness: 1 })
    const matB = new THREE.MeshStandardMaterial({ color: '#c9e6ff', roughness: 1 })
    this.ground = new THREE.Group()
    const half = tiles / 2
    for (let x = -half; x < half; x++) {
      for (let z = -half; z < half; z++) {
        const mat = (x + z) % 2 === 0 ? matA : matB
        const tile = new THREE.Mesh(geo, mat)
        tile.rotation.x = -Math.PI / 2
        tile.position.set(x * tileSize + tileSize / 2, 0, z * tileSize + tileSize / 2)
        tile.receiveShadow = true
        this.ground.add(tile)
      }
    }
    this.scene.add(this.ground)

    // 主角
    const goose = buildGoose()
    this.goose = goose.group
    this.parts = goose.parts
    this.layers = goose.layers
    this.outlineMat = goose.outlineMat
    this.scene.add(this.goose)

    // 图层索引 & 材质集合
    this.layerMap = {}
    this.standardMats = []
    this.outlineMeshes = []
    this.selectableMeshes = []
    this.layers.forEach((l) => {
      this.layerMap[l.name] = l
      l.mats.forEach((m) => {
        if (m.isMeshStandardMaterial && !this.standardMats.includes(m)) this.standardMats.push(m)
      })
    })
    this.goose.traverse((o) => {
      if (!o.isMesh) return
      if (o.userData.layer === 'outline') this.outlineMeshes.push(o)
      else if (o.userData.layer) this.selectableMeshes.push(o)
    })

    // 漂浮的柔彩方块
    this.floaters = new THREE.Group()
    const floaterMat = [
      new THREE.MeshStandardMaterial({ color: '#ffc21f', roughness: 0.7 }),
      new THREE.MeshStandardMaterial({ color: '#aee0ff', roughness: 0.7 }),
      new THREE.MeshStandardMaterial({ color: '#ff9ec4', roughness: 0.7 }),
      new THREE.MeshStandardMaterial({ color: '#d6bffb', roughness: 0.7 })
    ]
    for (let i = 0; i < 14; i++) {
      const size = 0.5 + Math.random() * 0.6
      const cube = new THREE.Mesh(new THREE.BoxGeometry(size, size, size), floaterMat[i % floaterMat.length])
      const angle = Math.random() * Math.PI * 2
      const radius = 9 + Math.random() * 8
      cube.position.set(Math.cos(angle) * radius, 3 + Math.random() * 6, Math.sin(angle) * radius)
      cube.userData.phase = Math.random() * Math.PI * 2
      cube.userData.baseY = cube.position.y
      cube.userData.spin = 0.3 + Math.random() * 0.6
      this.floaters.add(cube)
    }
    this.scene.add(this.floaters)
  }

  _initComposer() {
    const { w, h } = this._size()
    this.composer = new EffectComposer(this.renderer)
    this.pixelPass = new RenderPixelatedPass(this.pixelSize, this.scene, this.camera)
    this.pixelPass.normalEdgeStrength = 0.3
    this.pixelPass.depthEdgeStrength = 0.4
    this.composer.addPass(this.pixelPass)
    this.composer.addPass(new OutputPass())
    this.composer.setSize(w, h)
  }

  _initPicking() {
    const el = this.renderer.domElement
    let downX = 0
    let downY = 0
    el.addEventListener('pointerdown', (e) => {
      downX = e.clientX
      downY = e.clientY
    })
    el.addEventListener('pointerup', (e) => {
      const moved = Math.hypot(e.clientX - downX, e.clientY - downY)
      if (moved > 5) return // 拖拽旋转，不算点击
      this._pick(e)
    })
  }

  _pick(e) {
    const rect = this.renderer.domElement.getBoundingClientRect()
    this.pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
    this.pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
    this.raycaster.setFromCamera(this.pointer, this.camera)
    const hits = this.raycaster.intersectObjects(this.selectableMeshes, false)
    if (hits.length) {
      const layer = hits[0].object.userData.layer
      if (layer) this.selectLayer(layer)
    }
  }

  // ---------------- 相机 ----------------
  _placeCamera(preset, view, animated = true) {
    const radius = view === '2d' ? 30 : 18
    const fov = view === '2d' ? 16 : 45
    const dir = (DIRS[preset] || DIRS.perspective).clone().normalize()
    const pos = dir.multiplyScalar(radius).add(TARGET)

    if (!animated) {
      this.camera.position.copy(pos)
      this.camera.fov = fov
      this.camera.updateProjectionMatrix()
      if (this.controls) this.controls.target.copy(TARGET)
      return
    }
    gsap.to(this.camera.position, {
      x: pos.x,
      y: pos.y,
      z: pos.z,
      duration: 1.1,
      ease: 'power3.inOut'
    })
    gsap.to(this.controls.target, {
      x: TARGET.x,
      y: TARGET.y,
      z: TARGET.z,
      duration: 1.1,
      ease: 'power3.inOut',
      onUpdate: () => this.controls.update()
    })
    gsap.to(this.camera, {
      fov,
      duration: 1.1,
      ease: 'power3.inOut',
      onUpdate: () => this.camera.updateProjectionMatrix()
    })
  }

  setView(view) {
    this.viewMode = view
    const is2D = view === '2d'
    this.controls.enableRotate = !is2D
    if (is2D && this.cameraPreset === 'perspective') this.cameraPreset = 'front'
    this._placeCamera(this.cameraPreset, view)
  }

  setCameraPreset(preset) {
    this.cameraPreset = preset
    this._placeCamera(preset, this.viewMode)
  }

  // ---------------- 颜色 / 材质 / 轮廓 ----------------
  _tweenColor(colorObj, hex, dur = 0.5) {
    const from = colorObj.clone()
    const to = new THREE.Color(hex)
    const p = { t: 0 }
    gsap.to(p, {
      t: 1,
      duration: dur,
      ease: 'power2.out',
      onUpdate: () => colorObj.copy(from).lerp(to, p.t)
    })
  }

  setLayerColor(name, hex) {
    const layer = this.layerMap[name]
    if (!layer) return
    layer.color = hex
    layer.mats.forEach((m) => this._tweenColor(m.color, hex))
  }

  setFinish(name) {
    const f = FINISHES[name] || FINISHES.matte
    this.finish = name
    this.standardMats.forEach((m) => {
      gsap.to(m, { roughness: f.roughness, metalness: f.metalness, duration: 0.5, ease: 'power2.out' })
    })
  }

  setOutlineColor(hex) {
    this._tweenColor(this.outlineMat.color, hex)
    const l = this.layerMap.outline
    if (l) l.color = hex
  }

  setOutlineThickness(scale) {
    this._outlineScale = scale
    this.outlineMeshes.forEach((o) => {
      gsap.to(o.scale, { x: scale, y: scale, z: scale, duration: 0.4, ease: 'power2.out' })
    })
  }

  setOutlineVisible(v) {
    this.outlineMeshes.forEach((o) => (o.visible = v))
  }

  applyPalette(pal) {
    Object.entries(pal).forEach(([name, hex]) => {
      if (name === 'outline') this.setOutlineColor(hex)
      else if (this.layerMap[name]) this.setLayerColor(name, hex)
    })
  }

  // ---------------- 选中 / 高亮 ----------------
  _setHighlight(name, on) {
    const layer = this.layerMap[name]
    if (!layer) return
    layer.mats.forEach((m) => {
      if (!m.emissive) return
      if (on) m.emissive.set('#ffffff')
      gsap.to(m, {
        emissiveIntensity: on ? 0.35 : 0,
        duration: 0.35,
        ease: 'power2.out'
      })
    })
  }

  selectLayer(name) {
    if (this.selected === name) return
    if (this.selected) this._setHighlight(this.selected, false)
    this.selected = name
    this._setHighlight(name, true)
    // 轻微“弹一下”提示
    gsap.fromTo(
      this.goose.scale,
      { x: 1, y: 1, z: 1 },
      { x: 1.03, y: 1.03, z: 1.03, duration: 0.15, yoyo: true, repeat: 1, ease: 'power2.out' }
    )
    if (this.onSelectCb) this.onSelectCb(name)
  }

  onSelect(cb) {
    this.onSelectCb = cb
  }

  getLayers() {
    return this.layers.map((l) => ({ name: l.name, label: l.label, color: l.color }))
  }

  setPixelSize(size) {
    this.pixelSize = size
    if (this.pixelPass) this.pixelPass.setPixelSize(size)
  }

  setAutoRotate(on) {
    this.autoRotate = on
  }

  _onResize() {
    const { w, h } = this._size()
    this.camera.aspect = w / h
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(w, h)
    this.composer.setSize(w, h)
  }

  animate() {
    this._raf = requestAnimationFrame(this.animate)
    const t = this.clock.getElapsedTime()

    if (this.goose) {
      const { head, tail, leftWing, rightWing } = this.parts
      const bob = Math.sin(t * 2.2) * 0.16
      this.goose.position.y = bob
      head.rotation.z = Math.sin(t * 1.3) * 0.07
      head.rotation.x = Math.sin(t * 1.6 + 1) * 0.05
      head.position.y = 5.2 + bob * 0.4
      tail.rotation.z = Math.sin(t * 2.4) * 0.12
      const flap = Math.sin(t * 3.0) * 0.18
      leftWing.rotation.z = -0.35 + flap
      rightWing.rotation.z = 0.35 - flap

      if (this.autoRotate && !this._userInteracting && this.viewMode === '3d') {
        this.goose.rotation.y += 0.004
      }
    }

    if (this.floaters) {
      this.floaters.children.forEach((c) => {
        c.position.y = c.userData.baseY + Math.sin(t * 1.2 + c.userData.phase) * 0.6
        c.rotation.x += c.userData.spin * 0.01
        c.rotation.y += c.userData.spin * 0.013
      })
    }

    this.controls.update()
    this.composer.render()
  }

  dispose() {
    cancelAnimationFrame(this._raf)
    window.removeEventListener('resize', this._onResize)
    gsap.killTweensOf('*')
    this.controls.dispose()
    this.scene.traverse((o) => {
      if (o.isMesh) {
        o.geometry?.dispose()
        if (Array.isArray(o.material)) o.material.forEach((m) => m.dispose())
        else o.material?.dispose()
      }
    })
    this.composer?.dispose?.()
    this.renderer.dispose()
    if (this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement)
    }
  }
}
