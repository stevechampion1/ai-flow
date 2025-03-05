from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List
import uvicorn

# 导入服务模块（假设有 workflow_service 和 ai_service）
from services.workflow_service import WorkflowService
from services.workflow_service import AIService

# 初始化 FastAPI 应用
app = FastAPI(
    title="AI-Flow API",
    description="API for AI-Flow, a low-code AI application development platform.",
    version="1.0.0"
)

# 初始化服务实例（假设服务类已定义）
workflow_service = WorkflowService()
ai_service = AIService()

# 定义请求和响应模型
class Workflow(BaseModel):
    id: int
    name: str
    description: str
    steps: List[str]

class AIModule(BaseModel):
    id: int
    name: str
    type: str
    config: dict

# 根路由
@app.get("/")
async def read_root():
    return {"message": "Welcome to AI-Flow API"}

# 获取所有工作流
@app.get("/workflows", response_model=List[Workflow])
async def get_workflows():
    try:
        workflows = workflow_service.get_all_workflows()
        return workflows
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# 创建新工作流
@app.post("/workflows", response_model=Workflow)
async def create_workflow(workflow: Workflow):
    try:
        new_workflow = workflow_service.create_workflow(workflow)
        return new_workflow
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# 获取所有 AI 模块
@app.get("/ai-modules", response_model=List[AIModule])
async def get_ai_modules():
    try:
        ai_modules = ai_service.get_all_ai_modules()
        return ai_modules
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# 运行 AI 模块
@app.post("/ai-modules/run/{module_id}")
async def run_ai_module(module_id: int, input_data: dict):
    try:
        result = ai_service.run_ai_module(module_id, input_data)
        return {"result": result}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# 启动应用
if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)