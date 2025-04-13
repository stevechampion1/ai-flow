# routers/workflow.py
from fastapi import APIRouter, HTTPException
from typing import List

# Import service (assuming it exists)
from services.workflow_service import WorkflowService
from models.workflow_models import Workflow, WorkflowCreate  # Assuming models are defined

router = APIRouter()
workflow_service = WorkflowService()  # Initialize service instance

@router.get("/workflows/", response_model=List[Workflow], tags=["workflows"])
async def read_workflows():
    try:
        workflows = workflow_service.get_all_workflows()
        return workflows
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/workflows/", response_model=Workflow, tags=["workflows"])
async def create_workflow(workflow_create: WorkflowCreate):
    try:
        workflow = workflow_service.create_workflow(workflow_create)
        return workflow
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/workflows/{workflow_id}", response_model=Workflow, tags=["workflows"])
async def read_workflow(workflow_id: int):
    try:
        workflow = workflow_service.get_workflow(workflow_id)
        if workflow:
            return workflow
        else:
            raise HTTPException(status_code=404, detail="Workflow not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/workflows/{workflow_id}", response_model=Workflow, tags=["workflows"])
async def update_workflow(workflow_id: int, workflow_update: WorkflowCreate):
    try:
        workflow = workflow_service.update_workflow(workflow_id, workflow_update)
        if workflow:
            return workflow
        else:
            raise HTTPException(status_code=404, detail="Workflow not found")
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/workflows/{workflow_id}", response_model=dict, tags=["workflows"])
async def delete_workflow(workflow_id: int):
    try:
        success = workflow_service.delete_workflow(workflow_id)
        if success:
            return {"message": "Workflow deleted successfully"}
        else:
            raise HTTPException(status_code=404, detail="Workflow not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# routers/ai_modules.py
from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any

# Import service (assuming it exists)
from services.workflow_service import AIService
from models.workflow_models import AIModule, AIModuleCreate  # Assuming models are defined

router = APIRouter()
ai_service = AIService()  # Initialize service instance

@router.get("/ai-modules/", response_model=List[AIModule], tags=["ai_modules"])
async def read_ai_modules():
    try:
        ai_modules = ai_service.get_all_ai_modules()
        return ai_modules
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/ai-modules/", response_model=AIModule, tags=["ai_modules"])
async def create_ai_module(ai_module_create: AIModuleCreate): # Consider if creation is needed via API
    try:
        ai_module = ai_service.create_ai_module(ai_module_create)
        return ai_module
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/ai-modules/{module_id}", response_model=AIModule, tags=["ai_modules"])
async def read_ai_module(module_id: int):
    try:
        ai_module = ai_service.get_ai_module(module_id)
        if ai_module:
            return ai_module
        else:
            raise HTTPException(status_code=404, detail="AI Module not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/ai-modules/run/{module_id}", response_model=Dict[str, Any], tags=["ai_modules"])
async def run_ai_module(module_id: int, input_data: Dict[str, Any]):
    try:
        result = ai_service.run_ai_module(module_id, input_data)
        return {"result": result}
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))