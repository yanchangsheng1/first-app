import * as THREE from 'three'

/**
 * Q 版白色大鹅（小鸭子造型）。
 * 关键：把可被用户编辑的颜色/材质拆成独立的“图层(layer)”，
 * 每个图层持有一组 material 实例，便于单独改色、改材质、做过渡动画。
 * 同时给每个 mesh 打上 userData.layer 标签，供射线拾取选中。
 */

const OUTLINE_THICKNESS = 0.16

export function buildGoose() {
  const goose = new THREE.Group()
  goose.name = 'PixelGoose'

  const std = (color, opts = {}) =>
    new THREE.MeshStandardMaterial({
      color,
      emissive: '#000000',
      emissiveIntensity: 0,
      roughness: 0.9,
      metalness: 0.0,
      flatShading: true,
      ...opts
    })

  // 每个图层的独立材质
  const M = {
    white: std('#fbfcff'),
    cream: std('#f0f2fb'),
    beak: std('#ffc21f'),
    beakDark: std('#f59e0b'),
    feet: std('#ffc21f'),
    cheek: std('#ff8fb8'),
    wingTip: std('#f7cfe4'),
    eye: std('#20222c'),
    spotBlue: std('#aee0ff'),
    spotPink: std('#f7cfe4'),
    spotPurple: std('#d6bffb')
  }

  const outlineMat = new THREE.MeshBasicMaterial({
    color: '#1b1c24',
    side: THREE.BackSide
  })

  // 带黑描边的方块
  const box = (w, h, d, material, outline = true) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material)
    if (outline) {
      const o = new THREE.Mesh(
        new THREE.BoxGeometry(
          w + OUTLINE_THICKNESS * 2,
          h + OUTLINE_THICKNESS * 2,
          d + OUTLINE_THICKNESS * 2
        ),
        outlineMat
      )
      o.userData.isOutline = true
      m.add(o)
    }
    return m
  }

  // ---------- 身体 ----------
  const bodyGroup = new THREE.Group()
  goose.add(bodyGroup)

  const body = box(3.6, 3.2, 2.9, M.white)
  body.position.y = 2.4
  bodyGroup.add(body)

  const belly = box(2.8, 2.4, 0.5, M.cream, false)
  belly.position.set(0, 2.2, 1.35)
  bodyGroup.add(belly)

  const patch = (w, h, mat, x, y, z) => {
    const p = box(w, h, 0.25, mat, false)
    p.position.set(x, y, z)
    bodyGroup.add(p)
  }
  patch(0.9, 0.6, M.spotBlue, -0.9, 1.4, 1.4)
  patch(0.7, 0.5, M.spotPink, 0.7, 1.6, 1.45)
  patch(0.6, 0.5, M.spotPurple, 1.1, 2.5, 1.35)
  patch(0.6, 0.5, M.spotPink, -1.0, 2.6, 1.35)
  patch(0.8, 0.5, M.spotBlue, 0.2, 0.9, 1.4)

  // ---------- 头 ----------
  const head = new THREE.Group()
  head.position.set(0, 5.2, 0)
  goose.add(head)

  const skull = box(3.9, 3.4, 3.2, M.white)
  head.add(skull)

  const makeEye = (x) => {
    const g = new THREE.Group()
    const eye = box(0.55, 0.85, 0.35, M.eye, false)
    eye.position.z = 1.62
    g.add(eye)
    const shine = box(0.2, 0.25, 0.1, M.white, false)
    shine.position.set(0.12, 0.22, 1.82)
    g.add(shine)
    g.position.set(x, 0.2, 0)
    return g
  }
  head.add(makeEye(0.95))
  head.add(makeEye(-0.95))

  const makeCheek = (x) => {
    const c = box(0.6, 0.45, 0.2, M.cheek, false)
    c.position.set(x, -0.35, 1.62)
    return c
  }
  head.add(makeCheek(1.55))
  head.add(makeCheek(-1.55))

  const beakUpper = box(1.7, 0.55, 1.1, M.beak)
  beakUpper.position.set(0, -0.2, 1.75)
  head.add(beakUpper)
  const beakLower = box(1.4, 0.35, 0.9, M.beakDark, false)
  beakLower.position.set(0, -0.55, 1.95)
  head.add(beakLower)
  const nostrilL = box(0.12, 0.12, 0.1, M.eye, false)
  nostrilL.position.set(0.4, -0.05, 2.32)
  head.add(nostrilL)
  const nostrilR = box(0.12, 0.12, 0.1, M.eye, false)
  nostrilR.position.set(-0.4, -0.05, 2.32)
  head.add(nostrilR)

  // ---------- 翅膀 ----------
  const makeWing = (side) => {
    const wing = new THREE.Group()
    const w = box(0.7, 2.4, 1.9, M.white)
    w.position.set(side * 0.6, 0, 0)
    wing.add(w)
    const tip = box(0.5, 0.7, 0.6, M.wingTip, false)
    tip.position.set(side * 0.9, -0.9, 0.4)
    wing.add(tip)
    wing.position.set(side * 2.1, 3.0, 0.1)
    wing.rotation.z = side * -0.35
    return wing
  }
  const leftWing = makeWing(1)
  const rightWing = makeWing(-1)
  goose.add(leftWing)
  goose.add(rightWing)

  // ---------- 尾巴 ----------
  const tail = box(1.6, 1.2, 0.9, M.white)
  tail.position.set(0, 3.0, -1.7)
  tail.rotation.x = 0.4
  goose.add(tail)

  // ---------- 脚蹼 ----------
  const makeFoot = (x) => {
    const foot = box(1.2, 0.4, 1.6, M.feet)
    foot.position.set(x, 0.35, 0.7)
    return foot
  }
  const legL = makeFoot(0.9)
  const legR = makeFoot(-0.9)
  goose.add(legL)
  goose.add(legR)

  // ---------- 图层定义（用户可编辑） ----------
  const layers = [
    { name: 'plumage', label: '羽毛 · 身体', color: '#fbfcff', mats: [M.white, M.cream] },
    { name: 'beak', label: '嘴巴', color: '#ffc21f', mats: [M.beak, M.beakDark] },
    { name: 'feet', label: '脚蹼', color: '#ffc21f', mats: [M.feet] },
    { name: 'cheek', label: '腮红', color: '#ff8fb8', mats: [M.cheek] },
    { name: 'wingTip', label: '翅尖点缀', color: '#f7cfe4', mats: [M.wingTip] },
    { name: 'eye', label: '眼睛', color: '#20222c', mats: [M.eye] },
    { name: 'spots', label: '渐变斑点', color: '#aee0ff', mats: [M.spotBlue, M.spotPink, M.spotPurple] },
    { name: 'outline', label: '描边轮廓', color: '#1b1c24', mats: [outlineMat] }
  ]

  // material -> layerName，用于给 mesh 打标签
  const matToLayer = new Map()
  layers.forEach((l) => l.mats.forEach((m) => matToLayer.set(m, l.name)))

  goose.traverse((o) => {
    if (!o.isMesh) return
    if (o.userData.isOutline) {
      o.userData.layer = 'outline'
    } else {
      o.castShadow = true
      o.receiveShadow = true
      const layerName = matToLayer.get(o.material)
      if (layerName) o.userData.layer = layerName
    }
  })

  const parts = { body: bodyGroup, head, tail, leftWing, rightWing, legL, legR }

  return { group: goose, parts, layers, outlineMat }
}
