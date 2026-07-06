import * as THREE from 'three'

/**
 * 用体素(方块)拼出一只白色大鹅，天然贴合像素/低多边形游戏风格。
 * 返回一个 group，并把可动的部件挂在 group.userData 上便于做节奏动画。
 */
export function buildGoose() {
  const goose = new THREE.Group()
  goose.name = 'PixelGoose'

  const flat = (color) =>
    new THREE.MeshStandardMaterial({
      color,
      roughness: 0.85,
      metalness: 0.0,
      flatShading: true
    })

  const white = flat('#f7f9fc')
  const shadowWhite = flat('#d9e2ef')
  const orange = flat('#ff9f1c')
  const darkOrange = flat('#e8730a')
  const black = flat('#1a1c22')

  const box = (w, h, d, mat) => new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat)

  // 身体
  const body = box(3.4, 2.4, 4.6, white)
  body.position.y = 2.6
  goose.add(body)

  // 背部一层稍暗的“羽毛”块，制造层次
  const back = box(3.0, 0.6, 4.0, shadowWhite)
  back.position.set(0, 3.9, -0.1)
  goose.add(back)

  // 尾巴（翘起来的方块）
  const tail = box(1.4, 1.1, 1.2, white)
  tail.position.set(0, 3.5, -2.7)
  tail.rotation.x = -0.5
  goose.add(tail)

  // 翅膀
  const wingGeoParams = [1.0, 1.8, 3.2]
  const leftWing = box(...wingGeoParams, shadowWhite)
  leftWing.position.set(1.8, 2.7, -0.2)
  goose.add(leftWing)
  const rightWing = box(...wingGeoParams, shadowWhite)
  rightWing.position.set(-1.8, 2.7, -0.2)
  goose.add(rightWing)

  // 脖子 —— 单独 group，方便摆动
  const neck = new THREE.Group()
  neck.position.set(0, 3.4, 2.0)
  goose.add(neck)

  const neckLower = box(1.4, 2.2, 1.4, white)
  neckLower.position.y = 1.1
  neck.add(neckLower)

  const neckUpper = box(1.3, 2.0, 1.3, white)
  neckUpper.position.set(0, 2.9, 0.35)
  neckUpper.rotation.x = -0.25
  neck.add(neckUpper)

  // 头
  const head = box(1.7, 1.6, 1.9, white)
  head.position.set(0, 4.1, 0.9)
  neck.add(head)

  // 眼睛
  const eyeL = box(0.35, 0.35, 0.35, black)
  eyeL.position.set(0.6, 4.35, 1.5)
  neck.add(eyeL)
  const eyeR = box(0.35, 0.35, 0.35, black)
  eyeR.position.set(-0.6, 4.35, 1.5)
  neck.add(eyeR)

  // 嘴巴（橙色）
  const beak = box(1.0, 0.7, 1.1, orange)
  beak.position.set(0, 3.95, 2.0)
  neck.add(beak)
  const beakTip = box(0.9, 0.35, 0.5, darkOrange)
  beakTip.position.set(0, 3.8, 2.6)
  neck.add(beakTip)

  // 双腿+脚蹼（橙色）
  const makeLeg = (x) => {
    const leg = new THREE.Group()
    const shin = box(0.5, 1.4, 0.5, darkOrange)
    shin.position.y = 0.7
    leg.add(shin)
    const foot = box(1.2, 0.3, 1.6, orange)
    foot.position.set(0, 0.1, 0.5)
    leg.add(foot)
    leg.position.set(x, 0, 0.2)
    return leg
  }
  const legL = makeLeg(0.9)
  const legR = makeLeg(-0.9)
  goose.add(legL)
  goose.add(legR)

  // 让所有部件投射/接收阴影
  goose.traverse((o) => {
    if (o.isMesh) {
      o.castShadow = true
      o.receiveShadow = true
    }
  })

  goose.userData.parts = { neck, head, tail, leftWing, rightWing, legL, legR }
  return goose
}
