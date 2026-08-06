import DefaultTheme from 'vitepress/theme'
import { h, onMounted, watch, nextTick } from 'vue'
import { useRoute, useData } from 'vitepress'
import mediumZoom from 'medium-zoom'
import './style/custom.css'

import ArticleMetadata from './components/ArticleMetadata.vue'
import GiscusComment from './components/GiscusComment.vue'
import Busuanzi from './components/Busuanzi.vue'
import MNavLinks from './components/MNavLinks.vue'

export default {
  extends: DefaultTheme,

  Layout: () => {
    const props: Record<string, any> = {}
    const { frontmatter } = useData()

    return h(DefaultTheme.Layout, props, {
      // 文章标题下方插入元数据（字数/阅读时间）
      'doc-before': () => h(ArticleMetadata),

      // 文章底部插入评论
      'doc-after': () => h(GiscusComment),

      // 页脚插入访客统计
      'layout-bottom': () => h(Busuanzi),
    })
  },

  enhanceApp({ app }) {
    // 全局注册 MNavLinks，使 nav 页面可使用 <MNavLinks />
    app.component('MNavLinks', MNavLinks)
  },

  setup() {
    const route = useRoute()
    const initZoom = () => {
      mediumZoom('.vp-doc img:not(.no-zoom):not(.VPImage)', {
        background: 'var(--vp-c-bg)',
      })
    }
    onMounted(() => {
      initZoom()
    })
    watch(
      () => route.path,
      () => nextTick(() => initZoom())
    )
  },
}
