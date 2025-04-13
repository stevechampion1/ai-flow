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
            model_name = config.get("model", "default-model")  # 从配置中获取模型名，如果没有则使用默认模型
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