# ai-api

`ai-api/` 是通用 AI API 网关的独立包。

当前实现是 FastAPI mock skeleton，用于验证 Docker、路由和服务边界。它不接真实模型供应商、不保存真实 API Key、不处理账单。

## Endpoints

- `GET /health`
- `GET /v1/routes`
- `GET /v1/providers`
- `GET /v1/keys`
- `GET /v1/usage`
- `GET /v1/limits`

## Docker

```bash
docker compose --profile api up ai-api
```

访问 `http://localhost:8083/health`。
