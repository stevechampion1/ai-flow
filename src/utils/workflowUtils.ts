// src/utils/workflowUtils.ts (修复后)
// *** 导入类型和函数 ***
import type { CanvasItem } from '../../types/CanvasItem';
import type { Connection } from '../../types/Connection';
import { v4 as uuidv4 } from 'uuid';
import {
    saveWorkflow as apiSaveWorkflow,
    loadWorkflow as apiLoadWorkflow,
    createWorkflow as apiCreateWorkflow,
    // *** 导入已导出的接口 ***
    type WorkflowDataForApi, // 从 api 导入
    type WorkflowDataFromBackend // 从 api 导入
} from '../api/workflowApi'; // 确认路径正确, 无 .js

// Utility functions remain the same as previous correct version...

export const saveWorkflowUtil = async (
    currentWorkflowId: number | null,
    canvasItems: CanvasItem[],
    connections: Connection[],
    workflowName: string,
    workflowDescription: string,
    setLoading: (loading: boolean) => void,
    setError: (error: string | null) => void,
    setWorkflowId?: (id: number) => void
): Promise<number | null> => {
    setLoading(true);
    setError(null);
    try {
        const connectionsForApi = connections.map(conn => ({ // Prepare flat connections for API
            id: conn.id,
            sourceItemId: conn.sourceItemId, sourcePortId: conn.sourcePortId,
            targetItemId: conn.targetItemId, targetPortId: conn.targetPortId,
        }));

        let savedWorkflow: WorkflowDataFromBackend | null = null;

        if (currentWorkflowId === null) { // Create
            console.log("Util: Creating new workflow...");
            // Assuming apiCreateWorkflow payload matches CreateWorkflowPayload
            const createPayload = {
                name: workflowName || "Untitled Workflow", description: workflowDescription || "",
                canvasItems, connections, // Assuming API takes full Connection[]
            };
            savedWorkflow = await apiCreateWorkflow(createPayload);
            console.log(`Util: Workflow created successfully with ID: ${savedWorkflow.id}`);
            if (setWorkflowId) { setWorkflowId(savedWorkflow.id); }

        } else { // Update
            console.log(`Util: Updating existing workflow with ID: ${currentWorkflowId}...`);
            // Assuming apiSaveWorkflow payload matches WorkflowDataForApi
            const updatePayload: WorkflowDataForApi = {
                 name: workflowName, description: workflowDescription,
                 canvasItems, connections: connectionsForApi, // Send flat connections for PUT
            };
            savedWorkflow = await apiSaveWorkflow(currentWorkflowId, updatePayload);
            console.log("Util: Existing workflow updated successfully.");
        }
        return savedWorkflow.id;

    } catch (error: any) {
        const message = `Error saving workflow: ${error.message || 'Unknown API error'}`;
        console.error('Util:', message, error); setError(message); return null;
    } finally {
        setLoading(false);
    }
};


export const loadWorkflowUtil = async (
    workflowId: number,
    setLoading: (loading: boolean) => void,
    setError: (error: string | null) => void
): Promise<WorkflowDataFromBackend | null> => { // <-- Return the correct type
    setLoading(true);
    setError(null);
    try {
        console.log(`Util: Loading workflow with ID: ${workflowId}...`);
        const loadedDataFromApi = await apiLoadWorkflow(workflowId); // Returns WorkflowDataFromBackend
        console.log("Util: Data received from API:", loadedDataFromApi);

        // Optional: Filter invalid connections client-side as a fallback
        const itemIds = new Set(loadedDataFromApi.canvasItems.map(item => item.id));
        const validConnections = loadedDataFromApi.connections.filter(conn => {
            const sourceExists = itemIds.has(conn.sourceItemId);
            const targetExists = itemIds.has(conn.targetItemId);
            const hasRequiredFields = conn.id && conn.sourceItemId && conn.sourcePortId && conn.targetItemId && conn.targetPortId;
            if (!sourceExists || !targetExists || !hasRequiredFields) {
                 console.warn(`Util: Filtering invalid connection on load: ${conn.id}`);
                 return false;
            }
            return true;
        });

        const finalLoadedData: WorkflowDataFromBackend = {
            ...loadedDataFromApi, connections: validConnections
        };
        console.log('Util: Workflow loaded and processed successfully:', finalLoadedData);
        return finalLoadedData;

    } catch (error: any) {
        const message = `Error loading workflow: ${error.message || 'Unknown API error'}`;
        console.error('Util:', message, error); setError(message); return null;
    } finally {
        setLoading(false);
    }
};

export const getItemPosition = (canvasItems: CanvasItem[], id: string): { left: number; top: number } | null => {
    const item = canvasItems.find((i) => i.id === id);
    return item ? { left: item.position.x, top: item.position.y } : null;
};

export const isInputPortConnected = (connections: Connection[], itemId: string, portId: string): boolean => {
    return connections.some(conn => conn.targetItemId === itemId && conn.targetPortId === portId);
};