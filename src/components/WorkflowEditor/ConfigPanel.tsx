// src/components/WorkflowEditor/ConfigPanel.tsx (移除类型断言后的版本)
import React, { useMemo, useCallback } from 'react';
import './../../styles/WorkflowEditor.scss'; // 确认路径
import type { ConfigSchemaItem, Port } from '../../../types/ai_module_models'; // 确认路径 (现在是可区分联合类型)
import type { CanvasItem } from '../../../types/CanvasItem'; // 确认路径

interface ConfigPanelProps {
  selectedItemId: string | null;
  canvasItems: CanvasItem[];
  onConfigChange: (itemId: string, newConfig: Record<string, any>) => void;
}

// --- 移除临时类型定义 ---

const ConfigPanel: React.FC<ConfigPanelProps> = ({ selectedItemId, canvasItems, onConfigChange }) => {
  const selectedItem = useMemo(() => {
      return canvasItems.find((item) => item.id === selectedItemId) ?? null;
  }, [selectedItemId, canvasItems]);

  const handleInputChange = useCallback((key: string, value: any) => {
    if (!selectedItem) return;
    const currentConfig = selectedItem.config || {};
    const newConfig = { ...currentConfig, [key]: value };
    onConfigChange(selectedItemId!, newConfig);
  }, [selectedItem, onConfigChange, selectedItemId]);

   const handleCheckboxChange = useCallback((key: string, checked: boolean) => {
       if (!selectedItem) return;
       const newConfig = { ...selectedItem.config, [key]: checked };
       onConfigChange(selectedItemId!, newConfig);
   }, [selectedItem, onConfigChange, selectedItemId]);


  if (!selectedItem) {
    return <div className="config-panel placeholder"><h4>配置</h4><p>请选择一个节点以查看其配置。</p></div>;
  }
  const configSchema = selectedItem.configSchema;
  const headerText = selectedItem.name || '选中节点';
  if (!configSchema || Object.keys(configSchema).length === 0) {
    return <div className="config-panel no-config"><h4>配置: {headerText}</h4><p>该节点没有可配置的选项。</p></div>;
  }


  const renderInput = (key: string, itemSchema: ConfigSchemaItem) => { // itemSchema 现在是可区分联合类型

    switch (itemSchema.type) { // TypeScript 现在可以根据 type 收窄类型
      case 'string': {
        const currentValue = selectedItem.config?.[key] ?? itemSchema.defaultValue ?? '';
        return (
          <div key={key} className="config-item">
            <label htmlFor={key}>{itemSchema.label || key}:</label>
            <input
              type="text" id={key} name={key} value={currentValue}
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => handleInputChange(key, e.target.value)}
              placeholder={itemSchema.placeholder} // 可以安全访问
            />
            {itemSchema.description && <p className="config-item-description">{itemSchema.description}</p>}
          </div>
        );
       }
      case 'textarea': {
        // *** 无需断言 ***
        const currentValue = selectedItem.config?.[key] ?? itemSchema.defaultValue ?? '';
        return (
          <div key={key} className="config-item">
            <label htmlFor={key}>{itemSchema.label || key}:</label>
            <textarea
              id={key} name={key} value={currentValue}
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => handleInputChange(key, e.target.value)}
              placeholder={itemSchema.placeholder} // 可以安全访问
              rows={itemSchema.rows || 3} // <-- 可以安全访问 rows
            />
            {itemSchema.description && <p className="config-item-description">{itemSchema.description}</p>}
          </div>
        );
       }
      case 'number': {
        // *** 无需断言 ***
        const currentValue = selectedItem.config?.[key] ?? itemSchema.defaultValue ?? 0;
        const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const val = e.target.value;
            const num = val === '' ? itemSchema.defaultValue ?? 0 : Number(val);
             if (!isNaN(num)) { handleInputChange(key, num); }
        };
        return (
          <div key={key} className="config-item">
            <label htmlFor={key}>{itemSchema.label || key}:</label>
            <input
              type="number" id={key} name={key} value={currentValue ?? ''}
              onClick={(e) => e.stopPropagation()}
              onChange={handleNumberChange}
              min={itemSchema.min} // <-- 可以安全访问 min
              max={itemSchema.max} // <-- 可以安全访问 max
              step={itemSchema.step} // <-- 可以安全访问 step
            />
            {itemSchema.description && <p className="config-item-description">{itemSchema.description}</p>}
          </div>
        );
       }
      case 'boolean': {
        const currentValue = selectedItem.config?.[key] ?? itemSchema.defaultValue ?? false;
        return (
          <div key={key} className="config-item config-item-boolean">
            <label htmlFor={key}>
              <input
                type="checkbox" id={key} name={key} checked={!!currentValue}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => handleCheckboxChange(key, e.target.checked)}
              />
              <span>{itemSchema.label || key}</span>
            </label>
            {itemSchema.description && <p className="config-item-description">{itemSchema.description}</p>}
          </div>
        );
       }
      case 'select': {
        const currentValue = selectedItem.config?.[key] ?? itemSchema.defaultValue ?? '';
        // itemSchema.options 在这里是 SelectOption[] 类型
        const options = itemSchema.options; // 直接访问
        return (
          <div key={key} className="config-item">
            <label htmlFor={key}>{itemSchema.label || key}:</label>
            <select
              id={key} name={key} value={currentValue}
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => handleInputChange(key, e.target.value)}
            >
              {options.map((option) => ( // option 现在是 SelectOption 类型
                <option key={option.value.toString()} value={option.value}> {/* key 最好是唯一字符串 */}
                  {option.label}
                </option>
              ))}
            </select>
            {itemSchema.description && <p className="config-item-description">{itemSchema.description}</p>}
          </div>
        );
       }
       case 'json': { // 添加对 JSON 类型的处理 (示例)
            const currentValue = selectedItem.config?.[key] ?? itemSchema.defaultValue ?? '';
            const handleJsonChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
                // 可以在这里尝试解析 JSON，如果无效则给出提示或阻止更新
                handleInputChange(key, e.target.value);
            };
            return (
                <div key={key} className="config-item">
                    <label htmlFor={key}>{itemSchema.label || key}:</label>
                    <textarea
                        id={key} name={key} value={currentValue}
                        onClick={(e) => e.stopPropagation()}
                        onChange={handleJsonChange}
                        rows={5} // 默认行数
                        style={{ fontFamily: 'monospace', fontSize: '0.9em' }} // 样式
                    />
                    {itemSchema.description && <p className="config-item-description">{itemSchema.description}</p>}
                 </div>
            );
       }
      default:
         // 处理未覆盖的类型，确保 exhaustive check
         const _exhaustiveCheck: never = itemSchema;
         console.warn(`Unhandled config type: ${(_exhaustiveCheck as any)?.type}`);
        return null;
    }
  };

  return (
    <div className="config-panel">
      <h4>配置: {headerText}</h4>
      <form onSubmit={(e) => e.preventDefault()} className="config-panel-body">
        {Object.entries(configSchema).map(([key, schema]) => renderInput(key, schema))}
      </form>
    </div>
  );
};

export default ConfigPanel;