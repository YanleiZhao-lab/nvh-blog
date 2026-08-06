# 博客写作指南

## 新建一篇文章

只需在 `src/content/blog/` 目录下创建一个 `.md` 文件：

```bash
# 文件名就是 URL 路径，例如 my-article.md → /blog/my-article/
touch src/content/blog/my-article.md
```

## Frontmatter 模板

每篇文章开头必须包含：

```yaml
---
title: "文章标题"
description: "一句话描述，显示在列表和 SEO meta 中"
date: 2026-08-06          # 发布日期
category: "研究笔记"       # 分类（研究笔记/工程案例/测试方法/工具更新）
tags: ["标签1", "标签2"]   # 标签数组
status: "可发布"           # 可发布 / 准备中 / 规划中 / 后续接入
author: "作者名"
discussionUrl: "/forum/"  # 可选：讨论链接
---
```

## 正文 Markdown

支持标准 Markdown 语法：

```markdown
## 二级标题
### 三级标题

**加粗** *斜体* `行内代码`

- 列表项
- 列表项

> 引用块

[链接文本](https://example.com)

| 表头 | 表头 |
|------|------|
| 内容 | 内容 |

\`\`\`python
# 代码块（自动语法高亮）
print("hello")
\`\`\`
```

## 发布

```bash
# 写完后重新构建部署
cd /opt/ai-services/nvhtest
docker compose up -d --build
```

## 文件命名规范

- 使用英文 kebab-case：`fft-window-functions.md`
- 不要用中文文件名或空格
- 文件名 = URL slug
