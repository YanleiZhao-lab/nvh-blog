# NVH Test Blog

NVH 工程研究博客 — VitePress + 飞书同步 + Docker 部署

## 架构

```
飞书写文章 → Elog 同步到 GitHub → VPS Docker 自动构建部署
```

## 目录结构

```
├── docs/                 # VitePress 内容目录（飞书同步目标）
│   ├── .vitepress/       # VitePress 配置 + 主题
│   ├── *.md              # 文章
│   └── public/           # 静态资源
├── Dockerfile            # Docker 构建文件
├── docker-compose.yml    # Docker Compose 编排
└── .github/workflows/    # GitHub Actions（可选 CI/CD）
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

## 许可证

MIT
