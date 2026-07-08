<script setup>
import { ref } from 'vue'
import { VueFlow, useVueFlow, Panel } from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import { Controls } from '@vue-flow/controls'
import { MiniMap } from '@vue-flow/minimap'
import PluginNode from '../components/flow/PluginNode.vue'
import { PLUGINS, PLUGIN_LIST } from '../components/flow/plugins.js'

const {
  onConnect,
  addEdges,
  addNodes,
  setNodes,
  setEdges,
  screenToFlowCoordinate,
  fitView
} = useVueFlow()

const flowWrapper = ref(null)
const mobilePaletteOpen = ref(false)

let seq = 0
const genId = (type) => `${type}-${Date.now()}-${seq++}`

function defaultData(type) {
  const base = { type, title: PLUGINS[type]?.title }
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

onConnect((params) => addEdges(params))

// 拖拽添加
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
}

// 点击添加（移动端友好）：加到画布中心附近
function addAtCenter(type) {
  const rect = flowWrapper.value?.getBoundingClientRect()
  const screen = rect
    ? { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
    : { x: window.innerWidth / 2, y: window.innerHeight / 2 }
  const position = screenToFlowCoordinate(screen)
  position.x += (Math.random() - 0.5) * 80
  position.y += (Math.random() - 0.5) * 80
  addNodes({ id: genId(type), type: 'plugin', position, data: defaultData(type) })
  mobilePaletteOpen.value = false
}

function clearAll() {
  setNodes([])
  setEdges([])
}
function loadExample() {
  setNodes(exampleNodes.map((n) => ({ ...n, data: defaultData(n.data.type) })))
  setEdges(exampleEdges.map((e) => ({ ...e })))
  setTimeout(() => fitView({ padding: 0.2 }), 60)
}

const miniColor = (n) => PLUGINS[n.data?.type]?.accent || '#57c7ff'
</script>

<template>
  <div ref="flowWrapper" class="flow-page relative w-full h-full" @drop="onDrop" @dragover="onDragOver">
    <VueFlow
      :nodes="nodes"
      :edges="edges"
      :default-edge-options="{ animated: true, style: { stroke: '#57c7ff', strokeWidth: 2 } }"
      :connection-line-style="{ stroke: '#b083f0', strokeWidth: 2 }"
      :min-zoom="0.2"
      :max-zoom="2.5"
      fit-view-on-init
      class="w-full h-full"
    >
      <template #node-plugin="props">
        <PluginNode :id="props.id" :data="props.data" :selected="props.selected" />
      </template>

      <Background :gap="22" pattern-color="#2b3a6b" :size="1.4" />
      <MiniMap pannable zoomable :node-color="miniColor" />
      <Controls position="bottom-right" />

      <!-- 顶部工具条 -->
      <Panel position="top-left" class="!m-3">
        <div class="flex items-center gap-2 rounded-xl bg-[#0f1530]/90 border border-white/10 px-3 py-2 backdrop-blur-sm shadow-lg">
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

      <Panel position="top-right" class="!m-3">
        <div class="flex items-center gap-2">
          <button class="tool-btn" @click="fitView({ padding: 0.2 })">适应视图</button>
          <button class="tool-btn" @click="loadExample">示例流程</button>
          <button class="tool-btn" @click="clearAll">清空</button>
        </div>
      </Panel>

      <!-- 桌面端：左侧插件面板 -->
      <Panel position="bottom-left" class="!m-3 hidden md:block">
        <div class="w-[190px] rounded-xl bg-[#0f1530]/90 border border-white/10 p-3 backdrop-blur-sm shadow-lg">
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
        <div v-if="mobilePaletteOpen" class="absolute left-3 right-3 bottom-24 z-40">
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
  </div>
</template>

<style scoped>
/* 画布页用可读的无衬线字体（覆盖全局像素字体） */
.flow-page {
  font-family: ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'PingFang SC',
    'Microsoft YaHei', sans-serif;
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
