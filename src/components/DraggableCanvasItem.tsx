// src/components/DraggableCanvasItem.tsx (修复后)
import React from 'react';
import { useDrag, DragSourceMonitor } from 'react-dnd';
import { ItemTypes } from '../constants/dndTypes';
// *** 修正导入路径 (指向 types/ 目录) ***
import type { CanvasItem } from '../../types/CanvasItem'; // 从 src/components/ -> ../../types/

interface DraggableCanvasItemProps {
  item: CanvasItem; // 使用导入的 CanvasItem 类型
  children: React.ReactNode;
  // 原版代码中包含 onClick，虽然未在 style 中使用，但保留以匹配原版接口
  onClick?: () => void;
}

// 使用原版定义的接口名称
export interface DraggedCanvasItemData {
  type: string; // 确保 type 存在
  id: string;   // 确保 id 存在
}

export const DraggableCanvasItem: React.FC<DraggableCanvasItemProps> = ({ item, children, onClick }) => {
  const [{ isDragging }, drag] = useDrag<
    DraggedCanvasItemData, // 使用接口
    void,
    { isDragging: boolean }
  >(() => ({
    type: ItemTypes.CANVAS_ITEM,
    // 传递符合 DraggedCanvasItemData 结构的对象
    item: { type: ItemTypes.CANVAS_ITEM, id: item.id },
    collect: (monitor: DragSourceMonitor<DraggedCanvasItemData, void>) => ({ // 明确 monitor 类型
      isDragging: monitor.isDragging(),
    }),
  }), [item.id]); // 依赖项

  const style: React.CSSProperties = {
    position: 'absolute', // 绝对定位由父级控制
    left: item.position.x,
    top: item.position.y,
    opacity: isDragging ? 0.5 : 1, // 拖拽时半透明
    cursor: 'move', // 移动光标
    zIndex: isDragging ? 1000 : item.zIndex || 1, // 拖拽时置顶
  };

  // 将 drag ref 应用到 div，并保留 onClick
  return (
    <div ref={drag} style={style} onClick={onClick}>
      {children}
    </div>
  );
};