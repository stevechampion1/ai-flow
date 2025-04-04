// src/utils/workflowUtils.ts
import { CanvasItem, Connection } from '../components/WorkflowEditor/WorkflowEditor';
import { saveWorkflow as apiSaveWorkflow, loadWorkflow as apiLoadWorkflow, createWorkflow as apiCreateWorkflow } from '../api/workflowApi';

// 定义 Workflow 接口，与 API 返回的数据结构一致
interface Workflow {
    id: number;
    name: string;
    description: string;
    steps: string[];
}

// 定义 WorkflowData 接口，表示工作流数据
interface WorkflowData {
    canvasItems: CanvasItem[];
    connections: Connection[];
}

// 保存工作流 (调用 API)
export const saveWorkflow = async (
    workflowId: string | null,
    canvasItems: CanvasItem[],
    connections: Connection[],
    setLoading: (loading: boolean) => void,
    setError: (error: string | null) => void
): Promise<string | null> => {
    setLoading(true);
    try {
        // 转换 connections 格式以匹配 API 期望的结构
        const transformedConnections = connections.map(conn => ({
            source: conn.sourceItemId,
            sourcePortId: conn.sourcePortId,
            target: conn.targetItemId,
            targetPortId: conn.targetPortId,
        }));
        const workflowData = { canvasItems, connections: transformedConnections };
        console.log("Saving workflow data:", workflowData);

        if (workflowId === null) {
            // 如果没有 workflowId，则创建新工作流
            const newWorkflow = await apiCreateWorkflow({ name: "Unnamed Workflow", description: "", steps: [] });
            const savedWorkflowData = await apiSaveWorkflow(Number(newWorkflow.id.toString()), workflowData);
            console.log('Workflow created and saved successfully:', savedWorkflowData);
            return newWorkflow.id.toString();
        } else {
            // 如果有 workflowId，则更新现有工作流
            const savedWorkflowData = await apiSaveWorkflow(Number(workflowId), workflowData);
            console.log('Workflow saved successfully:', savedWorkflowData);
            return workflowId;
        }
    } catch (error: any) {
        console.error('Error saving workflow:', error);
        setError(`Error saving workflow: ${error.message}`);
        return null;
    } finally {
        setLoading(false);
    }
};

// 加载工作流 (调用 API)，并过滤掉无效的连接
export const loadWorkflow = async (
    workflowId: string | null,
    setLoading: (loading: boolean) => void,
    setError: (error: string | null) => void
): Promise<WorkflowData | null> => {
    setLoading(true);
    try {
        if (!workflowId) {
            setError('Please provide a valid workflow ID.');
            return null;
        }
        const workflowData = await apiLoadWorkflow(Number(workflowId));
        if (workflowData === null) {
            setError('Workflow data not found.');
            return null;
        }
        // 转换 API 返回的 connections 格式
        const transformedConnections: Connection[] = workflowData.connections.map((conn: any) => ({
            sourceItemId: conn.source,
            sourcePortId: conn.sourcePortId || 'output-1',
            targetItemId: conn.target,
            targetPortId: conn.targetPortId || 'input-1',
        }));
        // 过滤掉无效的连接（确保 source 和 target 对应的 canvasItems 存在）
        const validConnections = transformedConnections.filter((conn: Connection) => {
            return (
                workflowData.canvasItems.some(item => item.id === conn.sourceItemId) &&
                workflowData.canvasItems.some(item => item.id === conn.targetItemId)
            );
        });
        console.log('Workflow loaded successfully:', { canvasItems: workflowData.canvasItems, connections: validConnections });
        return { canvasItems: workflowData.canvasItems, connections: validConnections };
    } catch (error: any) {
        console.error('Error loading workflow:', error);
        setError(`Error loading workflow: ${error.message}`);
        return null;
    } finally {
        setLoading(false);
    }
};

// 创建新工作流
export const createWorkflow = async (
    workflowData: { name: string; description: string; steps: string[] },
    setLoading: (loading: boolean) => void,
    setError: (error: string | null) => void
) => {
    setLoading(true);
    try {
        const savedData = await apiCreateWorkflow(workflowData);
        console.log('Workflow created successfully:', savedData);
        return savedData;
    } catch (error: any) {
        console.error('Error creating workflow:', error);
        setError(`Error creating workflow: ${error.message}`);
        throw error;
    } finally {
        setLoading(false);
    }
}; // 补全缺失的闭合大括号

// 获取 CanvasItem 的位置
export const getItemPosition = (canvasItems: CanvasItem[], id: string) => {
    const item = canvasItems.find((i) => i.id === id);
    // 使用 position.x 和 position.y 代替 left 和 top
    return item ? { left: item.position.x, top: item.position.y } : { left: 0, top: 0 };
};