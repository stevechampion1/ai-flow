// src/components/WorkflowEditor/Connection.tsx
import React, { useCallback } from 'react';

interface PortPosition {
  x: number;
  y: number;
}

interface Props {
  source: PortPosition;
  target: PortPosition;
  sourceItemId: string;
  sourcePortId: string;
  targetItemId: string;
  targetPortId: string;
  isTemporary?: boolean;
  onConnectionClick?: (
    sourceItemId: string,
    sourcePortId: string,
    targetItemId: string,
    targetPortId: string
  ) => void;
}

const Connection: React.FC<Props> = ({
  source,
  target,
  sourceItemId,
  sourcePortId,
  targetItemId,
  targetPortId,
  isTemporary = false,
  onConnectionClick,
}) => {
  const handleClick = useCallback(() => {
    if (onConnectionClick) {
      onConnectionClick(sourceItemId, sourcePortId, targetItemId, targetPortId);
    }
  }, [onConnectionClick, sourceItemId, sourcePortId, targetItemId, targetPortId]);

  return (
    <line
      x1={source.x}
      y1={source.y}
      x2={target.x}
      y2={target.y}
      stroke={isTemporary ? 'red' : 'black'}
      strokeWidth={2}
      strokeDasharray={isTemporary ? '5,5' : undefined}
      onClick={handleClick}
      style={{ pointerEvents: isTemporary ? 'none' : 'auto' }} // 临时连接线不响应鼠标事件
    />
  );
};

export default Connection;