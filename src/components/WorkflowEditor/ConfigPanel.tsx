// src/components/WorkflowEditor/ConfigPanel.tsx
import React from 'react';
import './../../styles/WorkflowEditor.scss';
import { ConfigSchemaItem, Port } from 'types/ai_module_models'; // 更新路径

interface ConfigPanelProps {
    selectedItemId: string | null;
    canvasItems: {
        id: string;
        type: string;
        name: string;
        top: number;
        left: number;
        config?: Record<string, any>;
        configSchema?: Record<string, ConfigSchemaItem>;
        inputs?: Port[];
        outputs?: Port[];
    }[];
    onConfigChange: (itemId: string, newConfig: Record<string, any>) => void;
}

const ConfigPanel: React.FC<ConfigPanelProps> = ({ selectedItemId, canvasItems, onConfigChange }) => {
    const selectedItem = canvasItems.find((item) => item.id === selectedItemId);

    if (!selectedItemId || !selectedItem) {
        return (
            <div className="config-panel">
                <p>未选中任何组件。</p>
            </div>
        );
    }

    const configSchema = selectedItem.configSchema;

    if (!configSchema) {
        return (
            <div className="config-panel">
                <p>此组件类型没有可配置选项。</p>
            </div>
        );
    }

    const handleConfigChange = (key: string, value: any) => {
        if (selectedItem && selectedItem.config) {
            const newConfig = {
                ...selectedItem.config,
                [key]: value,
            };
            onConfigChange(selectedItemId, newConfig);
        }
    };

    const renderInput = (key: string, item: ConfigSchemaItem) => {
        switch (item.type) {
            case 'text':
                return (
                    <div key={key} className="config-item">
                        <label htmlFor={key}>{item.label}:</label>
                        <input
                            type="text"
                            id={key}
                            value={selectedItem.config?.[key] || item.default || ''}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => handleConfigChange(key, e.target.value)}
                            placeholder={item.placeholder}
                        />
                        {item.description && <p className="config-item-description">{item.description}</p>}
                    </div>
                );
            case 'textarea':
                return (
                    <div key={key} className="config-item">
                        <label htmlFor={key}>{item.label}:</label>
                        <textarea
                            id={key}
                            value={selectedItem.config?.[key] || item.default || ''}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => handleConfigChange(key, e.target.value)}
                            placeholder={item.placeholder}
                        />
                        {item.description && <p className="config-item-description">{item.description}</p>}
                    </div>
                );
            case 'number':
                return (
                    <div key={key} className="config-item">
                        <label htmlFor={key}>{item.label}:</label>
                        <input
                            type="number"
                            id={key}
                            value={selectedItem.config?.[key] || item.default || 0}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => handleConfigChange(key, Number(e.target.value))}
                            min={item.min}
                            max={item.max}
                            step={item.step}
                        />
                        {item.description && <p className="config-item-description">{item.description}</p>}
                    </div>
                );
            case 'boolean':
                return (
                    <div key={key} className="config-item">
                        <label htmlFor={key}>
                            <input
                                type="checkbox"
                                id={key}
                                checked={selectedItem.config?.[key] === true}
                                onClick={(e) => e.stopPropagation()}
                                onChange={(e) => handleConfigChange(key, e.target.checked)}
                            />
                            {item.label}
                        </label>
                        {item.description && <p className="config-item-description">{item.description}</p>}
                    </div>
                );
            case 'select':
                return (
                    <div key={key} className="config-item">
                        <label htmlFor={key}>{item.label}:</label>
                        <select
                            id={key}
                            value={selectedItem.config?.[key] || item.default || ''}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => handleConfigChange(key, e.target.value)}
                        >
                            {item.options?.map((option: string) => (
                                <option key={option} value={option}>
                                    {option}
                                </option>
                            ))}
                        </select>
                        {item.description && <p className="config-item-description">{item.description}</p>}
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="config-panel" onClick={(e) => e.stopPropagation()}>
            <h3>{selectedItem.name} 配置</h3>
            {Object.keys(configSchema).map((key) => renderInput(key, configSchema[key]))}
        </div>
    );
};

export default ConfigPanel;