<script setup>
import { palettes, applyPalette } from '../editorStore.js'
</script>

<template>
  <div class="flex flex-col items-center gap-2">
    <span class="text-[8px] text-[color:var(--accent)]">配色搭配</span>
    <div class="flex flex-wrap justify-center gap-2.5">
      <button v-for="p in palettes" :key="p.name" class="palette-btn" @click="applyPalette(p)">
        <span class="flex gap-[3px]">
          <i v-for="(c, i) in p.dots" :key="i" class="palette-swatch" :style="{ background: c }"></i>
        </span>
        <span class="text-[7px]">{{ p.name }}</span>
      </button>
    </div>
  </div>
</template>
