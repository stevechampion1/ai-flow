// types/CanvasItem.ts
// --- 添加依赖类型的导入 (使用 .js 后缀) ---
// 假设 ai_module_models.ts 也在 types 目录下
import type { Port, ConfigSchemaItem } from './ai_module_models.js';

// --- 从 WorkflowEditor.tsx 移动过来的 CanvasItem 定义 ---
export interface CanvasItem {
  id: string;          // 节点的唯一标识符
  moduleId: string;    // 对应的 AIModule 的 ID
  name: string;        // 节点实例的名称 (可能允许用户修改)
  config: Record<string, any>; // 当前节点的配置值
  configSchema?: Record<string, ConfigSchemaItem>; // 配置项的结构定义 (从 AIModule 继承)
  inputs: Port[];      // 节点的输入端口 (从 AIModule 继承)
  outputs: Port[];     // 节点的输出端口 (从 AIModule 继承)
  position: { x: number; y: number }; // 节点在画布上的位置 (前端特定)
  zIndex?: number;        // 节点的堆叠顺序 (前端特定)
  executionResult: any | null;        // 上次执行的结果或状态
}

// --- (可选) 在此定义与后端交互时不同的结构 ---
// export interface BackendCanvasItem {
//   id: string;
//   moduleId: string;
//   name: string;
//   config: Record<string, any>;
// }