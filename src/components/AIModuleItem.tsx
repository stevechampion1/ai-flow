// src/components/AIModuleItem.tsx
import React from 'react';
import { useDrag } from 'react-dnd';
import { AIModule } from '../../types/ai_module_models'; // 确认路径是否需要调整，相对于 src 目录
import { ItemTypes } from '../constants/dndTypes';     // 从共享文件导入 ItemTypes

interface AIModuleItemProps {
  module: AIModule;
}

const AIModuleItem: React.FC<AIModuleItemProps> = ({ module }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    // 关键修改：使用共享常量 ItemTypes.MODULE
    type: ItemTypes.MODULE,
    // 关键修改：传递完整的 module 对象作为拖动数据
    // WorkflowEditor 的 drop 处理函数会接收到这个完整的对象
    item: module,
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }), [module]); // 将 module 加入依赖项数组

  return (
    // 将根元素从 div 改为 li，因为它是在 AIModuleLibrary 的 ul 中渲染的
    <li
      ref={drag}
      className="ai-module-item"
      style={{ opacity: isDragging ? 0.5 : 1, cursor: 'move' }} // 添加 cursor: 'move' 提示可拖动
      title={`Drag '${module.name}' to the canvas`} // 添加 title 提示
    >
      <h3>{module.name}</h3>
      <p>{module.description}</p>
      {/* 可以考虑添加一个小的拖动图标 */}
    </li>
  );
};

export default AIModuleItem;