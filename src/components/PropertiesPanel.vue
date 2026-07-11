<script setup>
import {
  state,
  finishes,
  selectedLayer,
  isOutline,
  setColor,
  setFinish,
  setPixel,
  setOutlineThickness,
  toggleOutline,
  toggleAuto
} from '../editorStore.js'
</script>

<template>
  <div>
    <h2 class="pixel-title mb-3">属性 · {{ selectedLayer.label }}</h2>

    <section class="mb-3.5">
      <label class="field-label">颜色</label>
      <div class="flex items-center gap-2.5">
        <input
          type="color"
          class="pixel-color"
          :value="state.layerColors[state.selected]"
          @input="setColor($event.target.value)"
        />
        <span class="text-[9px]">{{ (state.layerColors[state.selected] || '').toUpperCase() }}</span>
      </div>
    </section>

    <section class="mb-3.5">
      <label class="field-label">材质质感</label>
      <div class="seg w-full">
        <button
          v-for="f in finishes"
          :key="f.key"
          :class="{ on: state.finish === f.key }"
          @click="setFinish(f.key)"
        >
          {{ f.label }}
        </button>
      </div>
    </section>

    <section v-if="isOutline" class="mb-3.5">
      <label class="field-label">轮廓粗细 · {{ state.outlineThickness.toFixed(2) }}</label>
      <input
        type="range"
        class="pixel-range"
        min="0.4"
        max="2"
        step="0.05"
        :value="state.outlineThickness"
        @input="setOutlineThickness($event.target.value)"
      />
      <button class="pixel-toggle mt-2.5" :class="{ on: state.outlineVisible }" @click="toggleOutline">
        {{ state.outlineVisible ? '轮廓：显示' : '轮廓：隐藏' }}
      </button>
    </section>

    <hr class="my-3.5 border-0 border-t-2 border-dashed border-[color:var(--edge)]" />

    <section class="mb-3.5">
      <label class="field-label">像素颗粒 · {{ state.pixelSize }}</label>
      <input
        type="range"
        class="pixel-range"
        min="1"
        max="12"
        step="1"
        :value="state.pixelSize"
        @input="setPixel($event.target.value)"
      />
    </section>

    <section>
      <button class="pixel-toggle" :class="{ on: state.autoRotate }" @click="toggleAuto">
        {{ state.autoRotate ? '自动旋转：开' : '自动旋转：关' }}
      </button>
    </section>
  </div>
</template>
