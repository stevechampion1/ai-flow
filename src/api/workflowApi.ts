// src/api/workflowApi.ts (修复后)
import axios from 'axios';
import type { CanvasItem } from '../../types/CanvasItem';
import type { Connection } from '../../types/Connection';
import type { AIModule } from '../../types/ai_module_models';

const BASE_URL = 'http://localhost:3001/api';

// *** 修正: 导出接口 ***
export interface WorkflowDataForApi {
    name?: string;
    description?: string;
    canvasItems: CanvasItem[];
    connections: {
        id: string;
        sourceItemId: string;
        sourcePortId: string;
        targetItemId: string;
        targetPortId: string;
    }[];
}

// *** 修正: 导出接口 ***
export interface WorkflowDataFromBackend {
    id: number;
    name: string;
    description: string;
    canvasItems: CanvasItem[];
    connections: Connection[];
}

// *** 修正: 导出接口 ***
export interface CreateWorkflowPayload {
  name: string;
  description: string;
  canvasItems?: CanvasItem[];
  connections?: Connection[];
}

// *** 修正: 导出接口 ***
// (CreatedWorkflowResponse is an alias, ensure WorkflowDataFromBackend is exported)
export type CreatedWorkflowResponse = WorkflowDataFromBackend;


// API 函数保持不变...
export const saveWorkflow = async (workflowId: number, workflowData: WorkflowDataForApi): Promise<WorkflowDataFromBackend> => {
    try {
        const response = await axios.put<WorkflowDataFromBackend>(`${BASE_URL}/workflows/${workflowId}`, workflowData);
         if (!response.data || typeof response.data.id !== 'number') { // Basic check
            throw new Error("Invalid data structure received after saving workflow.");
        }
        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.error('API Error saving workflow:', error.response?.data || error.message);
            throw new Error(error.response?.data?.error || `Failed to save workflow data (ID: ${workflowId})`);
        } else {
            console.error('Unexpected Error saving workflow:', error);
            throw new Error(`Failed to save workflow data (ID: ${workflowId}) - Unexpected error`);
        }
    }
};

export const loadWorkflow = async (workflowId: number): Promise<WorkflowDataFromBackend> => {
    try {
        const response = await axios.get<WorkflowDataFromBackend>(`${BASE_URL}/workflows/${workflowId}`);
        if (!response.data || typeof response.data.id !== 'number' || typeof response.data.name !== 'string' || !Array.isArray(response.data.canvasItems) || !Array.isArray(response.data.connections)) {
            throw new Error("Invalid data structure received from load workflow API.");
        }
        return response.data;
    } catch (error) {
       if (axios.isAxiosError(error)) {
            if (error.response?.status === 404) {
                throw new Error(`Workflow with id ${workflowId} not found.`);
            } else {
                console.error('API Error loading workflow:', error.response?.data || error.message);
                throw new Error(error.response?.data?.error || `Failed to load workflow data (ID: ${workflowId})`);
            }
        } else {
            console.error('Unexpected Error loading workflow:', error);
            throw new Error(`Failed to load workflow data (ID: ${workflowId}) - Unexpected error`);
        }
    }
};

export const createWorkflow = async (workflowData: CreateWorkflowPayload): Promise<CreatedWorkflowResponse> => {
    try {
        const response = await axios.post<CreatedWorkflowResponse>(`${BASE_URL}/workflows`, workflowData);
         if (!response.data || typeof response.data.id !== 'number' || typeof response.data.name !== 'string' || !Array.isArray(response.data.canvasItems) || !Array.isArray(response.data.connections)) {
            throw new Error("Invalid data structure received from create workflow API.");
        }
        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.error('API Error creating workflow:', error.response?.data || error.message);
            throw new Error(error.response?.data?.error || 'Failed to create workflow');
        } else {
            console.error('Unexpected Error creating workflow:', error);
            throw new Error('Failed to create workflow - Unexpected error');
        }
    }
};

export const fetchAIModules = async (): Promise<AIModule[]> => {
    try {
        const response = await axios.get<AIModule[]>(`${BASE_URL}/modules`);
        if (!Array.isArray(response.data)) {
            throw new Error("Invalid data structure received from fetch modules API.");
        }
        return response.data;
    } catch (error) {
         if (axios.isAxiosError(error)) {
            console.error('API Error fetching modules:', error.response?.data || error.message);
            throw new Error(error.response?.data?.error || 'Failed to fetch AI modules');
        } else {
            console.error('Unexpected Error fetching modules:', error);
            throw new Error('Failed to fetch AI modules - Unexpected error');
        }
    }
};