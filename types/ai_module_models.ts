// types/ai_module_models.ts (修复后 - 使用可区分联合类型)

// Define the structure for input/output ports (保持不变)
export interface Port {
  id: string;
  label: string;
  type: string;
  description?: string;
}

// --- START: 重构 ConfigSchemaItem 为可区分联合类型 ---

// 1. 基础接口，包含所有类型共有的属性
interface BaseConfigSchemaItem {
  label: string;         // User-friendly label (所有类型都需要)
  required?: boolean;     // Whether this configuration is mandatory (可选，所有类型可有)
  description?: string;   // Optional help text or description (可选，所有类型可有)
}

// 2. 为每种具体类型定义接口，继承基础接口并添加特定属性

export interface StringConfigSchema extends BaseConfigSchemaItem {
  type: 'string';
  defaultValue?: string;     // Default value specific to string
  placeholder?: string;   // Placeholder text specific to string/textarea
  validationRegex?: string; // Optional regex string for validation
}

export interface TextareaConfigSchema extends BaseConfigSchemaItem {
  type: 'textarea';
  defaultValue?: string;     // Default value specific to string/textarea
  placeholder?: string;   // Placeholder text specific to string/textarea
  rows?: number;           // *** rows 属性只在这里定义 ***
}

export interface NumberConfigSchema extends BaseConfigSchemaItem {
  type: 'number';
  defaultValue?: number;     // Default value specific to number
  min?: number;           // Minimum value
  max?: number;           // Maximum value
  step?: number;          // *** step 属性只在这里定义 ***
}

export interface BooleanConfigSchema extends BaseConfigSchemaItem {
  type: 'boolean';
  defaultValue?: boolean;    // Default value specific to boolean
}

// 定义 Select 选项的结构
export interface SelectOption {
    label: string;
    value: string | number; // 值可以是字符串或数字
}

export interface SelectConfigSchema extends BaseConfigSchemaItem {
  type: 'select';
  defaultValue?: string | number; // Default value specific to select
  options: SelectOption[]; // Options must be an array of {label, value} objects
}

export interface JsonConfigSchema extends BaseConfigSchemaItem {
    type: 'json';
    defaultValue?: string; // JSON 通常以字符串形式编辑
    // 可能有其他特定属性，例如验证 schema 的链接等
}


// 3. 创建 ConfigSchemaItem 联合类型
export type ConfigSchemaItem =
  | StringConfigSchema
  | TextareaConfigSchema
  | NumberConfigSchema
  | BooleanConfigSchema
  | SelectConfigSchema
  | JsonConfigSchema;

// --- END: 重构 ConfigSchemaItem ---


// Define the main structure for an AI Module (保持不变, 但 configSchema 类型已更新)
export interface AIModule {
  id: string;
  name: string;
  description?: string;
  category?: string;
  inputs: Port[];
  outputs: Port[];
  // 使用更新后的 ConfigSchemaItem 联合类型
  configSchema?: Record<string, ConfigSchemaItem>;
  // 这个 defaultConfig 用于节点实例化时的初始值
  defaultConfig?: Record<string, any>; // Keep this as any for flexibility? Or type more strictly?

  icon?: string;
  version?: string;
}


// Example Usage (更新以匹配新类型)
/*
const exampleModule: AIModule = {
  id: 'text-generator',
  name: 'Text Generator',
  description: 'Generates text based on a prompt.',
  category: 'AI Models',
  inputs: [{ id: 'prompt', label: 'Prompt', type: 'string' }],
  outputs: [{ id: 'generated_text', label: 'Generated Text', type: 'string' }],
  configSchema: {
      'model_name': {
          type: 'select', // Correct type
          label: 'Model',
          defaultValue: 'gpt-3.5-turbo',
          options: [ // Use SelectOption structure
              { label: 'GPT-3.5 Turbo', value: 'gpt-3.5-turbo' },
              { label: 'GPT-4', value: 'gpt-4' }
          ]
      },
      'temperature': {
          type: 'number', // Correct type
          label: 'Temperature',
          defaultValue: 0.7,
          min: 0,
          max: 1.0,
          step: 0.05 // Add step example
      }
  },
  defaultConfig: {
      'model_name': 'gpt-3.5-turbo',
      'temperature': 0.7
  },
  icon: '🤖'
};
*/