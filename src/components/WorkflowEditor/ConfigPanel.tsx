// src/components/WorkflowEditor/ConfigPanel.tsx
import React from 'react';
import './../../styles/WorkflowEditor.scss'; // Assuming path is correct
import { ConfigSchemaItem, Port } from '../../../types/ai_module_models'; // Corrected Path

// Use a local CanvasItem type definition matching WorkflowEditor's if not importing
interface CanvasItemForPanel {
  id: string;
  name: string;
  config?: Record<string, any>;
  configSchema?: Record<string, ConfigSchemaItem>;
}

interface ConfigPanelProps {
  selectedItemId: string | null;
  canvasItems: CanvasItemForPanel[];
  onConfigChange: (itemId: string, newConfig: Record<string, any>) => void;
}

const ConfigPanel: React.FC<ConfigPanelProps> = ({ selectedItemId, canvasItems, onConfigChange }) => {
  const selectedItem = canvasItems.find((item) => item.id === selectedItemId);

  if (!selectedItemId || !selectedItem) {
    return (
      <div className="config-panel">
        <h4>Configuration</h4>
        <p>No item selected.</p>
      </div>
    );
  }

  const configSchema = selectedItem.configSchema;
  const headerText = selectedItem.name || 'Selected Item';

  if (!configSchema || Object.keys(configSchema).length === 0) {
    return (
      <div className="config-panel">
        <h4>{headerText} Configuration</h4>
        <p>No configurable options for this item.</p>
      </div>
    );
  }

  const handleInputChange = (key: string, value: any) => {
    const currentConfig = selectedItem.config || {};
    const newConfig = {
      ...currentConfig,
      [key]: value,
    };
    onConfigChange(selectedItemId, newConfig);
  };

  const renderInput = (key: string, itemSchema: ConfigSchemaItem) => {
    const currentValue = selectedItem.config?.[key] ?? itemSchema.default ?? '';

    switch (itemSchema.type) {
      case 'text':
        return (
          <div key={key} className="config-item">
            <label htmlFor={key}>{itemSchema.label || key}:</label>
            <input
              type="text"
              id={key}
              name={key}
              value={currentValue}
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => handleInputChange(key, e.target.value)}
              placeholder={itemSchema.placeholder}
            />
            {itemSchema.description && <p className="config-item-description">{itemSchema.description}</p>}
          </div>
        );
      case 'textarea':
        const currentTextAreaValue = selectedItem.config?.[key] ?? itemSchema.default ?? '';
        return (
          <div key={key} className="config-item">
            <label htmlFor={key}>{itemSchema.label || key}:</label>
            <textarea
              id={key}
              name={key}
              value={currentTextAreaValue}
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => handleInputChange(key, e.target.value)}
              placeholder={itemSchema.placeholder}
              rows={itemSchema.rows || 3}
            />
            {itemSchema.description && <p className="config-item-description">{itemSchema.description}</p>}
          </div>
        );
      case 'number':
        const currentNumberValue = selectedItem.config?.[key] ?? itemSchema.default ?? 0;
        return (
          <div key={key} className="config-item">
            <label htmlFor={key}>{itemSchema.label || key}:</label>
            <input
              type="number"
              id={key}
              name={key}
              value={currentNumberValue}
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => handleInputChange(key, e.target.value === '' ? null : Number(e.target.value))}
              min={itemSchema.min}
              max={itemSchema.max}
              step={itemSchema.step}
            />
            {itemSchema.description && <p className="config-item-description">{itemSchema.description}</p>}
          </div>
        );
      case 'boolean':
        const currentBoolValue = selectedItem.config?.[key] ?? itemSchema.default ?? false;
        return (
          <div key={key} className="config-item config-item-boolean">
            <label htmlFor={key}>
              <input
                type="checkbox"
                id={key}
                name={key}
                checked={currentBoolValue === true}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => handleInputChange(key, e.target.checked)}
              />
              <span>{itemSchema.label || key}</span>
            </label>
            {itemSchema.description && <p className="config-item-description">{itemSchema.description}</p>}
          </div>
        );
      case 'select':
        const currentSelectValue = selectedItem.config?.[key] ?? itemSchema.default ?? '';
        return (
          <div key={key} className="config-item">
            <label htmlFor={key}>{itemSchema.label || key}:</label>
            <select
              id={key}
              name={key}
              value={currentSelectValue}
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => handleInputChange(key, e.target.value)}
            >
              {itemSchema.options?.map((option: string | { value: string; label: string }) => {
                const value = typeof option === 'string' ? option : option.value;
                const label = typeof option === 'string' ? option : option.label;
                return (
                  <option key={value} value={value}>
                    {label}
                  </option>
                );
              })}
            </select>
            {itemSchema.description && <p className="config-item-description">{itemSchema.description}</p>}
          </div>
        );
      default:
        console.warn(`Unsupported config type: ${itemSchema.type} for key: ${key}`);
        return null;
    }
  };

  return (
    <div className="config-panel" onClick={(e) => e.stopPropagation()}>
      <h4>{headerText} Configuration</h4>
      <form>
        {Object.entries(configSchema).map(([key, schema]) => renderInput(key, schema))}
      </form>
    </div>
  );
};

export default ConfigPanel;