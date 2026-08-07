import DefaultTheme from 'vitepress/theme'
import { h, onMounted, watch, nextTick } from 'vue'
import { useRoute, useData } from 'vitepress'
import mediumZoom from 'medium-zoom'
import giscusTalk from 'vitepress-plugin-comment-with-giscus'
import { inBrowser } from 'vitepress'
import busuanzi from 'busuanzi.pure.js'
import { NProgress } from 'nprogress-v2/dist/index.js'
import 'nprogress-v2/dist/index.css'

import './style/index.css'

import MNavLinks from './components/MNavLinks.vue'
import ArticleMetadata from './components/ArticleMetadata.vue'
import Linkcard from './components/Linkcard.vue'
import MyLayout from './components/MyLayout.vue'
import HomeUnderline from './components/HomeUnderline.vue'
import confetti from './components/confetti.vue'

export default {
  extends: DefaultTheme,

  Layout: () => {
    const props: Record<string, any> = {}
    const { frontmatter } = useData()

    if (frontmatter.value?.layoutClass) {
      props.class = frontmatter.value.layoutClass
    }

    return h(MyLayout, props)
  },

  enhanceApp({ app, router }) {
    app.component('MNavLinks', MNavLinks)
    app.component('ArticleMetadata', ArticleMetadata)
    app.component('Linkcard', Linkcard)
    app.component('HomeUnderline', HomeUnderline)
    app.component('confetti', confetti)

    if (inBrowser) {
      NProgress.configure({ showSpinner: false })
      router.onBeforeRouteChange = () => {
        NProgress.start()
      }
      router.onAfterRouteChanged = () => {
        busuanzi.fetch()
        NProgress.done()
      }
    }
  },

  setup() {
    const route = useRoute()
    const { frontmatter } = useData()

    const initZoom = () => {
      mediumZoom('.main img', { background: 'var(--vp-c-bg)' })
    }

    onMounted(() => {
      initZoom()

      nextTick(() => {
        try {
          giscusTalk(
            {
              repo: 'YanleiZhao-lab/nvh-blog',
              repoId: 'R_kgDOTv4fGQ',
              category: 'Announcements',
              categoryId: 'DIC_kwDOTv4fGc4DC0BQ',
              mapping: 'pathname',
              inputPosition: 'bottom',
              lang: 'zh-CN',
            },
            {
              frontmatter,
              route,
            },
            true
          )
        } catch (e) {
          console.warn('Giscus init deferred:', e)
        }
      })
    })

    watch(
      () => route.path,
      () => nextTick(() => initZoom())
    )
  },
}
