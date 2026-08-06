<template>
  <div class="article-metadata" v-if="showMeta">
    <span class="meta-item">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
      </svg>
      {{ formattedDate }}
    </span>
    <span class="meta-divider">·</span>
    <span class="meta-item">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
      </svg>
      字数 {{ wordCount }}
    </span>
    <span class="meta-divider">·</span>
    <span class="meta-item">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
      </svg>
      {{ readingTime }} 分钟阅读
    </span>
  </div>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue'
import { useData } from 'vitepress'

const { frontmatter, page } = useData()

// SSR-safe: only show meta for real posts (no custom layout)
const showMeta = computed(() => {
  return frontmatter.value && !frontmatter.value.layout
})

// --- DOM access wrapped in onMounted (SSR-safe) ---
const pageText = ref('')

onMounted(() => {
  const main = document.querySelector('.vp-doc') || document.querySelector('main')
  pageText.value = main ? main.textContent || '' : ''
})

// --- Computed values that depend on DOM ---
const wordCount = computed(() => {
  const text = pageText.value
  if (!text) return 0
  // 中文字符 + 英文单词
  const chinese = (text.match(/[\u4e00-\u9fa5]/g) || []).length
  const english = (text.replace(/[\u4e00-\u9fa5]/g, ' ').match(/[a-zA-Z]+/g) || []).length
  return chinese + english
})

const readingTime = computed(() => {
  const text = pageText.value
  if (!text) return 1
  const chinese = (text.match(/[\u4e00-\u9fa5]/g) || []).length
  const english = (text.replace(/[\u4e00-\u9fa5]/g, ' ').match(/[a-zA-Z]+/g) || []).length
  return Math.max(1, Math.ceil(chinese / 300 + english / 200))
})

// --- Date is frontmatter-only (SSR-safe) ---
const formattedDate = computed(() => {
  if (frontmatter.value?.date) {
    const d = new Date(frontmatter.value.date)
    return d.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })
  }
  if (frontmatter.value?.lastUpdated) {
    const d = new Date(frontmatter.value.lastUpdated)
    return d.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })
  }
  return new Date().toLocaleDateString('zh-CN')
})
</script>

<style scoped>
.article-metadata {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 4px;
  margin-bottom: 8px;
  font-size: 14px;
  color: var(--vp-c-text-2);
}
.meta-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
.meta-item svg {
  opacity: 0.6;
}
.meta-divider {
  color: var(--vp-c-divider);
  margin: 0 2px;
}
</style>
