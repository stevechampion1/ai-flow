// src/api/workflowApi.ts
import axios from 'axios';
import { CanvasItem, Connection } from '../components/WorkflowEditor/WorkflowEditor';
import { AIModule } from '../../types/ai_module_models'; // 更新路径

const BASE_URL = 'http://localhost:3001/api';

interface BackendConnection {
    source: string;
    target: string;
}

interface WorkflowData {
    canvasItems: CanvasItem[];
    connections: BackendConnection[];
}

interface Workflow {
    id: number;
    name: string;
    description: string;
    steps: string[];
}

export const saveWorkflow = async (workflowId: number, workflowData: WorkflowData): Promise<WorkflowData> => {
    try {
        const response = await axios.put<WorkflowData>(`${BASE_URL}/workflows/${workflowId}`, workflowData);
        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.error('API Error:', error.response?.data || error.message);
            throw new Error(error.response?.data?.error || 'Failed to save workflow data');
        } else {
            console.error('Unexpected Error:', error);
            throw new Error('Failed to save workflow data');
        }
    }
};

export const loadWorkflow = async (workflowId: number): Promise<WorkflowData> => {
    try {
        const response = await axios.get<WorkflowData>(`${BASE_URL}/workflows/${workflowId}`);
        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            if (error.response?.status === 404) {
                throw new Error(`Workflow with id ${workflowId} not found`);
            } else {
                console.error('API Error:', error.response?.data || error.message);
                throw new Error(error.response?.data?.error || 'Failed to load workflow data');
            }
        } else {
            console.error('Unexpected Error:', error);
            throw new Error('Failed to load workflow data');
        }
    }
};

export const createWorkflow = async (workflowData: { name: string; description: string; steps: string[] }): Promise<Workflow> => {
    const response = await axios.post<Workflow>(`${BASE_URL}/workflows`, workflowData);
    return response.data;
};

export const fetchAIModules = async (): Promise<AIModule[]> => {
    try {
        const response = await axios.get<AIModule[]>(`${BASE_URL}/modules`);
        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.error('API Error:', error.response?.data || error.message);
            throw new Error(error.response?.data?.error || 'Failed to fetch AI modules');
        } else {
            console.error('Unexpected Error:', error);
            throw new Error('Failed to fetch AI modules');
        }
    }
};