# services/workflow_service.py
from typing import List, Optional, Dict, Any
from models.workflow_models import Workflow, WorkflowCreate, WorkflowUpdate
from pydantic import BaseModel, ValidationError

# ------ 模型定义 ------
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

workflows_db: List[Workflow] = []
workflow_id_counter = 1

workflow_data_db: Dict[int, WorkflowData] = {}

class WorkflowService:
    def get_all_workflows(self) -> List[Workflow]:
        """获取所有工作流"""
        return workflows_db

    def create_workflow(self, workflow_create: WorkflowCreate) -> Workflow:
        """创建新的工作流"""
        global workflow_id_counter
        new_workflow = Workflow(
            id=workflow_id_counter,
            name=workflow_create.name,
            description=workflow_create.description,
            steps=workflow_create.steps,
        )
        workflows_db.append(new_workflow)
        workflow_id_counter += 1
        return new_workflow

    def get_workflow(self, workflow_id: int) -> Optional[Workflow]:
        """根据ID获取工作流"""
        for workflow in workflows_db:
            if workflow.id == workflow_id:
                return workflow
        return None

    def update_workflow(self, workflow_id: int, workflow_update: WorkflowUpdate) -> Optional[Workflow]:
        """更新现有工作流"""
        for index, workflow in enumerate(workflows_db):
            if workflow.id == workflow_id:
                updated_workflow_data = workflow.dict()
                update_data = workflow_update.dict(exclude_unset=True)
                updated_workflow_data.update(update_data)
                updated_workflow = Workflow(**updated_workflow_data)
                workflows_db[index] = updated_workflow
                return updated_workflow
        return None

    def delete_workflow(self, workflow_id: int) -> bool:
        """删除工作流"""
        global workflows_db
        initial_length = len(workflows_db)
        workflows_db = [workflow for workflow in workflows_db if workflow.id != workflow_id]
        return len(workflows_db) < initial_length

    def get_workflow_data_by_id(self, workflow_id: int) -> Optional[WorkflowData]:
        """根据ID获取工作流数据"""
        try:
            workflow_data = workflow_data_db.get(workflow_id)
            if workflow_data is None:
                return None
            return workflow_data
        except Exception as e:
            print(f"Error in get_workflow_data_by_id: {e}")  # 添加日志
            return None

    def save_workflow_data(self, workflow_id: int, workflow_data: WorkflowData) -> WorkflowData:
        """保存工作流数据，使用 workflow_id 作为键"""
        # 检查 workflow_id 对应的 workflow 是否存在
        if self.get_workflow(workflow_id) is None:
            raise ValueError(f"Workflow with id {workflow_id} not found")
        workflow_data_db[workflow_id] = workflow_data
        return workflow_data