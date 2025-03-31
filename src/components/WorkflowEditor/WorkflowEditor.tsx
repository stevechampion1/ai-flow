// src/components/WorkflowEditor/WorkflowEditor.tsx
import React, { useRef, useCallback, useEffect, useState } from 'react';
import { useDrop, DropTargetMonitor } from 'react-dnd';
import Toolbar from './Toolbar';
import ConfigPanel from './ConfigPanel';
import ConnectionRenderer from './ConnectionRenderer';
import LoadingOverlay from './LoadingOverlay';
import useWorkflowStore from '../../store/workflowStore';
import './../../styles/WorkflowEditor.scss';
import { saveWorkflow, loadWorkflow } from '../../utils/workflowUtils';
import { runWorkflow } from '../../utils/workflowExecutionUtils';
import { fetchAIModules } from '../../api/workflowApi';
import { AIModule, Port } from 'types/ai_module_models';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Interface for items on the canvas
export interface CanvasItem {
    id: string;
    type: string;
    name: string;
    top: number;
    left: number;
    width: number;
    height: number;
    config?: Record<string, any>;
    configSchema?: Record<string, any>;
    data: any;
    inputs?: Port[];
    outputs?: Port[];
    executionResult?: any;
}

// Interface for connections between items
export interface Connection {
    sourceItemId: string;
    sourcePortId: string;
    targetItemId: string;
    targetPortId: string;
}

// Define the type for source/target port references explicitly
interface PortReference {
    itemId: string;
    portId: string;
}

// Props expected by the ConnectionRenderer component
interface ConnectionRendererProps {
    key: string;
    connection: Connection;
    canvasItems: CanvasItem[];
}


const WorkflowEditor: React.FC = () => {
    const [workflowId, setWorkflowId] = useState<string | null>(null);
    const [connectingPort, setConnectingPort] = useState<{
        itemId: string;
        portId: string;
        direction: 'input' | 'output';
        type: string;
    } | null>(null);
    const [aiModules, setAiModules] = useState<AIModule[]>([]);

    const {
        canvasItems,
        connections,
        selectedItemId,
        history,
        historyIndex,
        mousePosition, // Make sure this is correctly initialized in your store (e.g., { x: 0, y: 0 })
        isLoading,
        error,
        setMousePosition,
        setSelectedItemId,
        addCanvasItem,
        updateCanvasItemConfig,
        addConnection,
        setCanvasItems,
        setConnections,
        removeCanvasItem,
        undo,
        redo,
        clearHistory,
        setLoading,
        setError,
    } = useWorkflowStore();

    const canvasRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const loadModules = async () => {
            setLoading(true);
            try {
                const modules = await fetchAIModules();
                setAiModules(modules);
            } catch (err: any) {
                setError(`Failed to load AI modules: ${err.message}`);
                toast.error(`Failed to load AI modules: ${err.message}`);
            } finally {
                setLoading(false);
            }
        };
        loadModules();
    }, [setLoading, setError]);

    const generateUniqueId = (): string => `item_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const getRelativePosition = useCallback((clientX: number, clientY: number) => {
        if (!canvasRef.current) return { x: 0, y: 0 };
        const rect = canvasRef.current.getBoundingClientRect();
        return {
            x: clientX - rect.left + canvasRef.current.scrollLeft,
            y: clientY - rect.top + canvasRef.current.scrollTop,
        };
    }, []);

    const [{ isOver }, drop] = useDrop<{ id: number; type: string; name: string }, void, { isOver: boolean }>(
        () => ({
            accept: 'AI_MODULE',
            drop: (item: { id: number; type: string; name: string }, monitor: DropTargetMonitor) => {
                const offset = monitor.getClientOffset();
                if (!offset || !canvasRef.current) return;
                const { x: dropX, y: dropY } = getRelativePosition(offset.x, offset.y);
                const draggedModule = aiModules.find((module: AIModule) => module.id === String(item.id));

                if (draggedModule) {
                    const newItem: CanvasItem = {
                        id: generateUniqueId(), type: draggedModule.type, name: draggedModule.name,
                        top: dropY, left: dropX, width: 150, height: 80,
                        config: draggedModule.config || {}, configSchema: draggedModule.configSchema, data: null,
                        inputs: draggedModule.inputs?.map((input: Port) => ({ ...input, id: input.id, type: input.type || 'any', connectedTo: (input as any).connectedTo || [], })) || [],
                        outputs: draggedModule.outputs?.map((output: Port) => ({ ...output, id: output.id, type: output.type || 'any', connectedTo: (output as any).connectedTo || [], })) || [],
                        executionResult: null,
                    };
                    addCanvasItem(newItem);
                } else {
                    console.warn(`Dropped module with ID ${item.id} not found in aiModules list.`);
                    toast.warn(`Module data for ID ${item.id} not found.`);
                }
            },
            collect: (monitor) => ({ isOver: monitor.isOver() }),
        }),
        [aiModules, addCanvasItem, getRelativePosition]
    );

    // --- Handlers ---
    const handleSave = async () => { /* ... */ };
    const handleLoad = async () => { /* ... */ };
    const handleRun = async () => { /* ... */ };
    const handleUndo = useCallback(() => { undo(); }, [undo]);
    const handleRedo = useCallback(() => { redo(); }, [redo]);
    const handleItemClick = useCallback((itemId: string) => { setSelectedItemId(itemId); }, [setSelectedItemId]);
    const handleContextMenu = (e: React.MouseEvent<HTMLDivElement>, itemId: string) => { /* ... */ };

    const handlePortMouseDown = (
        e: React.MouseEvent<HTMLDivElement>,
        itemId: string,
        portId: string,
        direction: 'input' | 'output',
        type: string
    ) => {
        // *** ADD LOG ***
        console.log("[handlePortMouseDown] Triggered.", { itemId, portId, direction, type });
        e.stopPropagation();
        const startPort = { itemId, portId, direction, type };
        setConnectingPort(startPort);
        // *** ADD LOG ***
        console.log("[handlePortMouseDown] setConnectingPort called with:", startPort);
        const { x, y } = getRelativePosition(e.clientX, e.clientY);
        // *** ADD LOG ***
        console.log("[handlePortMouseDown] Initial mouse position:", { x, y });
        setMousePosition({ x, y });
    };

    const handlePortMouseUp = (
        e: React.MouseEvent<HTMLDivElement>,
        targetItemId: string,
        targetPortId: string,
        targetDirection: 'input' | 'output',
        targetType: string
    ) => {
        // *** ADD LOG ***
        console.log("[handlePortMouseUp] Triggered.", { targetItemId, targetPortId, targetDirection, connectingPort });
        e.stopPropagation();
        if (connectingPort) {
            // ... (validation logic remains the same) ...
            if (connectingPort.itemId === targetItemId) { /* ... */ }
            else if (connectingPort.direction === targetDirection) { /* ... */ }
            else if (connectingPort.type !== 'any' && targetType !== 'any' && connectingPort.type !== targetType) { /* ... */ }
            else {
                let source: PortReference;
                let target: PortReference;
                if (connectingPort.direction === 'output') {
                    source = { itemId: connectingPort.itemId, portId: connectingPort.portId };
                    target = { itemId: targetItemId, portId: targetPortId };
                } else {
                    source = { itemId: targetItemId, portId: targetPortId };
                    target = { itemId: connectingPort.itemId, portId: connectingPort.portId };
                }
                // ... (connection existence checks remain the same) ...
                const connectionExists = connections.some(/* ... */);
                const targetInputAlreadyConnected = connections.some(/* ... */);

                if (connectionExists) { console.log("[handlePortMouseUp] Connection already exists."); }
                else if (targetInputAlreadyConnected) { /* ... */ }
                else {
                    const newConnection: Connection = { sourceItemId: source.itemId, sourcePortId: source.portId, targetItemId: target.itemId, targetPortId: target.portId };
                    // *** ADD LOG ***
                    console.log("[handlePortMouseUp] Adding new connection:", newConnection);
                    addConnection(newConnection);
                }
            }
            // *** ADD LOG ***
            console.log("[handlePortMouseUp] Resetting connectingPort to null.");
            setConnectingPort(null);
        } else {
             console.log("[handlePortMouseUp] No connectingPort active.");
        }
    };

    const handleMouseMove = useCallback(
        (e: MouseEvent) => {
             // *** ADD LOG ***
            // console.log("[handleMouseMove] Triggered."); // This might be too noisy, enable if needed
            if (connectingPort && canvasRef.current) {
                const { x, y } = getRelativePosition(e.clientX, e.clientY);
                 // *** ADD LOG ***
                // console.log("[handleMouseMove] Setting mouse position:", { x, y }); // Also potentially noisy
                setMousePosition({ x, y });
            }
        },
        [connectingPort, getRelativePosition, setMousePosition]
    );

    const handleCanvasMouseUp = useCallback(() => {
        if (connectingPort) {
            // *** ADD LOG ***
            console.log("[handleCanvasMouseUp] Connection cancelled. Resetting connectingPort.");
            setConnectingPort(null);
        }
    }, [connectingPort]);

    // --- Helpers & Renderers ---
    const getPortCenterPositionFallback = (item: CanvasItem, portId: string, direction: 'input' | 'output') => { /* ... */ };

    const renderConnections = () => {
         // *** ADD LOG ***
         // console.log("[renderConnections] Rendering connections:", connections); // Potentially noisy
        return connections.map((connection) => {
            const sourceItem = canvasItems.find(item => item.id === connection.sourceItemId);
            const targetItem = canvasItems.find(item => item.id === connection.targetItemId);
            if (!sourceItem || !targetItem) { return null; }
            return ( <ConnectionRenderer key={`${c.s}-${c.sp}-${c.t}-${c.tp}`} connection={connection} canvasItems={canvasItems} /> );
        });
    };

    const renderTemporaryConnection = () => {
        if (connectingPort) {
            const sourceItem = canvasItems.find(item => item.id === connectingPort.itemId);
            if (!sourceItem) return null;
            const sourcePos = getPortCenterPositionFallback(sourceItem, connectingPort.portId, connectingPort.direction);
            const targetPos = mousePosition;
            // *** ADD LOG ***
            console.log("[renderTemporaryConnection] Rendering line.", { connectingPort, sourcePos, targetPos });

            if (isNaN(sourcePos.x) || isNaN(sourcePos.y) || isNaN(targetPos.x) || isNaN(targetPos.y)) {
                 console.error("[renderTemporaryConnection] Invalid coordinates calculated!");
                 return null;
            }

            return ( <line x1={sP.x} y1={sP.y} x2={tP.x} y2={tP.y} stroke="red" strokeDasharray="5,5" strokeWidth={2} style={{ pointerEvents: 'none' }} /> );
        }
        return null;
    };

    // --- Effects ---
    useEffect(() => {
        if (connectingPort) {
            // *** ADD LOG ***
            console.log("[Effect connectingPort] Adding mousemove/mouseup listeners.");
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleCanvasMouseUp);
            return () => {
                // *** ADD LOG ***
                console.log("[Effect connectingPort] Removing mousemove/mouseup listeners.");
                window.removeEventListener('mousemove', handleMouseMove);
                window.removeEventListener('mouseup', handleCanvasMouseUp);
            };
        } else {
             // *** ADD LOG ***
             // console.log("[Effect connectingPort] No connectingPort, listeners should be removed."); // Optional log
        }
    }, [connectingPort, handleMouseMove, handleCanvasMouseUp]); // Dependencies look correct

    useEffect(() => { if (error) { /* ... */ } }, [error, setError]);
    const setCanvasRef = useCallback((node: HTMLDivElement | null) => { drop(node); canvasRef.current = node; }, [drop]);
    const canUndo = historyIndex > 0;
    const canRedo = historyIndex < history.length - 1;

    return (
        <div className="workflow-editor-container">
            <div ref={setCanvasRef} className={`c-c ${isOver ? 'i-o':''}`} onClick={e => { if (e.target === cR.current) { setSIId(null); } if (cP) { setCP(null); } }} onMouseUp={handleCanvasMouseUp}>
                <Toolbar onSave={hS} onLoad={hL} onRun={hR} onUndo={hU} onRedo={hRd} canUndo={cU} canRedo={cRd} isLoading={iL} />
                {canvasItems.map((item: CanvasItem) => (
                    <div key={item.id} data-id={item.id} className={`c-i ${sIId === item.id ? 's':''}`} style={{ /*...*/ }} onClick={e => { e.stopPropagation(); hIClick(item.id); }} onContextMenu={(e) => hCMenu(e, item.id)}>
                        <div className="m-h">{item.name}</div>
                        <div className="ports">
                            <div className="i-p">
                                {item.inputs?.map((port: Port) => (
                                    <div key={p.id} className="p i-p" title={`I: ${p.id} (${p.type})`} data-port-id={p.id} data-item-id={item.id} data-direction="input" data-port-type={p.type} data-port="true"
                                        onMouseDown={e => handlePortMouseDown(e, item.id, port.id, 'input', port.type)} // Pass correct port id
                                        onMouseUp={e => handlePortMouseUp(e, item.id, port.id, 'input', port.type)} // Pass correct port id
                                    ></div>
                                ))}
                            </div>
                            <div className="o-p">
                                {item.outputs?.map((port: Port) => (
                                     <div key={p.id} className="p o-p" title={`O: ${p.id} (${p.type})`} data-port-id={p.id} data-item-id={item.id} data-direction="output" data-port-type={p.type} data-port="true"
                                         onMouseDown={e => handlePortMouseDown(e, item.id, port.id, 'output', port.type)} // Pass correct port id
                                         onMouseUp={e => handlePortMouseUp(e, item.id, port.id, 'output', port.type)} // Pass correct port id
                                     ></div>
                                ))}
                            </div>
                        </div>
                        {item.executionResult && ( <div className="e-r" title={/*...*/}> R: { /*...*/ } </div> )}
                    </div>
                ))}
                <svg className="c-svg" width="100%" height="100%" style={{ /*...*/ }}>
                    {renderConnections()}
                    {renderTemporaryConnection()} {/* This call needs to happen for the line to render */}
                </svg>
                <LoadingOverlay isLoading={isLoading} />
                {!canvasItems.length && !isLoading && ( <div className="c-h" style={{ pointerEvents: 'none' }}> Drag modules here. </div> )}
            </div>
            <div className="c-p-c" onClick={e => e.stopPropagation()}> <ConfigPanel sIId={sIId} cI={cI} onCChange={uCIC} /> </div>
            <ToastContainer position="b-r" autoClose={3000} /*...*/ />
        </div>
    );
};

export default WorkflowEditor;

// NOTE: In the JSX part, I've shortened variable names (e.g., hS for handleSave)
// and class names (e.g., c-c for canvas-container) for brevity in the diff.
// Ensure your actual code uses the full, meaningful names.
// Also, make sure the port mapping uses the correct `port.id` variable in the loops.