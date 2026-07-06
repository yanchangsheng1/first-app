import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPixelatedPass } from 'three/examples/jsm/postprocessing/RenderPixelatedPass.js'
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js'
import { buildGoose } from './buildGoose.js'

export class PixelGooseScene {
  constructor(container) {
    this.container = container
    this.clock = new THREE.Clock()
    this.pixelSize = 5
    this.autoRotate = true
    this._raf = null

    this._initRenderer()
    this._initScene()
    this._initCamera()
    this._initControls()
    this._initLights()
    this._buildWorld()
    this._initComposer()

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
    this.renderer.setPixelRatio(1) // 像素风：不追求高 dpi
    this.renderer.setSize(w, h)
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFShadowMap
    this.container.appendChild(this.renderer.domElement)
  }

  _initScene() {
    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color('#141a33')
    this.scene.fog = new THREE.Fog('#141a33', 26, 60)
  }

  _initCamera() {
    const { w, h } = this._size()
    this.camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 200)
    this.camera.position.set(12, 10, 16)
    this.camera.lookAt(0, 3, 0)
  }

  _initControls() {
    this.controls = new OrbitControls(this.camera, this.renderer.domElement)
    this.controls.enableDamping = true
    this.controls.dampingFactor = 0.08
    this.controls.minDistance = 8
    this.controls.maxDistance = 40
    this.controls.maxPolarAngle = Math.PI * 0.495
    this.controls.target.set(0, 3, 0)
    // 用户开始拖拽时暂停自动旋转
    this.controls.addEventListener('start', () => {
      this._userInteracting = true
    })
  }

  _initLights() {
    this.scene.add(new THREE.AmbientLight('#8899cc', 0.9))

    const hemi = new THREE.HemisphereLight('#bcd4ff', '#3a3350', 0.6)
    this.scene.add(hemi)

    const sun = new THREE.DirectionalLight('#fff3d6', 1.4)
    sun.position.set(10, 18, 8)
    sun.castShadow = true
    sun.shadow.mapSize.set(1024, 1024)
    const s = 20
    sun.shadow.camera.left = -s
    sun.shadow.camera.right = s
    sun.shadow.camera.top = s
    sun.shadow.camera.bottom = -s
    sun.shadow.camera.near = 1
    sun.shadow.camera.far = 60
    this.scene.add(sun)

    const rim = new THREE.DirectionalLight('#57c7ff', 0.5)
    rim.position.set(-8, 6, -10)
    this.scene.add(rim)
  }

  _buildWorld() {
    // 棋盘格地面（像素草地/水池感）
    const tiles = 24
    const tileSize = 3
    const geo = new THREE.PlaneGeometry(tileSize, tileSize)
    const matA = new THREE.MeshStandardMaterial({ color: '#2f7d54', roughness: 1 })
    const matB = new THREE.MeshStandardMaterial({ color: '#276b47', roughness: 1 })
    const ground = new THREE.Group()
    const half = tiles / 2
    for (let x = -half; x < half; x++) {
      for (let z = -half; z < half; z++) {
        const mat = (x + z) % 2 === 0 ? matA : matB
        const tile = new THREE.Mesh(geo, mat)
        tile.rotation.x = -Math.PI / 2
        tile.position.set(x * tileSize + tileSize / 2, 0, z * tileSize + tileSize / 2)
        tile.receiveShadow = true
        ground.add(tile)
      }
    }
    this.scene.add(ground)

    // 主角：大鹅
    this.goose = buildGoose()
    this.scene.add(this.goose)

    // 漂浮的像素方块（点缀，营造游戏节奏氛围）
    this.floaters = new THREE.Group()
    const floaterMat = [
      new THREE.MeshStandardMaterial({ color: '#ffd23f', emissive: '#4a3a00', roughness: 0.6 }),
      new THREE.MeshStandardMaterial({ color: '#57c7ff', emissive: '#003049', roughness: 0.6 }),
      new THREE.MeshStandardMaterial({ color: '#ff5d8f', emissive: '#3a0018', roughness: 0.6 })
    ]
    for (let i = 0; i < 14; i++) {
      const size = 0.5 + Math.random() * 0.6
      const cube = new THREE.Mesh(
        new THREE.BoxGeometry(size, size, size),
        floaterMat[i % floaterMat.length]
      )
      const angle = Math.random() * Math.PI * 2
      const radius = 8 + Math.random() * 8
      cube.position.set(
        Math.cos(angle) * radius,
        3 + Math.random() * 6,
        Math.sin(angle) * radius
      )
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
    this.pixelPass.normalEdgeStrength = 0.35
    this.pixelPass.depthEdgeStrength = 0.45
    this.composer.addPass(this.pixelPass)
    this.composer.addPass(new OutputPass())
    this.composer.setSize(w, h)
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

    // 大鹅的“节奏”待机动画
    if (this.goose) {
      const { neck, head, tail, leftWing, rightWing } = this.goose.userData.parts
      this.goose.position.y = Math.sin(t * 2.2) * 0.18
      neck.rotation.x = Math.sin(t * 1.6) * 0.12 - 0.05
      neck.rotation.z = Math.sin(t * 0.9) * 0.06
      head.rotation.x = Math.sin(t * 1.6 + 1) * 0.08
      tail.rotation.z = Math.sin(t * 2.4) * 0.12
      leftWing.rotation.z = -0.15 + Math.sin(t * 2.2) * 0.12
      rightWing.rotation.z = 0.15 - Math.sin(t * 2.2) * 0.12

      if (this.autoRotate && !this._userInteracting) {
        this.goose.rotation.y += 0.004
      }
    }

    // 漂浮方块
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
