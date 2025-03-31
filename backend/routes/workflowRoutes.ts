// D:/code/AI-Flow/backend/routes/workflowRoutes.ts
import express, { Router, Request, Response } from 'express';
// *** 修改这里：添加 .ts 扩展名 ***
import { AIModule, Port, DefaultAIModules } from '../../types/ai_module_models.ts';

interface Workflow {
    id: number;
    name: string;
    description: string;
    steps: string[];
    canvasItems?: CanvasItem[];
    connections?: Connection[];
}

interface CanvasItem {
    id: string;
    type: string;
    name: string;
    top: number;
    left: number;
    width: number;
    height: number;
    config?: Record<string, any>;
    configSchema?: Record<string, any>;
    data: any;
    inputs?: Port[];
    outputs?: Port[];
    executionResult?: any;
}

interface Connection {
    // 之前的定义 { source: string; target: string; } 可能不够详细
    // 通常需要指定源/目标 Item ID 和 Port ID
    sourceItemId: string;
    sourcePortId: string;
    targetItemId: string;
    targetPortId: string;
}

const router: Router = express.Router();

// 暂时使用内存存储，后续可以替换为数据库
const workflows: Workflow[] = [];
const aiModules: AIModule[] = DefaultAIModules; // 使用导入的默认模块

router.get('/workflows', (req: Request, res: Response) => {
    res.status(200).json(workflows);
});

// POST 请求通常用于创建新资源
// 注意：这里的实现创建的是简单的 Workflow 描述，
// 可能还需要一个单独的端点来保存/更新包含 canvasItems 和 connections 的完整工作流状态
router.post('/workflows', (req: Request, res: Response) => {
    // 期望的 body 可能更复杂，包含 canvasItems 和 connections
    const { name, description, steps, canvasItems, connections } = req.body;
    // 基础验证
    if (!name) { // 仅验证 name 作为示例
        res.status(400).json({ error: 'Workflow name is required' });
        return;
    }
    const newWorkflow: Workflow = {
        id: Date.now(), // 使用时间戳作为临时 ID
        name,
        description: description || '',
        steps: steps || [], // 提供默认值
        canvasItems: canvasItems || [],
        connections: connections || [],
    };
    workflows.push(newWorkflow);
    console.log('Workflow created/updated:', newWorkflow);
    // 返回创建/更新后的工作流及其 ID
    res.status(201).json(newWorkflow);
});

// PUT 通常用于完整更新或创建（如果不存在）
router.put('/workflows/:id', (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    const index = workflows.findIndex(w => w.id === id);
    const { name, description, steps, canvasItems, connections } = req.body;

    if (index === -1) {
        // 如果未找到，可以选择创建或返回 404
        // 这里选择返回 404
         res.status(404).json({ error: 'Workflow not found' });
         return;
       /* // 或者创建:
        const newWorkflow: Workflow = { id, name, description: description || '', steps: steps || [], canvasItems: canvasItems || [], connections: connections || [] };
        workflows.push(newWorkflow);
        console.log('Workflow created via PUT:', newWorkflow);
        res.status(201).json(newWorkflow);
       */
    } else {
        // 更新现有工作流
        const updatedWorkflow: Workflow = {
            ...workflows[index], // 保留旧 ID
            name: name || workflows[index].name, // 允许部分更新
            description: description !== undefined ? description : workflows[index].description,
            steps: steps || workflows[index].steps,
            canvasItems: canvasItems || workflows[index].canvasItems,
            connections: connections || workflows[index].connections,
        };
        workflows[index] = updatedWorkflow;
        console.log('Workflow updated:', updatedWorkflow);
        res.status(200).json(updatedWorkflow);
    }
});


router.get('/workflows/:id', (req: Request, res: Response) => {
    const workflow = workflows.find(w => w.id === parseInt(req.params.id));
    if (!workflow) {
        res.status(404).json({ error: 'Workflow not found' });
        return;
    }
    res.status(200).json(workflow);
});

// 获取可用模块列表
router.get('/modules', (req: Request, res: Response) => {
    res.status(200).json(aiModules);
});

export default router;