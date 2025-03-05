# models/workflow_models.py
from pydantic import BaseModel
from typing import List, Optional

class WorkflowBase(BaseModel):
    name: str
    description: Optional[str] = None

class WorkflowCreate(WorkflowBase):
    steps: List[str] = [] # Example: List of step names or IDs

class WorkflowUpdate(WorkflowBase):
    steps: Optional[List[str]] = None

class Workflow(WorkflowBase):
    id: int
    steps: List[str] = []

    class Config:
        orm_mode = True # To allow creation from ORM objects


# models/ai_module_models.py
from pydantic import BaseModel
from typing import Dict, Any, Optional

class AIModuleBase(BaseModel):
    name: str
    type: str # e.g., "text_generation", "image_classification", "data_processing"
    description: Optional[str] = None

class AIModuleCreate(AIModuleBase):
    config: Dict[str, Any] = {} # Configuration parameters specific to the module type

class AIModuleUpdate(AIModuleBase):
    config: Optional[Dict[str, Any]] = None

class AIModule(AIModuleBase):
    id: int
    config: Dict[str, Any] = {}

    class Config:
        orm_mode = True # To allow creation from ORM objects