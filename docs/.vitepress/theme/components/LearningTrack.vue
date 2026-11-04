<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  current: number | string
  total?: number | string
  prevHref?: string
  prevTitle?: string
  nextHref?: string
  nextTitle?: string
}>()

const total = computed(() => {
  const value = Number(props.total || 12)
  return Number.isFinite(value) && value > 0 ? value : 12
})
const current = computed(() => {
  const value = Number(props.current)
  return Number.isFinite(value) && value > 0 ? Math.min(value, total.value) : 1
})
const progress = computed(() => `${Math.min(100, Math.max(0, current.value / total.value * 100))}%`)
</script>

<template>
  <nav class="learning-track" aria-label="入门学习轨道">
    <div class="learning-track__header">
      <div>
        <span class="learning-track__eyebrow">学习路线</span>
        <strong class="learning-track__title">NVH 入门轨道</strong>
      </div>
      <div class="learning-track__count" :aria-label="`第 ${current} 篇，共 ${total} 篇`">
        <strong>{{ current }}</strong><span>/ {{ total }}</span>
      </div>
    </div>

    <div class="learning-track__progress" aria-hidden="true">
      <span :style="{ width: progress }"></span>
    </div>

    <div class="learning-track__links">
      <a v-if="prevHref" class="learning-track__link learning-track__link--prev" :href="prevHref">
        <span class="learning-track__label">← 上一篇</span>
        <strong>{{ prevTitle }}</strong>
      </a>
      <div v-else class="learning-track__state learning-track__state--start">
        <span class="learning-track__label">当前位置</span>
        <strong>从这里开始</strong>
      </div>

      <a v-if="nextHref" class="learning-track__link learning-track__link--next" :href="nextHref">
        <span class="learning-track__label">下一篇 →</span>
        <strong>{{ nextTitle }}</strong>
      </a>
      <div v-else class="learning-track__state learning-track__state--finish">
        <span class="learning-track__label">学习进度</span>
        <strong>已到达轨道终点</strong>
      </div>
    </div>
  </nav>
</template>
