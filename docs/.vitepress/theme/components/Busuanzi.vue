<template>
  <div class="busuanzi-footer" v-if="show">
    <span>
      本站访客数 <strong>{{ siteVisitor }}</strong> 人次
    </span>
    <span class="divider">|</span>
    <span>
      本站总访问量 <strong>{{ sitePv }}</strong> 次
    </span>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { inBrowser } from 'vitepress'

const show = ref(false)
const siteVisitor = ref('...')
const sitePv = ref('...')

onMounted(() => {
  if (!inBrowser) return
  // 动态加载不蒜子
  const existingScript = document.querySelector('#busuanzi-js')
  if (existingScript) existingScript.remove()

  const script = document.createElement('script')
  script.id = 'busuanzi-js'
  script.async = true
  script.src = 'https://busuanzi.ibruce.info/busuanzi/2.3/busuanzi.pure.mini.js'
  document.head.appendChild(script)

  script.onload = () => {
    if (window.busuanzi) {
      window.busuanzi.fetch()
      setTimeout(() => {
        siteVisitor.value = window.busuanzi?.site_uv || '...'
        sitePv.value = window.busuanzi?.site_pv || '...'
        show.value = true
      }, 500)
    }
  }
})
</script>

<style scoped>
.busuanzi-footer {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 16px 0;
  margin-top: 24px;
  font-size: 13px;
  color: var(--vp-c-text-3);
}
.busuanzi-footer strong {
  color: var(--vp-c-brand-1);
  font-weight: 700;
}
.divider {
  opacity: 0.5;
}
</style>
