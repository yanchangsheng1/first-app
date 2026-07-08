<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import gsap from 'gsap'
import { PixelGooseScene } from './three/PixelGooseScene.js'
import { bindScene } from './editorStore.js'
import ViewBar from './components/ViewBar.vue'
import LayersPanel from './components/LayersPanel.vue'
import PropertiesPanel from './components/PropertiesPanel.vue'
import PalettesPanel from './components/PalettesPanel.vue'

const canvasHost = ref(null)
const topBarEl = ref(null)
const leftEl = ref(null)
const rightEl = ref(null)
const bottomEl = ref(null)

// 移动端底部面板：null | 'layers' | 'props' | 'palettes'
const mobilePanel = ref(null)

const mobileTabs = [
  { key: 'layers', label: '图层' },
  { key: 'props', label: '属性' },
  { key: 'palettes', label: '配色' }
]

let scene = null

onMounted(() => {
  scene = new PixelGooseScene(canvasHost.value)
  bindScene(scene)
  nextTick(introAnim)
})

onBeforeUnmount(() => {
  scene?.dispose()
  scene = null
})

function introAnim() {
  const tl = gsap.timeline({ defaults: { ease: 'power3.out', duration: 0.7 } })
  tl.from(topBarEl.value, { y: -50, opacity: 0 })
  if (leftEl.value) tl.from(leftEl.value, { x: -60, opacity: 0 }, '-=0.4')
  if (rightEl.value) tl.from(rightEl.value, { x: 60, opacity: 0 }, '-=0.6')
  if (bottomEl.value) tl.from(bottomEl.value, { y: 60, opacity: 0 }, '-=0.6')
}

function toggleMobile(key) {
  mobilePanel.value = mobilePanel.value === key ? null : key
}
</script>

<template>
  <div class="relative w-full h-full overflow-hidden">
    <div ref="canvasHost" class="absolute inset-0"></div>

    <!-- 顶部：视角控制（桌面 + 移动端通用） -->
    <header ref="topBarEl" class="absolute top-3 left-3 right-3 z-40">
      <ViewBar />
    </header>

    <!-- 桌面端：左侧部件栏 -->
    <aside
      ref="leftEl"
      class="pixel-panel p-3.5 z-30 hidden md:block absolute top-[80px] left-4 w-[196px]"
    >
      <LayersPanel />
    </aside>

    <!-- 桌面端：右侧属性栏 -->
    <aside
      ref="rightEl"
      class="pixel-panel p-3.5 z-30 hidden md:block absolute top-[80px] right-4 w-[212px] max-h-[calc(100vh-120px)] overflow-y-auto"
    >
      <PropertiesPanel />
    </aside>

    <!-- 桌面端：中间底部配色 -->
    <footer
      ref="bottomEl"
      class="pixel-panel px-4 py-3 z-30 hidden md:block absolute bottom-4 left-1/2 -translate-x-1/2 max-w-[calc(100vw-40px)]"
    >
      <PalettesPanel />
    </footer>

    <!-- 移动端：上滑面板 -->
    <div class="md:hidden">
      <transition
        enter-active-class="transition-transform duration-300 ease-out"
        leave-active-class="transition-transform duration-200 ease-in"
        enter-from-class="translate-y-[130%]"
        leave-to-class="translate-y-[130%]"
      >
        <div
          v-if="mobilePanel"
          class="absolute left-2 right-2 bottom-[54px] z-40"
        >
          <div class="pixel-panel p-3.5 max-h-[52vh] overflow-y-auto">
            <LayersPanel v-if="mobilePanel === 'layers'" />
            <PropertiesPanel v-else-if="mobilePanel === 'props'" />
            <PalettesPanel v-else-if="mobilePanel === 'palettes'" />
          </div>
        </div>
      </transition>

      <!-- 移动端：底部导航 -->
      <nav
        class="absolute bottom-0 left-0 right-0 z-50 flex bg-[color:var(--panel)] border-t-[3px] border-[color:var(--edge)] backdrop-blur-sm"
      >
        <button
          v-for="t in mobileTabs"
          :key="t.key"
          class="mobile-nav-btn"
          :class="{ on: mobilePanel === t.key }"
          @click="toggleMobile(t.key)"
        >
          {{ t.label }}
        </button>
      </nav>
    </div>
  </div>
</template>
