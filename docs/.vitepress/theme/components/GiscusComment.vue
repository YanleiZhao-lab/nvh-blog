<template>
  <div class="giscus-wrapper" ref="wrapper" v-if="showComment"></div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useRoute, useData } from 'vitepress'

const route = useRoute()
const { frontmatter } = useData()
const wrapper = ref(null)

const showComment = computed(() => {
  return frontmatter.value?.comment !== false && !frontmatter.value?.layout
})

function loadGiscus() {
  if (!wrapper.value) return
  // 清除旧的
  wrapper.value.innerHTML = ''
  // 移除旧的消息监听
  window.removeEventListener('message', handleMessage)

  const script = document.createElement('script')
  script.src = 'https://giscus.app/client.js'
  script.setAttribute('data-repo', 'YanleiZhao-lab/nvh-blog')
  script.setAttribute('data-repo-id', 'R_kgDOTv4fGQ')
  script.setAttribute('data-category', 'Announcements')
  script.setAttribute('data-category-id', 'DIC_kwDOTv4fGc4DC0BQ')
  script.setAttribute('data-mapping', 'pathname')
  script.setAttribute('data-strict', '0')
  script.setAttribute('data-reactions-enabled', '1')
  script.setAttribute('data-emit-metadata', '0')
  script.setAttribute('data-input-position', 'top')
  script.setAttribute('data-theme', document.documentElement.classList.contains('dark') ? 'dark_dimmed' : 'light')
  script.setAttribute('data-lang', 'zh-CN')
  script.setAttribute('data-loading', 'lazy')
  script.crossOrigin = 'anonymous'
  script.async = true
  wrapper.value.appendChild(script)
}

function handleMessage(event) {
  if (event.origin !== 'https://giscus.app') return
  // 主题切换时重新加载
}

onMounted(() => {
  setTimeout(loadGiscus, 500)
})

watch(() => route.path, () => {
  nextTick(() => {
    setTimeout(loadGiscus, 500)
  })
})
</script>

<style>
.giscus-wrapper {
  margin-top: 3rem;
  padding-top: 1.5rem;
}
</style>
