// src/components/WorkflowEditor/ConnectionRenderer.tsx
import React from 'react';
import useWorkflowStore from '../../store/workflowStore';
import { Connection, CanvasItem } from './WorkflowEditor';
import { Port } from 'types/ai_module_models';

interface ConnectionRendererProps {
    connection: Connection;
    canvasItems: CanvasItem[];
}

const ConnectionRenderer: React.FC<ConnectionRendererProps> = ({ connection, canvasItems }) => {
    const { removeConnection } = useWorkflowStore();

    const getPortCenterPosition = (
        item: CanvasItem,
        portId: string,
        direction: 'input' | 'output',
        conn: Connection
    ) => {
        if (direction === 'input' && item.inputs) {
            const port = item.inputs.find((p: Port) => p.id === portId);
            if (!port) return { x: item.left, y: item.top };
            const connectedTo = port.connectedTo?.find(
                (c: { itemId: string; portId: string }) => c.itemId === conn.sourceItemId && c.portId === conn.sourcePortId
            );
            const index = connectedTo ? port.connectedTo!.indexOf(connectedTo) : 0;
            const spacing = item.height / (item.inputs.length + 1);
            return { x: item.left - 5, y: item.top + spacing * (index + 1) };
        } else if (direction === 'output' && item.outputs) {
            const port = item.outputs.find((p: Port) => p.id === portId);
            if (!port) return { x: item.left, y: item.top };
            const connectedTo = port.connectedTo?.find(
                (c: { itemId: string; portId: string }) => c.itemId === conn.targetItemId && c.portId === conn.targetPortId
            );
            const index = connectedTo ? port.connectedTo!.indexOf(connectedTo) : 0;
            const spacing = item.height / (item.outputs.length + 1);
            return { x: item.left + item.width + 5, y: item.top + spacing * (index + 1) };
        }
        return { x: item.left, y: item.top };
    };

    const sourceItem = canvasItems.find((item) => item.id === connection.sourceItemId);
    const targetItem = canvasItems.find((item) => item.id === connection.targetItemId);

    if (!sourceItem || !targetItem) {
        console.warn('Source or target item not found for connection:', connection);
        return null;
    }

    const sourcePos = getPortCenterPosition(sourceItem, connection.sourcePortId, 'output', connection);
    const targetPos = getPortCenterPosition(targetItem, connection.targetPortId, 'input', connection);

    const dx = targetPos.x - sourcePos.x;
    const controlPointOffset = Math.abs(dx) * 0.5;
    const cp1x = sourcePos.x + controlPointOffset;
    const cp1y = sourcePos.y;
    const cp2x = targetPos.x - controlPointOffset;
    const cp2y = targetPos.y;

    const pathD = `
        M ${sourcePos.x},${sourcePos.y}
        C ${cp1x},${cp1y} ${cp2x},${cp2y} ${targetPos.x},${targetPos.y}
    `;

    const handleClick = async (e: React.MouseEvent<SVGPathElement>) => {
        e.stopPropagation();
        if (confirm('Are you sure you want to delete this connection?')) {
            await removeConnection(connection);
        }
    };

    return (
        <g>
            <path
                d={pathD}
                stroke="black"
                strokeWidth={2}
                fill="none"
                style={{ pointerEvents: 'auto' }}
                onClick={handleClick}
            />
            <polygon
                points={`${targetPos.x},${targetPos.y} ${targetPos.x - 8},${targetPos.y - 4} ${targetPos.x - 8},${targetPos.y + 4}`}
                fill="black"
            />
        </g>
    );
};

export default ConnectionRenderer;