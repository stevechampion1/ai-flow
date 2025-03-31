// D:/code/AI-Flow/types/ai_module_models.ts

export interface ConfigSchemaItem {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'number' | 'boolean' | 'select';
  options?: string[];
  default?: any;
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
  description?: string;
}

export interface Port {
  id: string;
  type: string;
  connectedTo?: Array<{ itemId: string; portId: string }>;
  label?: string;
  description?: string;
}

export interface AIModule {
  id: string; // 修改为 string，与 workflowRoutes.ts 一致
  name: string;
  type: string;
  description?: string;
  config?: Record<string, any>;
  configSchema?: Record<string, ConfigSchemaItem>;
  inputs: Port[];
  outputs: Port[];
}

export const DefaultAIModules: AIModule[] = [
  {
    id: "1",
    name: "Text Generator",
    type: "NLP",
    description: "Generates text based on prompts",
    config: {},
    configSchema: {},
    inputs: [],
    outputs: []
  },
  {
    id: "2",
    name: "Image Processor",
    type: "Computer Vision",
    description: "Processes images with AI filters",
    config: {},
    configSchema: {},
    inputs: [],
    outputs: []
  }
];