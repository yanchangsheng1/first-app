import * as THREE from 'three'

/**
 * 按参考图重建的 Q 版白色大鹅（小鸭子造型）：
 * 大圆头、粗黑像素描边、黑豆眼+高光、粉脸蛋、宽黄嘴、张开的翅膀、
 * 黄脚蹼，身体带粉/蓝/紫柔和渐变点缀。
 * 用体素方块 + 反向外壳描边，贴合像素游戏质感。
 */

const OUTLINE = '#1b1c24'
const outlineThickness = 0.16

export function buildGoose() {
  const goose = new THREE.Group()
  goose.name = 'PixelGoose'

  const mat = (color, emissive = '#000000') =>
    new THREE.MeshStandardMaterial({
      color,
      emissive,
      roughness: 0.9,
      metalness: 0.0,
      flatShading: true
    })

  const white = mat('#fbfcff')
  const cream = mat('#f0f2fb')
  const yellow = mat('#ffc21f')
  const yellowDark = mat('#f59e0b')
  const pink = mat('#ff9ec4')
  const cheek = mat('#ff8fb8')
  const softPink = mat('#f7cfe4')
  const softBlue = mat('#aee0ff')
  const softPurple = mat('#d6bffb')
  const black = mat('#20222c')

  const outlineMat = new THREE.MeshBasicMaterial({
    color: OUTLINE,
    side: THREE.BackSide
  })

  // 带黑描边的方块
  const box = (w, h, d, material, outline = true) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material)
    if (outline) {
      const o = new THREE.Mesh(
        new THREE.BoxGeometry(w + outlineThickness * 2, h + outlineThickness * 2, d + outlineThickness * 2),
        outlineMat
      )
      m.add(o)
    }
    return m
  }

  // ---------- 身体 ----------
  const bodyGroup = new THREE.Group()
  goose.add(bodyGroup)

  const body = box(3.6, 3.2, 2.9, white)
  body.position.y = 2.4
  bodyGroup.add(body)

  // 肚子（前方稍亮一层，营造鼓鼓的圆肚）
  const belly = box(2.8, 2.4, 0.5, cream, false)
  belly.position.set(0, 2.2, 1.35)
  bodyGroup.add(belly)

  // 身体上的柔和渐变点缀（粉/蓝/紫）
  const patch = (w, h, m, x, y, z) => {
    const p = box(w, h, 0.25, m, false)
    p.position.set(x, y, z)
    bodyGroup.add(p)
  }
  patch(0.9, 0.6, softBlue, -0.9, 1.4, 1.4)
  patch(0.7, 0.5, softPink, 0.7, 1.6, 1.45)
  patch(0.6, 0.5, softPurple, 1.1, 2.5, 1.35)
  patch(0.6, 0.5, softPink, -1.0, 2.6, 1.35)
  patch(0.8, 0.5, softBlue, 0.2, 0.9, 1.4)

  // ---------- 头 ----------
  const head = new THREE.Group()
  head.position.set(0, 5.2, 0)
  goose.add(head)

  const skull = box(3.9, 3.4, 3.2, white)
  head.add(skull)

  // 眼睛（黑豆 + 白高光）
  const makeEye = (x) => {
    const g = new THREE.Group()
    const eye = box(0.55, 0.85, 0.35, black, false)
    eye.position.z = 1.62
    g.add(eye)
    const shine = box(0.2, 0.25, 0.1, white, false)
    shine.position.set(0.12, 0.22, 1.82)
    g.add(shine)
    g.position.x = x
    g.position.y = 0.2
    return g
  }
  head.add(makeEye(0.95))
  head.add(makeEye(-0.95))

  // 粉脸蛋
  const makeCheek = (x) => {
    const c = box(0.6, 0.45, 0.2, cheek, false)
    c.position.set(x, -0.35, 1.62)
    return c
  }
  head.add(makeCheek(1.55))
  head.add(makeCheek(-1.55))

  // 宽黄嘴（鸭子扁嘴）
  const beakUpper = box(1.7, 0.55, 1.1, yellow)
  beakUpper.position.set(0, -0.2, 1.75)
  head.add(beakUpper)
  const beakLower = box(1.4, 0.35, 0.9, yellowDark, false)
  beakLower.position.set(0, -0.55, 1.95)
  head.add(beakLower)
  const nostrilL = box(0.12, 0.12, 0.1, black, false)
  nostrilL.position.set(0.4, -0.05, 2.32)
  head.add(nostrilL)
  const nostrilR = box(0.12, 0.12, 0.1, black, false)
  nostrilR.position.set(-0.4, -0.05, 2.32)
  head.add(nostrilR)

  // ---------- 翅膀（张开） ----------
  const makeWing = (side) => {
    const wing = new THREE.Group()
    const w = box(0.7, 2.4, 1.9, white)
    w.position.set(side * 0.6, 0, 0)
    wing.add(w)
    // 翅尖粉色点缀
    const tip = box(0.5, 0.7, 0.6, softPink, false)
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
  const tail = box(1.6, 1.2, 0.9, white)
  tail.position.set(0, 3.0, -1.7)
  tail.rotation.x = 0.4
  goose.add(tail)

  // ---------- 脚蹼 ----------
  const makeFoot = (x) => {
    const foot = box(1.2, 0.4, 1.6, yellow)
    foot.position.set(x, 0.35, 0.7)
    return foot
  }
  const legL = makeFoot(0.9)
  const legR = makeFoot(-0.9)
  goose.add(legL)
  goose.add(legR)

  // 阴影
  goose.traverse((o) => {
    if (o.isMesh && o.material !== outlineMat) {
      o.castShadow = true
      o.receiveShadow = true
    }
  })

  goose.userData.parts = { body: bodyGroup, head, tail, leftWing, rightWing, legL, legR }
  return goose
}
