from fastapi import FastAPI
from pydantic import BaseModel
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    ai_api_database_url: str = "postgresql://ai_api:ai_api_dev@ai-api-db:5432/ai_api"
    ai_api_redis_url: str = "redis://ai-api-redis:6379/0"
    ai_api_key_prefix: str = "ai_dev_"


class Item(BaseModel):
    id: str
    name: str
    status: str
    description: str


settings = Settings()
app = FastAPI(
    title="NVH Test AI API Gateway",
    version="0.1.0",
    description="Mock general AI API gateway skeleton. No provider integration is implemented.",
)


@app.get("/health")
def health():
    return {
        "service": "ai-api.nvhtest.cn",
        "status": "ok",
        "mode": "mock",
        "keyPrefix": settings.ai_api_key_prefix,
    }


@app.get("/v1/routes", response_model=list[Item])
def routes():
    return [Item(id="route_chat", name="通用聊天路由", status="mock", description="模型路由占位。")]


@app.get("/v1/providers", response_model=list[Item])
def providers():
    return [Item(id="provider_demo", name="Demo Provider", status="disabled", description="供应商配置占位，不包含真实密钥。")]


@app.get("/v1/keys", response_model=list[Item])
def keys():
    return [Item(id="key_demo", name=f"{settings.ai_api_key_prefix}example", status="sample", description="示例 key 前缀，不是可用密钥。")]


@app.get("/v1/usage", response_model=list[Item])
def usage():
    return [Item(id="usage_demo", name="Token usage", status="mock", description="用量统计占位。")]


@app.get("/v1/limits", response_model=list[Item])
def limits():
    return [Item(id="limit_demo", name="默认限流", status="mock", description="限流策略占位。")]
