// src/components/WorkflowEditor/ConnectionRenderer.tsx (修复后)
import React, { useMemo } from 'react';
// *** 修正导入路径 ***
import type { Connection } from '../../../types/Connection'; // 从 WorkflowEditor/ -> ../../../types/
// *** 修正导入路径 (指向 types/ 目录) ***
import type { CanvasItem } from '../../../types/CanvasItem'; // 从 WorkflowEditor/ -> ../../../types/

interface ConnectionRendererProps {
  connection: Connection;
  canvasRef: React.RefObject<HTMLDivElement>;
  isSelected: boolean;
  onClick: (connectionId: string) => void;
}

// --- 使用原版代码提供的本地 getPortCenterPosition 函数 ---
const getPortCenterPosition = (
  canvasElement: HTMLDivElement | null,
  itemId: string,
  portId: string,
  direction: 'input' | 'output',
): { x: number; y: number } | null => {
   if (!canvasElement) return null;
   const portSelector = `div[data-item-id="${itemId}"] div[data-port-id="${portId}"][data-direction="${direction}"]`;
   const portElement = canvasElement.querySelector(portSelector);
   if (!portElement) { return null; } // Port might not be rendered yet
   try {
     const portRect = portElement.getBoundingClientRect();
     const canvasRect = canvasElement.getBoundingClientRect();
     // Check for 0 dimensions which can occur temporarily
     if (!portRect || !canvasRect || portRect.width === 0 || portRect.height === 0 || canvasRect.width === 0 || canvasRect.height === 0) {
         // Don't warn excessively, just return null
         return null;
     }
     const x = portRect.left + portRect.width / 2 - canvasRect.left + canvasElement.scrollLeft;
     const y = portRect.top + portRect.height / 2 - canvasRect.top + canvasElement.scrollTop;
     if (isNaN(x) || isNaN(y)) {
         // Avoid NaN values
         return null;
     }
     return { x, y };
   } catch (e) {
       console.error("[getPortCenterPosition] Error:", e); // Log errors
       return null;
   }
};
// --- END: 本地 getPortCenterPosition 函数 ---


const ConnectionRenderer: React.FC<ConnectionRendererProps> = ({
    connection,
    canvasRef,
    isSelected,
    onClick
}) => {

  // 使用 useMemo 计算起始点和结束点位置
  const sourcePos = useMemo(() => {
      return getPortCenterPosition(canvasRef.current, connection.sourceItemId, connection.sourcePortId, 'output');
  }, [canvasRef, connection.sourceItemId, connection.sourcePortId]);

  const targetPos = useMemo(() => {
      return getPortCenterPosition(canvasRef.current, connection.targetItemId, connection.targetPortId, 'input');
  }, [canvasRef, connection.targetItemId, connection.targetPortId]);

  // 如果任一点无法计算，则不渲染连接线
  if (!sourcePos || !targetPos) {
    return null;
  }
  // 额外的 NaN 检查以防万一
  if (isNaN(sourcePos.x) || isNaN(sourcePos.y) || isNaN(targetPos.x) || isNaN(targetPos.y)) {
     console.error(`NaN position calculated for connection ${connection.id}`);
     return null;
  }

  // 样式和标记
  const strokeColor = isSelected ? '#ff4d4d' : '#666';
  const strokeWidth = isSelected ? 3 : 2;
  const markerId = isSelected ? 'url(#arrowhead-selected)' : 'url(#arrowhead)';
  const hitStrokeWidth = 10; // 用于点击的隐形路径宽度

  // 贝塞尔曲线路径计算 (保持原版逻辑)
  const dx = targetPos.x - sourcePos.x;
  const dy = targetPos.y - sourcePos.y;
  const cp1x = sourcePos.x + dx * 0.25;
  const cp1y = sourcePos.y + dy * 0.1;
  const cp2x = sourcePos.x + dx * 0.75;
  const cp2y = sourcePos.y + dy * 0.9;
  const pathData = `M ${sourcePos.x} ${sourcePos.y} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${targetPos.x} ${targetPos.y}`;

  // 使用原版的 <g> 包裹和 onClick 处理方式
  return (
    <g
        onClick={(e) => {
            e.stopPropagation(); // 阻止事件冒泡到 Canvas
            onClick(connection.id); // 调用传入的 onClick 回调
        }}
        style={{ cursor: 'pointer' }}
        className={`connection-group ${isSelected ? 'selected' : ''}`}
        >
        {/* 隐形路径用于更容易点击 */}
        <path
            d={pathData}
            fill="none"
            stroke="transparent"
            strokeWidth={hitStrokeWidth}
            style={{ pointerEvents: 'stroke' }} // 仅笔画响应事件
        />
        {/* 可见路径 */}
        <path
            d={pathData}
            fill="none"
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            markerEnd={markerId}
            style={{ pointerEvents: 'none' }} // 可见路径不响应事件
            className="connection-visible-path"
        />
    </g>
  );
};

export default ConnectionRenderer;