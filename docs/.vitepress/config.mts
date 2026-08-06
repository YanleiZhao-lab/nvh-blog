import { defineConfig } from 'vitepress'

export default defineConfig({
  lang: 'zh-CN',
  title: 'NVH Test',
  description: 'NVH 工程研究与知识社区',
  lastUpdated: true,
  appearance: 'dark',
  cleanUrls: true,
  base: '/blog/',

  head: [
    ['link', { rel: 'icon', href: '/blog/logo.svg' }],
    ['meta', { name: 'theme-color', content: '#2f81f7' }],
  ],

  themeConfig: {
    logo: '/blog/logo.svg',
    siteTitle: 'NVH Test',

    nav: [
      { text: '首页', link: '/blog/' },
      { text: '博客', link: '/blog/posts/' },
      { text: '导航', link: '/blog/nav/' },
      { text: 'NVH百宝箱', link: 'https://nvhtest.cn' },
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/YanleiZhao-lab/nvh-blog' },
    ],

    search: {
      provider: 'local',
      options: {
        locales: {
          root: {
            translations: {
              button: {
                buttonText: '搜索文章',
                buttonAriaLabel: '搜索文章',
              },
              modal: {
                noResultsText: '无法找到相关结果',
                resetButtonTitle: '清除查询条件',
                footer: {
                  selectText: '选择',
                  navigateText: '切换',
                },
              },
            },
          },
        },
      },
    },

    outline: {
      level: [2, 3],
      label: '本页目录',
    },

    docFooter: {
      prev: '上一篇',
      next: '下一篇',
    },

    lastUpdated: {
      text: '最后更新',
      formatOptions: {
        dateStyle: 'short',
        timeStyle: 'medium',
      },
    },

    editLink: {
      pattern: 'https://github.com/YanleiZhao-lab/nvh-blog/edit/main/docs/:path',
      text: '在 GitHub 上编辑此页',
    },

    footer: {
      message: '基于 VitePress + 飞书同步 + Docker 部署',
      copyright: `Copyright © 2024-${new Date().getFullYear()} NVH Test`,
    },

    sidebarMenuLabel: '目录',
    returnToTopLabel: '返回顶部',
    darkModeSwitchLabel: '深浅模式',
  },
})
