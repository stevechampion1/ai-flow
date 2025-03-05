# services/workflow_service.py
from typing import List
from models.workflow_models import Workflow, WorkflowCreate, WorkflowUpdate

# 假设我们使用一个简单的列表作为内存数据库来存储工作流
workflows_db: List[Workflow] = []
workflow_id_counter = 1

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
            steps=workflow_create.steps
        )
        workflows_db.append(new_workflow)
        workflow_id_counter += 1
        return new_workflow

    def get_workflow(self, workflow_id: int) -> Workflow | None:
        """根据ID获取工作流"""
        for workflow in workflows_db:
            if workflow.id == workflow_id:
                return workflow
        return None

    def update_workflow(self, workflow_id: int, workflow_update: WorkflowUpdate) -> Workflow | None:
        """更新现有工作流"""
        for index, workflow in enumerate(workflows_db):
            if workflow.id == workflow_id:
                updated_workflow_data = workflow.dict() # 将 Workflow 对象转换为字典方便更新
                update_data = workflow_update.dict(exclude_unset=True) # 获取更新数据，排除未设置的字段
                updated_workflow_data.update(update_data) # 合并更新数据
                updated_workflow = Workflow(**updated_workflow_data) # 从字典重新创建 Workflow 对象
                workflows_db[index] = updated_workflow # 更新列表中的工作流
                return updated_workflow
        return None

    def delete_workflow(self, workflow_id: int) -> bool:
        """删除工作流"""
        global workflows_db
        initial_length = len(workflows_db)
        workflows_db = [workflow for workflow in workflows_db if workflow.id != workflow_id]
        return len(workflows_db) < initial_length # 如果列表长度减少了，说明删除了工作流

# services/ai_service.py
from typing import List, Dict, Any
from models.workflow_models import AIModule, AIModuleCreate, AIModuleUpdate

# 假设我们使用一个简单的列表作为内存数据库来存储 AI 模块
ai_modules_db: List[AIModule] = []
ai_module_id_counter = 1

class AIService:
    def get_all_ai_modules(self) -> List[AIModule]:
        """获取所有 AI 模块"""
        return ai_modules_db

    def create_ai_module(self, ai_module_create: AIModuleCreate) -> AIModule:
        """创建新的 AI 模块"""
        global ai_module_id_counter
        new_ai_module = AIModule(
            id=ai_module_id_counter,
            name=ai_module_create.name,
            type=ai_module_create.type,
            description=ai_module_create.description,
            config=ai_module_create.config
        )
        ai_modules_db.append(new_ai_module)
        ai_module_id_counter += 1
        return new_ai_module

    def get_ai_module(self, ai_module_id: int) -> AIModule | None:
        """根据ID获取 AI 模块"""
        for ai_module in ai_modules_db:
            if ai_module.id == ai_module_id:
                return ai_module
        return None

    def run_ai_module(self, module_id: int, input_data: Dict[str, Any]) -> Any:
        """运行 AI 模块 (这里只是一个示例，实际需要根据模块类型和配置执行不同的 AI 逻辑)"""
        ai_module = self.get_ai_module(module_id)
        if not ai_module:
            raise ValueError(f"AI 模块 ID '{module_id}' 未找到")

        module_type = ai_module.type
        config = ai_module.config

        if module_type == "text_generation":
            model_name = config.get("model", "default-model") # 从配置中获取模型名，如果没有则使用默认模型
            input_text = input_data.get("input_text", "")

            # 模拟文本生成逻辑 (实际中会调用 AI 模型 API 或库)
            if model_name == "gpt-2":
                generated_text = f"使用 GPT-2 模型生成文本: {input_text} ... (generated)"
            else:
                generated_text = f"使用默认模型生成文本: {input_text} ... (default generated)"
            return generated_text

        elif module_type == "image_classification":
            image_path = input_data.get("image_path")
            # 模拟图像分类逻辑 (实际中会调用图像分类模型)
            if image_path:
                classification_result = f"对图像 '{image_path}' 进行分类... (classified as 'cat')"
            else:
                classification_result = "未提供图像路径，无法分类"
            return classification_result

        else:
            return f"AI 模块类型 '{module_type}' 的运行逻辑尚未实现"