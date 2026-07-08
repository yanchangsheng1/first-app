<script setup>
import { state, pickLayer } from '../editorStore.js'
</script>

<template>
  <div>
    <h2 class="pixel-title mb-3">部件图层</h2>
    <ul class="flex flex-col gap-1.5">
      <li
        v-for="l in state.layers"
        :key="l.name"
        class="layer-item"
        :class="{ active: state.selected === l.name }"
        @click="pickLayer(l.name)"
      >
        <span class="layer-dot" :style="{ background: state.layerColors[l.name] }"></span>
        <span>{{ l.label }}</span>
      </li>
    </ul>
    <p class="mt-3 text-[7px] leading-[1.7] text-[#8fa3d6]">点击模型或列表选中部件</p>
  </div>
</template>
