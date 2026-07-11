<script setup>
import { state, presets, setView, setPreset, toggleDestroyMode, resetGoose } from '../editorStore.js'
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

    <div class="seg">
      <button :class="{ on: state.destroyMode }" @click="toggleDestroyMode()">
        🔨 拆家模式
      </button>
      <button @click="resetGoose()">🪄 复原</button>
    </div>

    <div class="seg">
      <RouterLink to="/canvas" class="!no-underline text-[color:var(--ink)] px-3 py-2.5 text-[8px] whitespace-nowrap hover:bg-[rgba(87,199,255,0.18)]">
        🧩 无限画布
      </RouterLink>
    </div>
  </div>
</template>
