import { reactive, computed } from 'vue'

export const finishes = [
  { key: 'matte', label: '哑光' },
  { key: 'glossy', label: '亮面' },
  { key: 'metal', label: '金属' }
]

export const presets = [
  { key: 'front', label: '正面' },
  { key: 'side', label: '侧面' },
  { key: 'bottom', label: '底面' },
  { key: 'perspective', label: '透视' }
]

export const palettes = [
  {
    name: '经典奶白',
    dots: ['#fbfcff', '#ffc21f', '#ff8fb8'],
    colors: { plumage: '#fbfcff', beak: '#ffc21f', feet: '#ffc21f', cheek: '#ff8fb8', wingTip: '#f7cfe4', spots: '#aee0ff', eye: '#20222c', outline: '#1b1c24' }
  },
  {
    name: '蜜桃粉',
    dots: ['#ffe3ee', '#ff7aa8', '#ff5c94'],
    colors: { plumage: '#ffe3ee', beak: '#ff9f43', feet: '#ff9f43', cheek: '#ff5c94', wingTip: '#ffb3d1', spots: '#ffd0e2', eye: '#3a1f2c', outline: '#7a2b4a' }
  },
  {
    name: '薄荷奶绿',
    dots: ['#e3fff2', '#4fd1a5', '#ffd23f'],
    colors: { plumage: '#e3fff2', beak: '#ffd23f', feet: '#ffbe0b', cheek: '#7bdcb5', wingTip: '#bff5df', spots: '#9be7c4', eye: '#1f3a30', outline: '#1c4a3a' }
  },
  {
    name: '天空蓝',
    dots: ['#e6f4ff', '#4dabf7', '#ffd23f'],
    colors: { plumage: '#e6f4ff', beak: '#ffd23f', feet: '#ffbe0b', cheek: '#74c0fc', wingTip: '#bde0ff', spots: '#a5d8ff', eye: '#1f2d3a', outline: '#1c3a5a' }
  },
  {
    name: '薰衣草',
    dots: ['#f0e9ff', '#b083f0', '#ff9ec4'],
    colors: { plumage: '#f0e9ff', beak: '#ffc21f', feet: '#e8a0ff', cheek: '#ff9ec4', wingTip: '#e6d4ff', spots: '#d6bffb', eye: '#2d1f3a', outline: '#4a2b7a' }
  },
  {
    name: '暗夜霓虹',
    dots: ['#2b2f4a', '#00e5ff', '#ff2e88'],
    colors: { plumage: '#3a3f63', beak: '#ffd23f', feet: '#ff2e88', cheek: '#ff2e88', wingTip: '#00e5ff', spots: '#00e5ff', eye: '#dff6ff', outline: '#05060f' }
  }
]

export const state = reactive({
  layers: [],
  layerColors: {},
  selected: 'plumage',
  view: '3d',
  preset: 'perspective',
  finish: 'matte',
  pixelSize: 5,
  autoRotate: true,
  outlineThickness: 1,
  outlineVisible: true
})

export const selectedLayer = computed(
  () => state.layers.find((l) => l.name === state.selected) || {}
)
export const isOutline = computed(() => state.selected === 'outline')

let scene = null

export function bindScene(s) {
  scene = s
  scene.onSelect((name) => {
    state.selected = name
  })
  const list = scene.getLayers()
  state.layers = list
  list.forEach((l) => (state.layerColors[l.name] = l.color))
  scene.selectLayer('plumage')
}

export function pickLayer(name) {
  state.selected = name
  scene?.selectLayer(name)
}

export function setColor(hex) {
  const name = state.selected
  state.layerColors[name] = hex
  const layer = state.layers.find((l) => l.name === name)
  if (layer) layer.color = hex
  if (name === 'outline') scene?.setOutlineColor(hex)
  else scene?.setLayerColor(name, hex)
}

export function setView(v) {
  state.view = v
  if (v === '2d' && state.preset === 'perspective') state.preset = 'front'
  scene?.setView(v)
}

export function setPreset(p) {
  state.preset = p
  scene?.setCameraPreset(p)
}

export function setFinish(f) {
  state.finish = f
  scene?.setFinish(f)
}

export function applyPalette(pal) {
  scene?.applyPalette(pal.colors)
  Object.entries(pal.colors).forEach(([name, hex]) => {
    state.layerColors[name] = hex
    const layer = state.layers.find((l) => l.name === name)
    if (layer) layer.color = hex
  })
}

export function setPixel(v) {
  state.pixelSize = Number(v)
  scene?.setPixelSize(state.pixelSize)
}

export function setOutlineThickness(v) {
  state.outlineThickness = Number(v)
  scene?.setOutlineThickness(state.outlineThickness)
}

export function toggleOutline() {
  state.outlineVisible = !state.outlineVisible
  scene?.setOutlineVisible(state.outlineVisible)
}

export function toggleAuto() {
  state.autoRotate = !state.autoRotate
  scene?.setAutoRotate(state.autoRotate)
}
