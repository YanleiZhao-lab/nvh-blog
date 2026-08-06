# api

`api/` 是专业 NVH API 的独立包。

当前实现是 FastAPI mock skeleton，用于验证 Docker、路由和服务边界。它不处理真实上传文件、不生成真实报告、不运行 Skill/MCP、不包含密钥和支付。

## Endpoints

- `GET /health`
- `GET /v1/projects`
- `GET /v1/tasks`
- `GET /v1/files`
- `GET /v1/reports`
- `GET /v1/skills`
- `GET /v1/mcp`

## Docker

```bash
docker compose --profile api up api
```

访问 `http://localhost:8082/health`。
