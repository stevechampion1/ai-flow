// D:/code/ai-flow-master/backend/routes/workflowRoutes.ts (最终修复版)
import express, { Router, Request, Response } from 'express';

// 导入共享类型，并使用 .js 扩展名 (保持原样)
import type { AIModule, Port } from '../../types/ai_module_models.js';
import type { Connection } from '../../types/Connection.js';
import type { CanvasItem } from '../../types/CanvasItem.js';

// 定义后端存储的工作流结构 (保持不变)
interface StoredWorkflow {
    id: number;
    name: string;
    description: string;
    canvasItems: CanvasItem[];
    connections: Connection[];
}

const router: Router = express.Router();

// 暂时使用内存存储 (保持不变)
let workflows: StoredWorkflow[] = [];
let nextWorkflowId = 1;

// --- 提供一个硬编码的 AI 模块列表 (修改处) ---
const availableAIModules: AIModule[] = [
    {
        id: 'text-input',
        name: '文本输入',
        category: '输入/输出',
        inputs: [],
        outputs: [{ id: 'text_out', label: '文本', type: 'string' }],
        // 这个模块有配置
        configSchema: { 'input_text': { type: 'textarea', label: '输入文本', defaultValue: '默认文本' } },
        defaultConfig: { 'input_text': '默认文本' },
        icon: '📄'
    },
    {
        id: 'text-output',
        name: '文本输出',
        category: '输入/输出',
        inputs: [{ id: 'text_in', label: '文本', type: 'string' }],
        outputs: [],
        // *** 添加空的 configSchema 和 defaultConfig ***
        configSchema: {},
        defaultConfig: {},
        icon: '📤'
    },
    {
        id: 'uppercase',
        name: '转大写',
        category: '文本处理',
        inputs: [{ id: 'text_in', label: '输入文本', type: 'string' }],
        outputs: [{ id: 'text_out', label: '输出文本', type: 'string' }],
        // *** 添加空的 configSchema 和 defaultConfig ***
        configSchema: {},
        defaultConfig: {},
        icon: '⬆️'
    },
];
// --- END 修改 ---

// GET /api/workflows - 获取所有工作流 (基本信息) (保持不变)
router.get('/workflows', (req: Request, res: Response) => {
    const workflowList = workflows.map(w => ({ id: w.id, name: w.name, description: w.description }));
    res.status(200).json(workflowList);
});

// POST /api/workflows - 创建新的工作流 (保持不变)
router.post('/workflows', (req: Request, res: Response) => {
    const { name, description, canvasItems, connections } = req.body;
    if (!name || typeof name !== 'string') {
        return res.status(400).json({ error: 'Workflow name is required and must be a string.' });
    }
    const newWorkflow: StoredWorkflow = {
        id: nextWorkflowId++, name, description: description || '',
        canvasItems: Array.isArray(canvasItems) ? canvasItems as CanvasItem[] : [],
        connections: Array.isArray(connections) ? connections as Connection[] : [],
    };
    workflows.push(newWorkflow);
    console.log('后台: 工作流已创建:', newWorkflow.id, newWorkflow.name);
    res.status(201).json(newWorkflow);
});

// GET /api/workflows/:id - 获取指定 ID 的工作流完整数据 (保持不变)
router.get('/workflows/:id', (req: Request, res: Response) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid workflow ID format.' });
    const workflow = workflows.find(w => w.id === id);
    if (!workflow) return res.status(404).json({ error: 'Workflow not found.' });
    console.log('后台: 获取工作流:', id);
    res.status(200).json(workflow);
});

// PUT /api/workflows/:id - 更新指定 ID 的工作流 (保持不变)
router.put('/workflows/:id', (req: Request, res: Response) => {
    const id = parseInt(req.params.id, 10);
     if (isNaN(id)) return res.status(400).json({ error: 'Invalid workflow ID format.' });
    const index = workflows.findIndex(w => w.id === id);
    if (index === -1) return res.status(404).json({ error: 'Workflow not found for update.' });
    const { name, description, canvasItems, connections } = req.body;
    if (name !== undefined && typeof name !== 'string') return res.status(400).json({ error: 'Invalid name format, expected a string.' });
    if (description !== undefined && typeof description !== 'string') return res.status(400).json({ error: 'Invalid description format, expected a string.' });
    if (canvasItems !== undefined && !Array.isArray(canvasItems)) return res.status(400).json({ error: 'Invalid canvasItems format, expected an array.' });
    if (connections !== undefined && !Array.isArray(connections)) return res.status(400).json({ error: 'Invalid connections format, expected an array.' });
    const updatedWorkflow: StoredWorkflow = {
        ...workflows[index],
        name: name !== undefined ? name : workflows[index].name,
        description: description !== undefined ? description : workflows[index].description,
        canvasItems: canvasItems !== undefined ? canvasItems as CanvasItem[] : workflows[index].canvasItems,
        connections: connections !== undefined ? connections as Connection[] : workflows[index].connections,
    };
    workflows[index] = updatedWorkflow;
    console.log('后台: 工作流已更新:', id);
    res.status(200).json(updatedWorkflow);
});

// DELETE /api/workflows/:id - 删除指定 ID 的工作流 (保持不变)
router.delete('/workflows/:id', (req: Request, res: Response) => {
    const id = parseInt(req.params.id, 10);
     if (isNaN(id)) return res.status(400).json({ error: 'Invalid workflow ID format.' });
    const initialLength = workflows.length;
    workflows = workflows.filter(w => w.id !== id);
    if (workflows.length < initialLength) {
        console.log('后台: 工作流已删除:', id);
        res.status(204).send();
    } else {
        return res.status(404).json({ error: 'Workflow not found for deletion.' });
    }
});

// GET /api/modules - 获取可用模块列表 (现在返回更新后的列表)
router.get('/modules', (req: Request, res: Response) => {
    console.log('后台: 获取可用模块列表');
    res.status(200).json(availableAIModules);
});

export default router;