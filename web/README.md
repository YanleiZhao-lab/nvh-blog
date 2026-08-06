# web

`web/` 是 NVH Test 的 Astro 内容站。

## 内容目录

- `src/content/blog/`：研究笔记、工程案例、测试方法、工具更新。
- `src/content/channel/`：频道聚合条目。
- `src/content/docs/`：部署、站群架构、内容同步和服务边界文档。

Frontmatter 字段：

- `title`
- `description`
- `date`
- `category`
- `tags`
- `status`
- `author`
- `discussionUrl`

## 本地运行

```bash
npm install
npm run dev
```

## Docker

```bash
docker compose up web
```

`web` 只负责公开内容，不承载 API 运行逻辑、密钥、登录、付款或客户数据。
