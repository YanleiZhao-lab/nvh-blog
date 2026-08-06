---
title: "服务边界"
description: "www、docs、channel、forum、api、ai-api 的职责和隔离规则。"
date: 2026-07-20
category: "架构"
tags: ["架构", "边界", "子域名"]
status: "可发布"
author: "NVH Test"
discussionUrl: "/forum/"
---

## 子域名

- `www.nvhtest.cn`: 门户、博客、频道入口。
- `docs.nvhtest.cn`: 知识库。
- `forum.nvhtest.cn`: Discourse。
- `api.nvhtest.cn`: 专业 NVH API。
- `ai-api.nvhtest.cn`: 通用 AI API 网关。

## 禁止混用

两套 API 不共用密钥、账单、日志、数据库或用户工作流。
