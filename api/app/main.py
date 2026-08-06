from fastapi import FastAPI
from pydantic import BaseModel
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    nvh_api_database_url: str = "postgresql://nvh_api:nvh_api_dev@api-db:5432/nvh_api"
    nvh_api_redis_url: str = "redis://api-redis:6379/0"
    nvh_api_object_storage_url: str = "http://minio:9000"
    nvh_api_key_prefix: str = "nvh_dev_"


class Item(BaseModel):
    id: str
    name: str
    status: str
    description: str


settings = Settings()
app = FastAPI(
    title="NVH Test Professional API",
    version="0.1.0",
    description="Mock professional NVH API skeleton. No real customer data processing is implemented.",
)


@app.get("/health")
def health():
    return {
        "service": "api.nvhtest.cn",
        "status": "ok",
        "mode": "mock",
        "keyPrefix": settings.nvh_api_key_prefix,
    }


@app.get("/v1/projects", response_model=list[Item])
def projects():
    return [Item(id="proj_demo", name="电驱噪声分析演示项目", status="mock", description="项目空间与任务历史占位。")]


@app.get("/v1/tasks", response_model=list[Item])
def tasks():
    return [Item(id="task_fft_demo", name="FFT 分析任务", status="queued", description="异步分析任务接口占位。")]


@app.get("/v1/files", response_model=list[Item])
def files():
    return [Item(id="file_demo", name="demo-spectrum.csv", status="metadata-only", description="文件上传元数据占位，不处理真实文件。")]


@app.get("/v1/reports", response_model=list[Item])
def reports():
    return [Item(id="report_demo", name="NVH 分析报告", status="draft", description="报告生成接口占位。")]


@app.get("/v1/skills", response_model=list[Item])
def skills():
    return [Item(id="skill_order", name="阶次分析 Skill", status="planned", description="定制 Skill 请求占位。")]


@app.get("/v1/mcp", response_model=list[Item])
def mcp():
    return [Item(id="mcp_nvh", name="NVH MCP 服务", status="planned", description="MCP 工具调用占位。")]
