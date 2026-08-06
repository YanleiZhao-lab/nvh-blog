---
title: "Docker 部署入口"
description: "本地预览 web、forum-preview，以及后续启用 api profile 的方式。"
date: 2026-07-20
category: "部署"
tags: ["Docker", "Compose", "Nginx"]
status: "可发布"
author: "NVH Test"
discussionUrl: "/forum/"
---

## 本地预览

```bash
docker compose up web forum-preview
```

访问：

- Web: `http://localhost:8080`
- Forum preview: `http://localhost:8081`

## 后端 mock

```bash
docker compose --profile api up
```

这会启动两套独立 mock API 和各自的 PostgreSQL / Redis。
