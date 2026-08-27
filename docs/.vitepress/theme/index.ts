import DefaultTheme from 'vitepress/theme'
import { h, onMounted, watch, nextTick, createApp } from 'vue'
import { useRoute, useData } from 'vitepress'
import mediumZoom from 'medium-zoom'
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
import PyodideRunner from './components/PyodideRunner.vue'

// 彩虹背景动画
let homePageStyle: HTMLStyleElement | undefined

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
  app.component('PyodideRunner', PyodideRunner)

    if (inBrowser) {
      NProgress.configure({ showSpinner: false })

      // 彩虹动画：首页注入 animation，离开时移除
      router.onBeforeRouteChange = () => {
        NProgress.start()
      }
      router.onAfterRouteChanged = () => {
        busuanzi.fetch()
        NProgress.done()
        updateHomePageStyle(location.pathname.replace('/blog/', '/') === '/' || location.pathname === '/blog/')
      }

      // 初始加载时检查
      updateHomePageStyle(location.pathname.replace('/blog/', '/') === '/' || location.pathname === '/blog/')
    }
  },

  setup() {
    const route = useRoute()
    const { frontmatter } = useData()

    const initZoom = () => {
      mediumZoom('.main img', { background: 'var(--vp-c-bg)' })
    }

    const enhancePythonBlocks = () => {
      document.querySelectorAll('div.language-python:not([data-run-enhanced])').forEach(el => {
        el.setAttribute('data-run-enhanced', '1')
        const code = el.querySelector('pre')?.textContent || ''
        if (!code.trim()) return
        // 跳过太长的代码（>60行不增强）
        if (code.split('\n').length > 60) return
        const mount = document.createElement('div')
        el.parentElement.insertBefore(mount, el.nextSibling)
        // 用 Vue 动态挂载
        try {
          const app = createApp(PyodideRunner, { code })
          app.mount(mount)
        } catch (e) { console.warn('pyodide enhance skip', e) }
      })
    }

    onMounted(() => {
      initZoom()
      nextTick(() => enhancePythonBlocks())

      // 首页彩虹动画
      const isHome = location.pathname === '/blog/' || location.pathname === '/blog'
      updateHomePageStyle(isHome)

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
      () => {
        nextTick(() => { initZoom(); enhancePythonBlocks() })
        const isHome = route.path === '/' || route.path === '/blog/'
        updateHomePageStyle(isHome)
      }
    )
  },
}

// 彩虹背景动画：动态注入/移除 CSS animation
function updateHomePageStyle(value: boolean) {
  if (value) {
    if (homePageStyle) return
    homePageStyle = document.createElement('style')
    homePageStyle.innerHTML = `:root { animation: rainbow 12s linear infinite; }`
    document.body.appendChild(homePageStyle)
  } else {
    if (!homePageStyle) return
    homePageStyle.remove()
    homePageStyle = undefined
  }
}
