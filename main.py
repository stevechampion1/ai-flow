# main.py
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import uvicorn

from services.workflow_service import WorkflowService
from services.ai_service import AIService

app = FastAPI(
    title="AI-Flow API",
    description="API for AI-Flow, a low-code AI application development platform.",
    version="1.0.0",
)

# CORS 中间件
origins = [
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

workflow_service = WorkflowService()
ai_service = AIService()

# ------ 模型定义 ------
class WorkflowCreate(BaseModel):
    name: str
    description: str
    steps: List[str]

class Workflow(BaseModel):
    id: int
    name: str
    description: str
    steps: List[str]
    class Config:
        extra = 'forbid'

class AIModule(BaseModel):
    id: int
    name: str
    type: str
    config: dict

class CanvasItem(BaseModel):
    id: str  # 修改为 str，与前端一致
    type: str
    name: str
    top: float
    left: float
    width: float
    height: float
    config: Optional[Dict[str, Any]] = None
    configSchema: Optional[Dict[str, Any]] = None

    class Config:
        arbitrary_types_allowed = True

class Connection(BaseModel):
    source: str  # 修改为 str，与前端的 sourceItemId 一致
    target: str  # 修改为 str，与前端的 targetItemId 一致

class WorkflowData(BaseModel):
    canvasItems: List[CanvasItem]
    connections: List[Connection]

# ------ 模型定义结束 ------

@app.get("/")
async def read_root():
    return {"message": "Welcome to AI-Flow API"}

@app.get("/workflows", response_model=List[Workflow])
async def get_workflows():
    try:
        workflows = workflow_service.get_all_workflows()
        return workflows
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/workflows", response_model=Workflow)
async def create_workflow(workflow: WorkflowCreate):
    try:
        new_workflow = workflow_service.create_workflow(workflow)
        return new_workflow
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/workflows/{workflow_id}", response_model=Workflow)
async def get_workflow(workflow_id: int):
    try:
        workflow = workflow_service.get_workflow(workflow_id)
        if workflow:
            return workflow
        else:
            raise HTTPException(
                status_code=404, detail=f"Workflow with id {workflow_id} not found"
            )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/workflows/data/{workflow_id}", response_model=WorkflowData)
async def get_workflow_data(workflow_id: int):
    try:
        workflow_data = workflow_service.get_workflow_data_by_id(workflow_id)
        if workflow_data:
            return workflow_data
        else:
            raise HTTPException(status_code=404, detail=f"Workflow data for workflow id {workflow_id} not found")
    except Exception as e:
        print(f"Error in get_workflow_data: {e}")  # 添加日志
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/workflows/data/{workflow_id}", response_model=WorkflowData)
async def save_workflow_data(workflow_id: int, workflow_data: WorkflowData):
    try:
        saved_data = workflow_service.save_workflow_data(workflow_id, workflow_data)
        return saved_data
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        print(f"Error in save_workflow_data: {e}")  # 添加日志
        raise HTTPException(status_code=422, detail=str(e))

@app.get("/ai-modules", response_model=List[AIModule])
async def get_ai_modules():
    try:
        ai_modules = ai_service.get_all_ai_modules()
        return ai_modules
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/ai-modules/run/{module_id}")
async def run_ai_module(module_id: int, input_data: dict):
    try:
        result = ai_service.run_ai_module(module_id, input_data)
        return {"result": result}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)