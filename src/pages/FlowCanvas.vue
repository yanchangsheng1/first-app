<script setup>
import { ref, reactive, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { VueFlow, useVueFlow, Panel } from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import { Controls } from '@vue-flow/controls'
import { MiniMap } from '@vue-flow/minimap'
import PluginNode from '../components/flow/PluginNode.vue'
import { PLUGINS, PLUGIN_LIST } from '../components/flow/plugins.js'

const {
  onConnect,
  onConnectStart,
  onConnectEnd,
  onNodeDragStop,
  onPaneReady,
  addEdges,
  addNodes,
  removeNodes,
  removeEdges,
  setNodes,
  setEdges,
  getNodes,
  getEdges,
  getSelectedNodes,
  getSelectedEdges,
  screenToFlowCoordinate,
  fitView,
  toObject,
  fromObject
} = useVueFlow()

const flowWrapper = ref(null)
const isConnecting = ref(false)
const showHelp = ref(false)
const hintVisible = ref(true)
const mobilePaletteOpen = ref(false)

let seq = 0
const genId = (type) => `${type}-${Date.now()}-${seq++}`

function defaultData(type) {
  const base = { type, title: PLUGINS[type]?.title, bypass: false }
  if (type === 'prompt') base.text = ''
  if (type === 'image') base.model = 'ChatGPT Image'
  if (type === 'video') {
    base.duration = '15 秒'
    base.ratio = '9:16'
  }
  return base
}

const exampleNodes = [
  { id: 'n-upload', type: 'plugin', position: { x: 40, y: 120 }, data: defaultData('upload') },
  { id: 'n-ref', type: 'plugin', position: { x: 40, y: 340 }, data: defaultData('reference') },
  { id: 'n-prompt', type: 'plugin', position: { x: 360, y: 120 }, data: defaultData('prompt') },
  { id: 'n-image', type: 'plugin', position: { x: 700, y: 230 }, data: defaultData('image') },
  { id: 'n-video', type: 'plugin', position: { x: 1040, y: 230 }, data: defaultData('video') }
]
const exampleEdges = [
  { id: 'e1', source: 'n-upload', target: 'n-prompt' },
  { id: 'e2', source: 'n-prompt', target: 'n-image' },
  { id: 'e3', source: 'n-ref', target: 'n-image' },
  { id: 'e4', source: 'n-image', target: 'n-video' }
]

const nodes = ref(exampleNodes)
const edges = ref(exampleEdges)

/* ---------------- 撤销 / 重做（轻量快照） ---------------- */
const history = []
let hIndex = -1
let restoring = false

function snapshot() {
  if (restoring) return
  const snap = JSON.stringify(toObject())
  if (history[hIndex] === snap) return
  history.splice(hIndex + 1)
  history.push(snap)
  if (history.length > 60) history.shift()
  hIndex = history.length - 1
}
function applySnapshot(snap) {
  restoring = true
  fromObject(JSON.parse(snap))
  nextTick(() => {
    restoring = false
  })
}
function undo() {
  if (hIndex <= 0) return
  hIndex--
  applySnapshot(history[hIndex])
  toast('↩️ 撤销')
}
function redo() {
  if (hIndex >= history.length - 1) return
  hIndex++
  applySnapshot(history[hIndex])
  toast('↪️ 重做')
}

/* ---------------- 连线 ---------------- */
let pendingSource = null
onConnectStart((params) => {
  isConnecting.value = true
  pendingSource = params
})
onConnect((params) => {
  isConnecting.value = false
  addEdges(params)
  snapshot()
})
onConnectEnd((event) => {
  isConnecting.value = false
  // 拖线松手在空白处 → 弹出添加节点菜单，并自动连线
  if (pendingSource?.nodeId && event) {
    const target = event.target
    const droppedOnHandle = target?.classList?.contains('vue-flow__handle')
    if (!droppedOnHandle) openMenu(event.clientX ?? 0, event.clientY ?? 0, pendingSource)
  }
  pendingSource = null
})
onNodeDragStop(() => snapshot())

/* ---------------- 拖拽 / 点击添加 ---------------- */
function onDragStart(event, type) {
  event.dataTransfer.setData('application/vueflow', type)
  event.dataTransfer.effectAllowed = 'move'
}
function onDragOver(event) {
  event.preventDefault()
  if (event.dataTransfer) event.dataTransfer.dropEffect = 'move'
}
function onDrop(event) {
  const type = event.dataTransfer.getData('application/vueflow')
  if (!type || !PLUGINS[type]) return
  const position = screenToFlowCoordinate({ x: event.clientX, y: event.clientY })
  addNodes({ id: genId(type), type: 'plugin', position, data: defaultData(type) })
  snapshot()
}

function createNode(type, position, source) {
  const id = genId(type)
  addNodes({ id, type: 'plugin', position, data: defaultData(type) })
  // 若来自拖线，自动连线
  if (source?.nodeId) {
    if (source.handleType === 'source') addEdges({ source: source.nodeId, target: id })
    else addEdges({ source: id, target: source.nodeId })
  }
  snapshot()
  return id
}

function addAtCenter(type) {
  const rect = flowWrapper.value?.getBoundingClientRect()
  const screen = rect
    ? { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
    : { x: window.innerWidth / 2, y: window.innerHeight / 2 }
  const position = screenToFlowCoordinate(screen)
  position.x += (Math.random() - 0.5) * 80
  position.y += (Math.random() - 0.5) * 80
  createNode(type, position)
  mobilePaletteOpen.value = false
}

/* ---------------- 添加节点搜索菜单（右键 / 双击 / 拖线到空白） ---------------- */
const menu = reactive({ open: false, x: 0, y: 0, query: '', source: null, flowPos: null })
const menuQueryEl = ref(null)

const filteredPlugins = computed(() => {
  const q = menu.query.trim().toLowerCase()
  if (!q) return PLUGIN_LIST
  return PLUGIN_LIST.filter(
    (p) => p.title.toLowerCase().includes(q) || p.type.toLowerCase().includes(q)
  )
})

function openMenu(clientX, clientY, source = null) {
  menu.flowPos = screenToFlowCoordinate({ x: clientX, y: clientY })
  menu.x = Math.min(clientX, window.innerWidth - 240)
  menu.y = Math.min(clientY, window.innerHeight - 300)
  menu.source = source
  menu.query = ''
  menu.open = true
  nextTick(() => menuQueryEl.value?.focus())
}
function closeMenu() {
  menu.open = false
  menu.source = null
}
function choosePlugin(type) {
  createNode(type, { ...menu.flowPos }, menu.source)
  closeMenu()
}
function onPaneContextMenu(event) {
  event.preventDefault()
  openMenu(event.clientX, event.clientY)
}
function onWrapperDblClick(event) {
  if (event.target?.classList?.contains('vue-flow__pane')) {
    openMenu(event.clientX, event.clientY)
  }
}

/* ---------------- 选择 / 复制 / 粘贴 / 删除 / bypass ---------------- */
const clipboard = ref([])

function selectAll() {
  getNodes.value.forEach((n) => (n.selected = true))
  getEdges.value.forEach((e) => (e.selected = true))
}
function copySelection() {
  clipboard.value = getSelectedNodes.value.map((n) => ({
    type: n.type,
    data: JSON.parse(JSON.stringify(n.data)),
    position: { ...n.position }
  }))
  if (clipboard.value.length) toast(`📋 已复制 ${clipboard.value.length} 个节点`)
}
function paste() {
  if (!clipboard.value.length) return
  const created = clipboard.value.map((c) => ({
    id: genId(c.data.type),
    type: 'plugin',
    position: { x: c.position.x + 40, y: c.position.y + 40 },
    data: JSON.parse(JSON.stringify(c.data)),
    selected: true
  }))
  getNodes.value.forEach((n) => (n.selected = false))
  addNodes(created)
  snapshot()
  toast(`📎 已粘贴 ${created.length} 个节点`)
}
function duplicate() {
  copySelection()
  paste()
}
function deleteSelected() {
  const ns = getSelectedNodes.value
  const es = getSelectedEdges.value
  if (ns.length) removeNodes(ns)
  if (es.length) removeEdges(es)
  if (ns.length || es.length) {
    snapshot()
    toast('🗑️ 已删除')
  }
}
function toggleBypass() {
  const ns = getSelectedNodes.value
  if (!ns.length) return
  ns.forEach((n) => {
    n.data.bypass = !n.data.bypass
  })
  snapshot()
  toast('⏯️ 切换跳过(Bypass)')
}

/* ---------------- 运行 / 保存 / 载入 ---------------- */
const running = ref(false)
function runQueue() {
  if (running.value) return
  running.value = true
  toast('▶️ 已加入队列，正在生成…')
  setTimeout(() => {
    running.value = false
    toast('✅ 生成完成（示例）')
  }, 1600)
}
const STORE_KEY = 'goose-flow-workflow'
function save() {
  localStorage.setItem(STORE_KEY, JSON.stringify(toObject()))
  toast('💾 工作流已保存到本地')
}
function load() {
  const s = localStorage.getItem(STORE_KEY)
  if (!s) return toast('⚠️ 没有已保存的工作流')
  snapshot()
  applySnapshot(s)
  toast('📂 已载入工作流')
}

/* ---------------- 工具 ---------------- */
function clearAll() {
  setNodes([])
  setEdges([])
  snapshot()
}
function loadExample() {
  setNodes(exampleNodes.map((n) => ({ ...n, data: defaultData(n.data.type) })))
  setEdges(exampleEdges.map((e) => ({ ...e })))
  setTimeout(() => {
    fitView({ padding: 0.2 })
    snapshot()
  }, 60)
}
const miniColor = (n) => PLUGINS[n.data?.type]?.accent || '#57c7ff'

/* ---------------- Toast ---------------- */
const toastState = reactive({ msg: '', show: false })
let toastTimer = null
function toast(msg) {
  toastState.msg = msg
  toastState.show = true
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => (toastState.show = false), 1800)
}

/* ---------------- 快捷键（参考 ComfyUI） ---------------- */
const shortcuts = [
  { keys: 'Ctrl/⌘ + Enter', desc: '运行 / 生成' },
  { keys: 'Ctrl/⌘ + S', desc: '保存工作流' },
  { keys: 'Ctrl/⌘ + O', desc: '载入工作流' },
  { keys: 'Ctrl/⌘ + A', desc: '全选节点' },
  { keys: 'Ctrl/⌘ + C / V', desc: '复制 / 粘贴' },
  { keys: 'Ctrl/⌘ + D', desc: '复制选中节点' },
  { keys: 'Ctrl/⌘ + B / M', desc: '跳过(Bypass)节点' },
  { keys: 'Ctrl/⌘ + Z / ⇧Z', desc: '撤销 / 重做' },
  { keys: 'Delete / ⌫', desc: '删除选中' },
  { keys: '. 或 F', desc: '适应视图' },
  { keys: '右键 / 双击空白', desc: '添加节点菜单' },
  { keys: '拖线到空白', desc: '添加并连接节点' },
  { keys: '?', desc: '显示 / 隐藏帮助' }
]

function isTyping() {
  const el = document.activeElement
  return el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable)
}

function onKey(e) {
  if (e.key === 'Escape') {
    closeMenu()
    return
  }
  const typing = isTyping()
  const mod = e.ctrlKey || e.metaKey
  const k = e.key.toLowerCase()

  if (typing && !mod) return

  if (mod && e.key === 'Enter') return handle(e, runQueue)
  if (mod && k === 's') return handle(e, save)
  if (mod && k === 'o') return handle(e, load)
  if (mod && k === 'z') return handle(e, e.shiftKey ? redo : undo)
  if (mod && k === 'y') return handle(e, redo)
  if (typing) return
  if (mod && k === 'a') return handle(e, selectAll)
  if (mod && k === 'c') return copySelection()
  if (mod && k === 'v') return paste()
  if (mod && k === 'd') return handle(e, duplicate)
  if (mod && (k === 'b' || k === 'm')) return handle(e, toggleBypass)
  if (!mod && (e.key === 'Delete' || e.key === 'Backspace')) return handle(e, deleteSelected)
  if (!mod && (e.key === '.' || k === 'f')) return fitView({ padding: 0.2 })
  if (!mod && (e.key === '?' || (e.shiftKey && e.key === '/'))) showHelp.value = !showHelp.value
}
function handle(e, fn) {
  e.preventDefault()
  fn()
}

onPaneReady(() => {
  fitView({ padding: 0.2 })
  snapshot()
})

onMounted(() => {
  window.addEventListener('keydown', onKey)
  setTimeout(() => (hintVisible.value = false), 8000)
})
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKey)
  clearTimeout(toastTimer)
})
</script>

<template>
  <div
    ref="flowWrapper"
    class="flow-page relative w-full h-full"
    @drop="onDrop"
    @dragover="onDragOver"
    @dblclick="onWrapperDblClick"
  >
    <VueFlow
      :nodes="nodes"
      :edges="edges"
      :default-edge-options="{ animated: true, style: { stroke: '#57c7ff', strokeWidth: 2 } }"
      :connection-line-style="{ stroke: '#b083f0', strokeWidth: 2 }"
      :delete-key-code="null"
      :min-zoom="0.2"
      :max-zoom="2.5"
      :class="{ connecting: isConnecting }"
      class="w-full h-full"
      @pane-context-menu="onPaneContextMenu"
    >
      <template #node-plugin="props">
        <PluginNode :id="props.id" :data="props.data" :selected="props.selected" />
      </template>

      <Background :gap="22" pattern-color="#2b3a6b" :size="1.4" />
      <MiniMap pannable zoomable :node-color="miniColor" />
      <Controls position="bottom-right" />

      <!-- 顶部左：标题/返回 -->
      <Panel position="top-left" class="!m-3">
        <div
          class="flex items-center gap-2 rounded-xl bg-[#0f1530]/90 border border-white/10 px-3 py-2 backdrop-blur-sm shadow-lg"
        >
          <RouterLink
            to="/"
            class="!no-underline text-[13px] text-white/80 hover:text-white px-2 py-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            🦢 大鹅展示
          </RouterLink>
          <span class="w-px h-4 bg-white/15"></span>
          <span class="text-[13px] font-semibold text-white/90">🧩 无限画布</span>
        </div>
      </Panel>

      <!-- 顶部右：工具条 -->
      <Panel position="top-right" class="!m-3">
        <div class="flex flex-wrap justify-end items-center gap-2 max-w-[70vw]">
          <button class="tool-btn tool-primary" @click="runQueue">▶ 运行</button>
          <button class="tool-btn" @click="undo">↩ 撤销</button>
          <button class="tool-btn" @click="redo">↪ 重做</button>
          <button class="tool-btn" @click="save">💾 保存</button>
          <button class="tool-btn" @click="load">📂 载入</button>
          <button class="tool-btn" @click="fitView({ padding: 0.2 })">适应</button>
          <button class="tool-btn" @click="loadExample">示例</button>
          <button class="tool-btn" @click="clearAll">清空</button>
          <button class="tool-btn" @click="showHelp = !showHelp">? 快捷键</button>
        </div>
      </Panel>

      <!-- 桌面端：左侧插件面板 -->
      <Panel position="bottom-left" class="!m-3 hidden md:block">
        <div
          class="w-[190px] rounded-xl bg-[#0f1530]/90 border border-white/10 p-3 backdrop-blur-sm shadow-lg"
        >
          <p class="text-[12px] font-semibold text-white/80 mb-2">插件 · 拖到画布</p>
          <div class="flex flex-col gap-2">
            <div
              v-for="p in PLUGIN_LIST"
              :key="p.type"
              draggable="true"
              class="palette-item"
              :style="{ borderColor: p.accent + '55' }"
              @dragstart="onDragStart($event, p.type)"
              @click="addAtCenter(p.type)"
            >
              <span class="text-base">{{ p.icon }}</span>
              <span class="flex-1 text-[12px] text-white/85">{{ p.title }}</span>
              <span class="w-2 h-2 rounded-full" :style="{ background: p.accent }"></span>
            </div>
          </div>
        </div>
      </Panel>
    </VueFlow>

    <!-- 连线提示 -->
    <transition enter-active-class="transition-opacity duration-300" leave-active-class="transition-opacity duration-500" enter-from-class="opacity-0" leave-to-class="opacity-0">
      <div
        v-if="hintVisible"
        class="flow-page absolute top-16 left-1/2 -translate-x-1/2 z-30 rounded-full bg-[#0f1530]/90 border border-white/10 px-4 py-2 text-[12px] text-white/75 backdrop-blur-sm shadow-lg"
      >
        💡 连线：从节点<span class="text-[#57c7ff]">右侧圆点</span>拖到另一节点<span class="text-[#4fd1a5]">左侧圆点</span>；右键/双击空白添加节点；按 <b class="text-[#ffd23f]">?</b> 看快捷键
      </div>
    </transition>

    <!-- 添加节点搜索菜单 -->
    <div v-if="menu.open" class="fixed inset-0 z-50" @click="closeMenu" @contextmenu.prevent="closeMenu">
      <div
        class="absolute w-[220px] rounded-xl bg-[#0f1530]/97 border border-white/15 p-2 backdrop-blur-md shadow-2xl"
        :style="{ left: menu.x + 'px', top: menu.y + 'px' }"
        @click.stop
      >
        <input
          ref="menuQueryEl"
          v-model="menu.query"
          placeholder="搜索插件…"
          class="w-full mb-2 rounded-lg bg-black/40 border border-white/10 px-2.5 py-1.5 text-[12px] text-white/85 outline-none focus:border-[color:var(--accent-2)]"
          @keydown.enter="filteredPlugins[0] && choosePlugin(filteredPlugins[0].type)"
        />
        <div class="max-h-[240px] overflow-y-auto flex flex-col gap-1">
          <button
            v-for="p in filteredPlugins"
            :key="p.type"
            class="palette-item w-full text-left"
            :style="{ borderColor: p.accent + '55' }"
            @click="choosePlugin(p.type)"
          >
            <span class="text-base">{{ p.icon }}</span>
            <span class="flex-1 text-[12px] text-white/85">{{ p.title }}</span>
            <span class="w-2 h-2 rounded-full" :style="{ background: p.accent }"></span>
          </button>
          <p v-if="!filteredPlugins.length" class="px-2 py-3 text-center text-[12px] text-white/40">
            无匹配插件
          </p>
        </div>
      </div>
    </div>

    <!-- 快捷键帮助面板 -->
    <transition enter-active-class="transition-opacity duration-200" leave-active-class="transition-opacity duration-200" enter-from-class="opacity-0" leave-to-class="opacity-0">
      <div v-if="showHelp" class="flow-page fixed inset-0 z-50 flex items-center justify-center bg-black/50" @click="showHelp = false">
        <div class="w-[340px] max-w-[92vw] rounded-2xl bg-[#0f1530]/98 border border-white/15 p-5 shadow-2xl" @click.stop>
          <div class="flex items-center mb-3">
            <h3 class="text-[15px] font-semibold text-white/90">⌨️ 快捷键（参考 ComfyUI）</h3>
            <button class="ml-auto text-white/50 hover:text-white text-lg leading-none" @click="showHelp = false">×</button>
          </div>
          <ul class="flex flex-col gap-1.5">
            <li v-for="s in shortcuts" :key="s.keys" class="flex items-center justify-between text-[12px]">
              <span class="text-white/60">{{ s.desc }}</span>
              <kbd class="rounded bg-white/10 border border-white/10 px-2 py-0.5 text-white/85 font-mono text-[11px]">{{ s.keys }}</kbd>
            </li>
          </ul>
        </div>
      </div>
    </transition>

    <!-- 移动端：插件浮动按钮 + 抽屉 -->
    <div class="md:hidden">
      <button
        class="absolute bottom-4 left-4 z-40 rounded-full w-14 h-14 text-2xl text-white bg-gradient-to-br from-[#57c7ff] to-[#b083f0] shadow-xl active:scale-95 transition-transform"
        @click="mobilePaletteOpen = !mobilePaletteOpen"
      >
        ＋
      </button>
      <transition
        enter-active-class="transition-transform duration-300 ease-out"
        leave-active-class="transition-transform duration-200 ease-in"
        enter-from-class="translate-y-[130%]"
        leave-to-class="translate-y-[130%]"
      >
        <div v-if="mobilePaletteOpen" class="absolute left-3 right-3 bottom-24 z-40 flow-page">
          <div class="rounded-xl bg-[#0f1530]/95 border border-white/10 p-3 backdrop-blur-sm shadow-2xl">
            <p class="text-[12px] font-semibold text-white/80 mb-2">添加插件</p>
            <div class="grid grid-cols-2 gap-2">
              <button
                v-for="p in PLUGIN_LIST"
                :key="p.type"
                class="palette-item"
                :style="{ borderColor: p.accent + '55' }"
                @click="addAtCenter(p.type)"
              >
                <span class="text-base">{{ p.icon }}</span>
                <span class="flex-1 text-[12px] text-white/85">{{ p.title }}</span>
              </button>
            </div>
          </div>
        </div>
      </transition>
    </div>

    <!-- Toast -->
    <transition enter-active-class="transition-all duration-200" leave-active-class="transition-all duration-300" enter-from-class="opacity-0 translate-y-2" leave-to-class="opacity-0 translate-y-2">
      <div
        v-if="toastState.show"
        class="flow-page fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] rounded-full bg-[#0f1530]/95 border border-white/15 px-5 py-2.5 text-[13px] text-white/90 shadow-2xl"
      >
        {{ toastState.msg }}
      </div>
    </transition>
  </div>
</template>

<style scoped>
.flow-page {
  font-family: ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'PingFang SC',
    'Microsoft YaHei', sans-serif;
}
.flow-page:not(.absolute):not(.fixed) {
  background: radial-gradient(circle at 50% 30%, #131a33 0%, #080b18 70%);
}

.tool-btn {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.85);
  background: rgba(15, 21, 48, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 10px;
  padding: 7px 12px;
  cursor: pointer;
  backdrop-filter: blur(4px);
  transition: background 0.15s, border-color 0.15s;
}
.tool-btn:hover {
  background: rgba(87, 199, 255, 0.18);
  border-color: rgba(87, 199, 255, 0.5);
}
.tool-primary {
  background: linear-gradient(90deg, #57c7ff, #b083f0);
  border-color: transparent;
  color: #fff;
  font-weight: 600;
}
.tool-primary:hover {
  opacity: 0.92;
  background: linear-gradient(90deg, #57c7ff, #b083f0);
}

.palette-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.03);
  cursor: grab;
  transition: transform 0.12s, background 0.15s;
}
.palette-item:hover {
  background: rgba(255, 255, 255, 0.08);
  transform: translateY(-1px);
}
.palette-item:active {
  cursor: grabbing;
}
</style>
