<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import { PixelGooseScene } from './three/PixelGooseScene.js'

const canvasHost = ref(null)
const pixelSize = ref(5)
const autoRotate = ref(true)
let scene = null

onMounted(() => {
  scene = new PixelGooseScene(canvasHost.value)
})

onBeforeUnmount(() => {
  scene?.dispose()
  scene = null
})

watch(pixelSize, (v) => scene?.setPixelSize(Number(v)))
watch(autoRotate, (v) => scene?.setAutoRotate(v))
</script>

<template>
  <div class="stage">
    <div ref="canvasHost" class="canvas-host"></div>

    <header class="hud hud-top">
      <h1 class="title">🦢 PIXEL GOOSE</h1>
      <p class="subtitle">一只白色大鹅 · 3D 展示</p>
    </header>

    <aside class="hud panel">
      <p class="panel-line">拖拽 <b>旋转</b></p>
      <p class="panel-line">滚轮 <b>缩放</b></p>
      <p class="panel-line">右键 <b>平移</b></p>

      <label class="ctrl">
        <span>像素颗粒 {{ pixelSize }}</span>
        <input type="range" min="1" max="12" step="1" v-model="pixelSize" />
      </label>

      <label class="ctrl ctrl-row">
        <input type="checkbox" v-model="autoRotate" />
        <span>自动旋转</span>
      </label>
    </aside>

    <footer class="hud hud-bottom">
      <span class="blink">▶</span> Vue3 + Three.js
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

.hud {
  position: absolute;
  z-index: 2;
  text-shadow: 2px 2px 0 #05060f;
  user-select: none;
  pointer-events: none;
}

.hud-top {
  top: 22px;
  left: 24px;
}

.title {
  font-size: 22px;
  letter-spacing: 1px;
  color: var(--accent);
  line-height: 1.4;
}

.subtitle {
  margin-top: 10px;
  font-size: 9px;
  color: var(--accent-2);
  line-height: 1.6;
}

.panel {
  top: 22px;
  right: 24px;
  padding: 16px 18px;
  background: var(--panel);
  border: 3px solid #2b3a6b;
  box-shadow: 6px 6px 0 rgba(0, 0, 0, 0.4);
  pointer-events: auto;
  min-width: 190px;
}

.panel-line {
  font-size: 9px;
  line-height: 2;
  color: var(--ink);
}

.panel-line b {
  color: var(--accent);
}

.ctrl {
  display: block;
  margin-top: 14px;
  font-size: 9px;
  color: var(--accent-2);
}

.ctrl > span {
  display: block;
  margin-bottom: 8px;
}

.ctrl-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.ctrl-row > span {
  margin: 0;
}

input[type='range'] {
  width: 100%;
  accent-color: var(--accent);
  cursor: pointer;
}

input[type='checkbox'] {
  width: 16px;
  height: 16px;
  accent-color: var(--accent);
  cursor: pointer;
}

.hud-bottom {
  bottom: 20px;
  left: 24px;
  font-size: 9px;
  color: #8fa3d6;
}

.blink {
  color: var(--accent);
  animation: blink 1s steps(2, start) infinite;
}

@keyframes blink {
  50% {
    opacity: 0;
  }
}

@media (max-width: 640px) {
  .title {
    font-size: 15px;
  }
  .panel {
    min-width: 150px;
    padding: 12px;
  }
}
</style>
