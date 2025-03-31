// src/components/AIModuleItem.tsx
import React from 'react';
import { useDrag } from 'react-dnd';
import { AIModule } from 'types/ai_module_models'; // 更新路径

interface AIModuleItemProps {
  module: AIModule;
}

const AIModuleItem: React.FC<AIModuleItemProps> = ({ module }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'AI_MODULE',
    item: { id: module.id, type: module.type, name: module.name },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  return (
    <div ref={drag} className="ai-module-item" style={{ opacity: isDragging ? 0.5 : 1 }}>
      <h3>{module.name}</h3>
      <p>{module.description}</p>
    </div>
  );
};

export default AIModuleItem;