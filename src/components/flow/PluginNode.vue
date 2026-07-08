<script setup>
import { computed } from 'vue'
import { Handle, Position } from '@vue-flow/core'
import { PLUGINS } from './plugins.js'

const props = defineProps({
  id: { type: String, required: true },
  data: { type: Object, required: true },
  selected: { type: Boolean, default: false }
})

const meta = computed(() => PLUGINS[props.data.type] || PLUGINS.prompt)
</script>

<template>
  <div
    class="flow-node w-[220px] rounded-xl border-2 bg-[#0f1530]/95 backdrop-blur-sm shadow-[0_8px_24px_rgba(0,0,0,0.45)] overflow-hidden transition-shadow"
    :style="{ borderColor: selected ? meta.accent : 'rgba(87,199,255,0.25)' }"
  >
    <!-- 输入/输出连接点 -->
    <Handle
      v-if="meta.hasIn"
      type="target"
      :position="Position.Left"
      :style="{ background: meta.accent, width: '11px', height: '11px', border: '2px solid #0f1530' }"
    />
    <Handle
      v-if="meta.hasOut"
      type="source"
      :position="Position.Right"
      :style="{ background: meta.accent, width: '11px', height: '11px', border: '2px solid #0f1530' }"
    />

    <!-- 头部 -->
    <div
      class="flex items-center gap-2 px-3 py-2 border-b border-white/10"
      :style="{ background: `linear-gradient(90deg, ${meta.accent}22, transparent)` }"
    >
      <span class="text-base leading-none">{{ meta.icon }}</span>
      <span class="text-[13px] font-semibold text-white/90">{{ data.title || meta.title }}</span>
      <span
        class="ml-auto w-2 h-2 rounded-full"
        :style="{ background: meta.accent }"
      ></span>
    </div>

    <!-- 主体（按类型渲染） -->
    <div class="p-3 text-[11px] text-white/70">
      <template v-if="meta.body === 'upload'">
        <div
          class="nodrag flex flex-col items-center justify-center gap-1.5 h-24 rounded-lg border-2 border-dashed border-white/15 text-white/40 cursor-pointer hover:border-white/30 hover:text-white/60 transition-colors"
        >
          <span class="text-2xl">⬆️</span>
          <span>点击或拖拽上传素材</span>
        </div>
        <p class="mt-2 text-white/35">{{ meta.hint }}</p>
      </template>

      <template v-else-if="meta.body === 'textarea'">
        <textarea
          v-model="data.text"
          rows="4"
          :placeholder="meta.hint"
          class="nodrag w-full resize-none rounded-lg bg-black/30 border border-white/10 px-2 py-1.5 text-white/80 outline-none focus:border-[color:var(--accent-2)]"
        ></textarea>
      </template>

      <template v-else-if="meta.body === 'image'">
        <label class="block text-white/40 mb-1">模型</label>
        <select
          v-model="data.model"
          class="nodrag w-full rounded-lg bg-black/30 border border-white/10 px-2 py-1.5 text-white/80 outline-none"
        >
          <option>ChatGPT Image</option>
          <option>Midjourney</option>
          <option>SDXL</option>
        </select>
        <div class="mt-2 flex gap-2 text-white/40">
          <span class="rounded bg-white/10 px-1.5 py-0.5">9:16</span>
          <span class="rounded bg-white/10 px-1.5 py-0.5">2K</span>
        </div>
        <button
          class="nodrag mt-2.5 w-full rounded-lg py-1.5 text-white font-semibold bg-gradient-to-r from-[#57c7ff] to-[#b083f0] hover:opacity-90 transition-opacity"
        >
          生成图像
        </button>
      </template>

      <template v-else-if="meta.body === 'video'">
        <div class="grid grid-cols-2 gap-2">
          <div>
            <label class="block text-white/40 mb-1">时长</label>
            <select
              v-model="data.duration"
              class="nodrag w-full rounded-lg bg-black/30 border border-white/10 px-2 py-1.5 text-white/80 outline-none"
            >
              <option>5 秒</option>
              <option>10 秒</option>
              <option>15 秒</option>
            </select>
          </div>
          <div>
            <label class="block text-white/40 mb-1">比例</label>
            <select
              v-model="data.ratio"
              class="nodrag w-full rounded-lg bg-black/30 border border-white/10 px-2 py-1.5 text-white/80 outline-none"
            >
              <option>9:16</option>
              <option>16:9</option>
              <option>1:1</option>
            </select>
          </div>
        </div>
        <button
          class="nodrag mt-2.5 w-full rounded-lg py-1.5 text-white font-semibold bg-gradient-to-r from-[#b083f0] to-[#ff9ec4] hover:opacity-90 transition-opacity"
        >
          一键生成视频
        </button>
      </template>
    </div>
  </div>
</template>
