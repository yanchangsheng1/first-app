<script setup>
import { state, presets, setView, setPreset } from '../editorStore.js'
</script>

<template>
  <div class="flex flex-wrap items-center gap-2 sm:gap-3">
    <span
      class="mr-auto text-[11px] sm:text-[14px] text-[color:var(--accent)] [text-shadow:2px_2px_0_#05060f]"
    >
      🦢 PIXEL GOOSE
    </span>

    <div class="seg">
      <button :class="{ on: state.view === '2d' }" @click="setView('2d')">2D</button>
      <button :class="{ on: state.view === '3d' }" @click="setView('3d')">3D</button>
    </div>

    <div class="seg">
      <button
        v-for="p in presets"
        :key="p.key"
        :class="{ on: state.preset === p.key }"
        @click="setPreset(p.key)"
      >
        {{ p.label }}
      </button>
    </div>
  </div>
</template>
