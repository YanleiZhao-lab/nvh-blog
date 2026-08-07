# NVH Test Blog

NVH 工程研究博客，基于 VitePress + 飞书同步 + Docker 部署。

## 目录结构

```
docs/
├── .vitepress/
│   ├── config.mts         # VitePress 配置
│   └── theme/             # 主题组件和样式
│       ├── components/    # Vue 组件
│       ├── style/         # 模块化 CSS
│       └── index.ts       # 主题入口
├── posts/                 # 博客文章
├── nav/                   # 导航页
├── public/                # 静态资源
└── index.md               # 首页
```

## 本地开发

```bash
npm install
npm run docs:dev
```

## 部署

```bash
docker compose up -d --build
```

## 写作

飞书知识库写文章 → Elog 同步 → GitHub Actions 自动构建部署
