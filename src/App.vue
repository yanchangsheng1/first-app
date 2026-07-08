<script setup>
import { ref, reactive, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import gsap from 'gsap'
import { PixelGooseScene } from './three/PixelGooseScene.js'

const canvasHost = ref(null)
const leftPanel = ref(null)
const rightPanel = ref(null)
const topBar = ref(null)
const bottomBar = ref(null)

let scene = null

// 状态
const layers = ref([]) // [{name,label,color}]
const layerColors = reactive({}) // name -> hex
const selected = ref('plumage')
const view = ref('3d')
const preset = ref('perspective')
const finish = ref('matte')
const pixelSize = ref(5)
const autoRotate = ref(true)
const outlineThickness = ref(1)
const outlineVisible = ref(true)

const finishes = [
  { key: 'matte', label: '哑光' },
  { key: 'glossy', label: '亮面' },
  { key: 'metal', label: '金属' }
]

const presets = [
  { key: 'front', label: '正面' },
  { key: 'side', label: '侧面' },
  { key: 'bottom', label: '底面' },
  { key: 'perspective', label: '透视' }
]

// 预设配色搭配（中间底部）
const palettes = [
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

const selectedLayer = computed(() => layers.value.find((l) => l.name === selected.value) || {})
const isOutline = computed(() => selected.value === 'outline')

onMounted(() => {
  scene = new PixelGooseScene(canvasHost.value)
  scene.onSelect((name) => {
    selected.value = name
  })
  const list = scene.getLayers()
  layers.value = list
  list.forEach((l) => (layerColors[l.name] = l.color))
  scene.selectLayer('plumage')
  nextTick(introAnim)
})

onBeforeUnmount(() => {
  scene?.dispose()
  scene = null
})

function introAnim() {
  const tl = gsap.timeline({ defaults: { ease: 'power3.out', duration: 0.7 } })
  tl.from(topBar.value, { y: -50, opacity: 0 })
    .from(leftPanel.value, { x: -60, opacity: 0 }, '-=0.4')
    .from(rightPanel.value, { x: 60, opacity: 0 }, '-=0.6')
    .from(bottomBar.value, { y: 60, opacity: 0 }, '-=0.6')
}

// 交互
function pickLayer(name) {
  selected.value = name
  scene?.selectLayer(name)
}

function onColorInput(e) {
  const hex = e.target.value
  const name = selected.value
  layerColors[name] = hex
  const layer = layers.value.find((l) => l.name === name)
  if (layer) layer.color = hex
  if (name === 'outline') scene?.setOutlineColor(hex)
  else scene?.setLayerColor(name, hex)
}

function setView(v) {
  view.value = v
  if (v === '2d' && preset.value === 'perspective') preset.value = 'front'
  scene?.setView(v)
}

function setPreset(p) {
  preset.value = p
  scene?.setCameraPreset(p)
}

function setFinish(f) {
  finish.value = f
  scene?.setFinish(f)
}

function applyPalette(pal) {
  scene?.applyPalette(pal.colors)
  Object.entries(pal.colors).forEach(([name, hex]) => {
    layerColors[name] = hex
    const layer = layers.value.find((l) => l.name === name)
    if (layer) layer.color = hex
  })
}

function onPixel(e) {
  pixelSize.value = Number(e.target.value)
  scene?.setPixelSize(pixelSize.value)
}

function onOutlineThickness(e) {
  outlineThickness.value = Number(e.target.value)
  scene?.setOutlineThickness(outlineThickness.value)
}

function toggleOutline() {
  outlineVisible.value = !outlineVisible.value
  scene?.setOutlineVisible(outlineVisible.value)
}

function toggleAuto() {
  autoRotate.value = !autoRotate.value
  scene?.setAutoRotate(autoRotate.value)
}
</script>

<template>
  <div class="stage">
    <div ref="canvasHost" class="canvas-host"></div>

    <!-- 顶部：视角 2D/3D + 正面/侧面/底面 -->
    <header ref="topBar" class="bar top-bar">
      <span class="brand">🦢 PIXEL GOOSE</span>
      <div class="seg">
        <button :class="{ on: view === '2d' }" @click="setView('2d')">2D</button>
        <button :class="{ on: view === '3d' }" @click="setView('3d')">3D</button>
      </div>
      <div class="seg">
        <button
          v-for="p in presets"
          :key="p.key"
          :class="{ on: preset === p.key }"
          @click="setPreset(p.key)"
        >
          {{ p.label }}
        </button>
      </div>
    </header>

    <!-- 左侧：部件栏目 -->
    <aside ref="leftPanel" class="panel left">
      <h2 class="panel-title">部件图层</h2>
      <ul class="layer-list">
        <li
          v-for="l in layers"
          :key="l.name"
          :class="{ active: selected === l.name }"
          @click="pickLayer(l.name)"
        >
          <span class="dot" :style="{ background: layerColors[l.name] }"></span>
          <span class="layer-label">{{ l.label }}</span>
        </li>
      </ul>
      <p class="hint">点击模型或列表选中部件</p>
    </aside>

    <!-- 右侧：选中内容属性 -->
    <aside ref="rightPanel" class="panel right">
      <h2 class="panel-title">属性 · {{ selectedLayer.label }}</h2>

      <section class="field">
        <label>颜色</label>
        <div class="color-row">
          <input type="color" :value="layerColors[selected]" @input="onColorInput" />
          <span class="hex">{{ (layerColors[selected] || '').toUpperCase() }}</span>
        </div>
      </section>

      <section class="field">
        <label>材质质感</label>
        <div class="seg full">
          <button
            v-for="f in finishes"
            :key="f.key"
            :class="{ on: finish === f.key }"
            @click="setFinish(f.key)"
          >
            {{ f.label }}
          </button>
        </div>
      </section>

      <section v-if="isOutline" class="field">
        <label>轮廓粗细 · {{ outlineThickness.toFixed(2) }}</label>
        <input type="range" min="0.4" max="2" step="0.05" :value="outlineThickness" @input="onOutlineThickness" />
        <button class="toggle" :class="{ on: outlineVisible }" @click="toggleOutline">
          {{ outlineVisible ? '轮廓：显示' : '轮廓：隐藏' }}
        </button>
      </section>

      <hr class="sep" />

      <section class="field">
        <label>像素颗粒 · {{ pixelSize }}</label>
        <input type="range" min="1" max="12" step="1" :value="pixelSize" @input="onPixel" />
      </section>

      <section class="field">
        <button class="toggle" :class="{ on: autoRotate }" @click="toggleAuto">
          {{ autoRotate ? '自动旋转：开' : '自动旋转：关' }}
        </button>
      </section>
    </aside>

    <!-- 中间底部：预设配色搭配 -->
    <footer ref="bottomBar" class="bar bottom-bar">
      <span class="bottom-title">配色搭配</span>
      <div class="palettes">
        <button v-for="p in palettes" :key="p.name" class="palette" @click="applyPalette(p)">
          <span class="swatches">
            <i v-for="(c, i) in p.dots" :key="i" :style="{ background: c }"></i>
          </span>
          <span class="palette-name">{{ p.name }}</span>
        </button>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.stage {
  position: relative;
  width: 100%;
  height: 100%;
}

.canvas-host {
  position: absolute;
  inset: 0;
}

/* 通用面板 */
.panel {
  position: absolute;
  z-index: 3;
  background: var(--panel);
  border: 3px solid #2b3a6b;
  box-shadow: 6px 6px 0 rgba(0, 0, 0, 0.35);
  padding: 14px;
  backdrop-filter: blur(4px);
  user-select: none;
}

.panel-title {
  font-size: 10px;
  color: var(--accent);
  margin-bottom: 12px;
  letter-spacing: 1px;
  line-height: 1.5;
}

.left {
  top: 78px;
  left: 18px;
  width: 194px;
}

.right {
  top: 78px;
  right: 18px;
  width: 210px;
}

/* 顶部栏 */
.bar {
  position: absolute;
  z-index: 4;
  display: flex;
  align-items: center;
  gap: 12px;
  user-select: none;
}

.top-bar {
  top: 16px;
  left: 18px;
  right: 18px;
  flex-wrap: wrap;
}

.brand {
  font-size: 14px;
  color: var(--accent);
  text-shadow: 2px 2px 0 #05060f;
  margin-right: auto;
}

/* 分段按钮 */
.seg {
  display: inline-flex;
  border: 3px solid #2b3a6b;
  background: var(--panel);
  box-shadow: 4px 4px 0 rgba(0, 0, 0, 0.3);
}

.seg.full {
  width: 100%;
}

.seg button {
  flex: 1;
  font-family: var(--pixel-font);
  font-size: 8px;
  color: var(--ink);
  background: transparent;
  border: none;
  padding: 9px 11px;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}

.seg button + button {
  border-left: 2px solid #2b3a6b;
}

.seg button:hover {
  background: rgba(87, 199, 255, 0.18);
}

.seg button.on {
  background: var(--accent);
  color: #05060f;
}

/* 图层列表 */
.layer-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.layer-list li {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 8px 9px;
  font-size: 9px;
  border: 2px solid transparent;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s, transform 0.1s;
}

.layer-list li:hover {
  background: rgba(87, 199, 255, 0.12);
}

.layer-list li.active {
  border-color: var(--accent);
  background: rgba(255, 210, 63, 0.14);
}

.dot {
  width: 14px;
  height: 14px;
  border: 2px solid #05060f;
  flex-shrink: 0;
}

.layer-label {
  line-height: 1.4;
}

.hint {
  margin-top: 12px;
  font-size: 7px;
  color: #8fa3d6;
  line-height: 1.7;
}

/* 属性字段 */
.field {
  margin-bottom: 14px;
}

.field > label {
  display: block;
  font-size: 8px;
  color: var(--accent-2);
  margin-bottom: 8px;
  line-height: 1.6;
}

.color-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

input[type='color'] {
  width: 44px;
  height: 34px;
  border: 3px solid #2b3a6b;
  background: none;
  padding: 0;
  cursor: pointer;
}

.hex {
  font-size: 9px;
  color: var(--ink);
}

input[type='range'] {
  width: 100%;
  accent-color: var(--accent);
  cursor: pointer;
}

.toggle {
  margin-top: 10px;
  width: 100%;
  font-family: var(--pixel-font);
  font-size: 8px;
  color: var(--ink);
  background: var(--panel);
  border: 3px solid #2b3a6b;
  padding: 9px;
  cursor: pointer;
  box-shadow: 3px 3px 0 rgba(0, 0, 0, 0.3);
  transition: background 0.15s, color 0.15s;
}

.toggle.on {
  background: var(--accent);
  color: #05060f;
}

.sep {
  border: none;
  border-top: 2px dashed #2b3a6b;
  margin: 6px 0 14px;
}

/* 底部配色 */
.bottom-bar {
  bottom: 16px;
  left: 50%;
  transform: translateX(-50%);
  flex-direction: column;
  gap: 8px;
  background: var(--panel);
  border: 3px solid #2b3a6b;
  box-shadow: 6px 6px 0 rgba(0, 0, 0, 0.35);
  padding: 12px 16px;
  max-width: calc(100vw - 40px);
}

.bottom-title {
  font-size: 8px;
  color: var(--accent);
}

.palettes {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: center;
}

.palette {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  background: transparent;
  border: 3px solid #2b3a6b;
  padding: 7px 9px;
  cursor: pointer;
  transition: transform 0.12s, border-color 0.15s;
}

.palette:hover {
  transform: translateY(-3px);
  border-color: var(--accent);
}

.swatches {
  display: flex;
  gap: 3px;
}

.swatches i {
  width: 12px;
  height: 12px;
  border: 2px solid #05060f;
}

.palette-name {
  font-size: 7px;
  color: var(--ink);
}

@media (max-width: 720px) {
  .left,
  .right {
    width: 150px;
    top: 108px;
  }
  .brand {
    font-size: 11px;
  }
  .palette-name {
    display: none;
  }
}
</style>
