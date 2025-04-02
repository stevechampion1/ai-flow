// src/components/WorkflowEditor/ConnectionRenderer.tsx
import React, { useMemo } from 'react';
import { toast } from 'react-toastify'; // 添加导入
import { Connection, CanvasItem } from './WorkflowEditor'; // 假设从 WorkflowEditor 导入类型

interface ConnectionRendererProps {
  connection: Connection;
  canvasItems: CanvasItem[];
}

const getPortCenterPosition = (
  itemId: string,
  portId: string,
  direction: 'input' | 'output',
  canvasItems: CanvasItem[]
): { x: number; y: number } | null => {
  const item = canvasItems.find((i) => i.id === itemId);
  if (!item) {
    console.error(`[ConnectionRenderer] Item ${itemId} not found in canvasItems.`);
    return null;
  }

  const port = (direction === 'input' ? item.inputs : item.outputs)?.find((p) => p.id === portId);
  if (!port) {
    console.error(`[ConnectionRenderer] Port ${portId} not found on item ${itemId}.`);
    return null;
  }

  const portElement = document.querySelector(
    `div[data-item-id="${itemId}"] div[data-port-id="${portId}"][data-direction="${direction}"]`
  );
  if (!portElement) {
    console.error(`[ConnectionRenderer] Port element not found for ${itemId}/${portId}.`);
    return null;
  }

  const portRect = portElement.getBoundingClientRect();
  const canvasElement = document.querySelector('.canvas-container');
  if (!canvasElement) {
    console.error('[ConnectionRenderer] Canvas element not found.');
    return null;
  }
  const canvasRect = canvasElement.getBoundingClientRect();

  const x = (portRect.left + portRect.right) / 2 - canvasRect.left;
  const y = (portRect.top + portRect.bottom) / 2 - canvasRect.top;

  return { x, y };
};

const ConnectionRenderer: React.FC<ConnectionRendererProps> = ({ connection, canvasItems }) => {
  const sourcePos = useMemo(
    () =>
      getPortCenterPosition(
        connection.sourceItemId,
        connection.sourcePortId,
        'output',
        canvasItems
      ),
    [connection.sourceItemId, connection.sourcePortId, canvasItems]
  );

  const targetPos = useMemo(
    () =>
      getPortCenterPosition(
        connection.targetItemId,
        connection.targetPortId,
        'input',
        canvasItems
      ),
    [connection.targetItemId, connection.targetPortId, canvasItems]
  );

  if (!sourcePos || !targetPos) {
    console.warn('[ConnectionRenderer] Cannot render connection: invalid positions.', {
      sourcePos,
      targetPos,
      connection,
    });
    toast.warn('Cannot render connection: invalid positions.');
    return null;
  }

  if (isNaN(sourcePos.x) || isNaN(sourcePos.y) || isNaN(targetPos.x) || isNaN(targetPos.y)) {
    console.error('[ConnectionRenderer] Invalid coordinates for connection:', {
      sourcePos,
      targetPos,
    });
    toast.error('Invalid connection coordinates.');
    return null;
  }

  return (
    <line
      x1={sourcePos.x}
      y1={sourcePos.y}
      x2={targetPos.x}
      y2={targetPos.y}
      stroke="#333"
      strokeWidth={2}
      markerEnd="url(#arrowhead)"
      style={{ pointerEvents: 'none' }}
    />
  );
};

export default ConnectionRenderer;