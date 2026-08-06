# NVH Test Web 部署教程

## 1. 当前目录结构

```text
E:\AI\NVHtest\web
├── index.html
├── README.md
├── assets
│   └── styles.css
├── pages
│   ├── api.html
│   ├── blog.html
│   ├── channel.html
│   ├── docs.html
│   └── forum.html
└── docs
    ├── deployment-guide.md
    └── site-architecture.md
```

## 2. 本地预览

```powershell
cd E:\AI\NVHtest\web
python -m http.server 8080
```

浏览器访问：

```text
http://localhost:8080
```

## 3. 建议发布方式

长期规划下，`web` 最好单独作为一个前台仓库：

- 仓库名建议：`nvhtest-web`
- 免费部署建议：GitHub Pages 或 Cloudflare Pages

## 4. GitHub Pages 部署

1. 新建 GitHub 仓库：`nvhtest-web`
2. 把 `E:\AI\NVHtest\web` 目录中的全部文件上传到仓库根目录
3. 打开仓库 `Settings -> Pages`
4. Source 选择 `Deploy from a branch`
5. Branch 选择 `main`，目录选择 `/root`
6. 保存并等待发布

发布后地址通常是：

```text
https://你的用户名.github.io/nvhtest-web/
```

## 5. Cloudflare Pages 部署

1. 登录 Cloudflare
2. 打开 `Workers & Pages`
3. 创建 Pages 项目
4. 连接 GitHub 上的 `nvhtest-web`
5. 构建设置：

```text
Framework preset: None
Build command: 留空
Build output directory: /
Root directory: /
```

6. 点击部署

## 6. 前台子域名绑定建议

第一阶段可先只绑定：

```text
www.nvhtest.cn
```

如果你要拆得更清楚，可以继续绑定：

```text
blog.nvhtest.cn
docs.nvhtest.cn
channel.nvhtest.cn
```

但从长期规划看，这三个仍然属于前台 `web` 项目的一部分。

## 7. 不应继续混在前台项目里的服务

以下内容不建议长期放在 `web` 或 GitHub Pages 中：

- `api.nvhtest.cn`
- `ai-api.nvhtest.cn`
- `forum.nvhtest.cn`
- PostgreSQL
- Redis
- MinIO
- 登录态与计费系统

这些都应进入独立项目，并运行在服务器上。

## 8. 推荐上线顺序

1. 先单独发布 `web`
2. 再独立开发 `api`
3. 再独立开发 `ai-api`
4. 最后独立部署 `forum`
