<script setup lang="ts">
import type { NavLink } from '../untils/types'
import { computed } from 'vue'

const props = defineProps<{
  icon?: NavLink['icon']
  badge?: NavLink['badge']
  title: string
  desc?: string
  link: string
}>()

// 处理 icon 类型：string(emoji) 或 { svg }
const isSvg = computed(() => {
  return props.icon && typeof props.icon === 'object' && 'svg' in props.icon
})

// 处理 badge 类型
const badgeText = computed(() => {
  if (!props.badge) return ''
  if (typeof props.badge === 'string') return props.badge
  return props.badge.text || ''
})

const badgeType = computed(() => {
  if (!props.badge) return undefined
  if (typeof props.badge === 'string') return 'info'
  return props.badge.type || 'info'
})
</script>

<template>
  <a
    class="m-nav-link"
    :href="link"
    target="_blank"
    rel="noreferrer"
  >
    <article class="box">
      <!-- 图标区域 -->
      <div class="box-header">
        <template v-if="isSvg">
          <span class="icon" v-html="(icon as { svg: string }).svg"></span>
        </template>
        <template v-else-if="icon">
          <span class="icon emoji">{{ icon }}</span>
        </template>
        <h5 class="title" v-if="!badge">
          {{ title }}
        </h5>
        <h5 class="title" v-else>
          {{ title }}
          <Badge
            :type="badgeType"
            :text="badgeText"
          />
        </h5>
      </div>

      <!-- 描述 -->
      <p class="desc" v-if="desc">
        {{ desc }}
      </p>
    </article>
  </a>
</template>

<style scoped>
.m-nav-link {
  display: block;
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  height: 100%;
  background-color: var(--vp-c-bg);
  transition: all 0.3s;
  box-shadow: 0 0 1px rgba(0, 0, 0, 0.04);
}

.m-nav-link:hover {
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.08);
  transform: translateY(-5px);
  border-color: var(--vp-c-brand-1);
}

.box {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 16px;
}

.box-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  font-size: 24px;
  border-radius: 10px;
  background-color: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-1);
  flex-shrink: 0;
}

.icon :deep(svg) {
  width: 24px;
  height: 24px;
}

.emoji {
  font-size: 24px;
}

.title {
  font-size: 16px;
  font-weight: 600;
  line-height: 24px;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--vp-c-text-1);
}

.desc {
  font-size: 14px;
  line-height: 22px;
  margin: 0;
  color: var(--vp-c-text-2);
}
</style>
