// src/components/WorkflowEditor/WorkflowEditor.tsx
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { DndProvider, useDrag, useDrop, DropTargetMonitor } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { ToastContainer, toast, ToastPosition } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './WorkflowEditor.css';

// --- Import Fixes & Inline Type Definitions ---
import { AIModule, Port, ConfigSchemaItem } from '../../../types/ai_module_models';

// Define necessary types inline
export interface Connection {
  sourceItemId: string;
  sourcePortId: string;
  targetItemId: string;
  targetPortId: string;
}

export interface CanvasItem {
  id: string;
  moduleId: string;
  name: string;
  config: Record<string, any>;
  configSchema?: Record<string, ConfigSchemaItem>;
  inputs?: Port[];
  outputs?: Port[];
  position: { x: number; y: number };
  executionResult: any | null;
}

export interface PortReference {
  itemId: string;
  portId: string;
  direction: 'input' | 'output';
  type: string;
}

export interface WorkflowState {
  items: CanvasItem[];
  connections: Connection[];
}

import ConfigPanel from './ConfigPanel';
import ConnectionRenderer from './ConnectionRenderer';
import Toolbar from './Toolbar';

interface ConfigPanelProps {
  selectedItemId: string | null;
  canvasItems: CanvasItem[];
  onConfigChange: (itemId: string, newConfig: Record<string, any>) => void;
}

interface WorkflowEditorProps {
  initialState?: WorkflowState;
}

const ItemTypes = {
  MODULE: 'module',
  CANVAS_ITEM: 'canvasItem',
};

interface CanvasItemDragObject {
  id: string;
  type: string;
  x: number;
  y: number;
}

const getPortPosition = (
  canvasElement: HTMLDivElement | null,
  itemId: string,
  portId: string,
  direction: 'input' | 'output'
): { x: number; y: number } | null => {
  if (!canvasElement) return null;

  const portElement = canvasElement.querySelector(
    `div[data-item-id="${itemId}"] div[data-port-id="${portId}"][data-direction="${direction}"]`
  );

  if (!portElement) {
    console.error(`[getPortPosition] Port element not found for item ${itemId}, port ${portId}`);
    return null;
  }

  const portRect = portElement.getBoundingClientRect();
  const canvasRect = canvasElement.getBoundingClientRect();

  const x = (portRect.left + portRect.right) / 2 - canvasRect.left;
  const y = (portRect.top + portRect.bottom) / 2 - canvasRect.top;

  return { x, y };
};

const WorkflowEditor: React.FC<WorkflowEditorProps> = ({ initialState }) => {
  const [canvasItems, setCanvasItems] = useState<CanvasItem[]>(initialState?.items || []);
  const [connections, setConnections] = useState<Connection[]>(initialState?.connections || []);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [connectingPort, setConnectingPort] = useState<PortReference | null>(null);
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number } | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [canvasOffset, setCanvasOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const [isLoading, setIsLoading] = useState(false);
  const [history, setHistory] = useState<{ items: CanvasItem[], connections: Connection[] }[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const saveHistory = useCallback((newItems: CanvasItem[], newConnections: Connection[]) => {
    console.log("[WorkflowEditor] Saving history state.");
    const newState = { items: newItems, connections: newConnections };
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newState);
    setHistory(newHistory);
    const newIndex = newHistory.length - 1;
    setHistoryIndex(newIndex);
    setCanUndo(newIndex > 0);
    setCanRedo(false);
  }, [history, historyIndex]);

  const [, drop] = useDrop(() => ({
    accept: [ItemTypes.MODULE, ItemTypes.CANVAS_ITEM],
    drop: (item: AIModule | CanvasItemDragObject, monitor: DropTargetMonitor) => {
      const delta = monitor.getDifferenceFromInitialOffset();
      const currentOffset = monitor.getClientOffset();
      if (!delta || !currentOffset || !canvasRef.current) return;

      const canvasRect = canvasRef.current.getBoundingClientRect();
      let left = currentOffset.x - canvasRect.left;
      let top = currentOffset.y - canvasRect.top;

      console.log("[WorkflowEditor] Drop detected.", { item, delta, currentOffset, canvasRect });

      if (monitor.getItemType() === ItemTypes.MODULE) {
        const module = item as AIModule;
        const newItem: CanvasItem = {
          id: `${module.id}-${Date.now()}`, // 修正 Histor.now() 为 Date.now()
          moduleId: module.id,
          name: module.name,
          config: module.config || {},
          configSchema: module.configSchema || {},
          inputs: module.inputs,
          outputs: module.outputs,
          position: { x: left, y: top },
          executionResult: null,
        };
        console.log("[WorkflowEditor] Adding new item:", newItem);
        setCanvasItems((prevItems) => {
          const newItems = [...prevItems, newItem];
          saveHistory(newItems, connections);
          return newItems;
        });
      } else if (monitor.getItemType() === ItemTypes.CANVAS_ITEM) {
        const dragItem = item as CanvasItemDragObject;
        left = Math.max(0, Math.round(dragItem.x + delta.x));
        top = Math.max(0, Math.round(dragItem.y + delta.y));

        console.log(`[WorkflowEditor] Moving item ${dragItem.id} to:`, { left, top });
        setCanvasItems((prevItems) => {
          const newItems = prevItems.map((i) =>
            i.id === dragItem.id ? { ...i, position: { x: left, y: top } } : i
          );
          const oldItem = prevItems.find(i => i.id === dragItem.id);
          if (oldItem && (oldItem.position.x !== left || oldItem.position.y !== top)) {
            saveHistory(newItems, connections);
          }
          return newItems;
        });
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  }), [connections, saveHistory]);

  useEffect(() => {
    if (canvasRef.current) {
      drop(canvasRef.current);
      const rect = canvasRef.current.getBoundingClientRect();
      setCanvasOffset({ x: rect.left, y: rect.top });
      console.log("[WorkflowEditor] Canvas offset calculated:", { x: rect.left, y: rect.top });
    }
  }, [drop]);

  useEffect(() => {
    if (initialState && history.length === 0) {
      const initialHistoryState = { items: initialState.items || [], connections: initialState.connections || [] };
      setHistory([initialHistoryState]);
      setHistoryIndex(0);
      setCanUndo(false);
      setCanRedo(false);
    }
  }, [initialState]);

  const handleUndo = useCallback(() => {
    if (canUndo && historyIndex > 0) {
      console.log("[WorkflowEditor] Performing Undo.");
      const newIndex = historyIndex - 1;
      const prevState = history[newIndex];
      setCanvasItems(prevState.items);
      setConnections(prevState.connections);
      setHistoryIndex(newIndex);
      setCanUndo(newIndex > 0);
      setCanRedo(true);
      setSelectedItemId(null);
      setConnectingPort(null);
    } else {
      console.log("[WorkflowEditor] Cannot Undo.");
    }
  }, [history, historyIndex, canUndo]);

  const handleRedo = useCallback(() => {
    if (canRedo && historyIndex < history.length - 1) {
      console.log("[WorkflowEditor] Performing Redo.");
      const newIndex = historyIndex + 1;
      const nextState = history[newIndex];
      setCanvasItems(nextState.items);
      setConnections(nextState.connections);
      setHistoryIndex(newIndex);
      setCanUndo(true);
      setCanRedo(newIndex < history.length - 1);
      setSelectedItemId(null);
      setConnectingPort(null);
    } else {
      console.log("[WorkflowEditor] Cannot Redo.");
    }
  }, [history, historyIndex, canRedo]);

  const handleSave = useCallback(async () => {
    console.log("[WorkflowEditor] Save triggered.");
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    try {
      const workflowData = JSON.stringify({ items: canvasItems, connections });
      console.log("Workflow Data:", workflowData);
      localStorage.setItem('aiFlowWorkflow', workflowData);
      toast.success("Workflow saved!");
    } catch (error) {
      console.error("Save failed:", error);
      toast.error("Failed to save workflow.");
    } finally {
      setIsLoading(false);
    }
  }, [canvasItems, connections]);

  const handleLoad = useCallback(async () => {
    console.log("[WorkflowEditor] Load triggered.");
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    try {
      const savedData = localStorage.getItem('aiFlowWorkflow');
      if (savedData) {
        const parsedData: WorkflowState = JSON.parse(savedData);
        const loadedItems = parsedData.items || [];
        const loadedConnections = parsedData.connections || [];
        setCanvasItems(loadedItems);
        setConnections(loadedConnections);
        setHistory([{ items: loadedItems, connections: loadedConnections }]);
        setHistoryIndex(0);
        setCanUndo(false);
        setCanRedo(false);
        setSelectedItemId(null);
        setConnectingPort(null);
        toast.success("Workflow loaded!");
      } else {
        toast.info("No saved workflow found.");
      }
    } catch (error) {
      console.error("Failed to parse/load saved workflow:", error);
      toast.error("Failed to load workflow.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleRun = useCallback(async () => {
    console.log("[WorkflowEditor] Run triggered.");
    setIsLoading(true);
    toast.info("Running workflow... (simulation)");
    await new Promise(resolve => setTimeout(resolve, 1000));
    try {
      setCanvasItems(prevItems => {
        const newItems = prevItems.map(item => ({
          ...item,
          executionResult: Math.random() > 0.5 ? `Result_${item.id.substring(0, 4)}` : null
        }));
        return newItems;
      });
      toast.success("Workflow run simulation complete!");
    } catch (error) {
      console.error("Run failed:", error);
      toast.error("Workflow run simulation failed.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handlePortMouseDown = useCallback((
    event: React.MouseEvent<HTMLDivElement>,
    itemId: string,
    portId: string,
    direction: 'input' | 'output',
    portType: string
  ) => {
    event.preventDefault();
    event.stopPropagation();
    console.log(`[WorkflowEditor][handlePortMouseDown] Mouse down on ${direction} port`, { itemId, portId, portType });
    setConnectingPort({ itemId, portId, direction, type: portType });
    setMousePosition({ x: event.clientX, y: event.clientY });
  }, []);

  const handleMouseMove = useCallback((event: MouseEvent) => {
    if (!connectingPort || !canvasRef.current) return;
    setMousePosition({ x: event.clientX, y: event.clientY });
  }, [connectingPort]);

  const handlePortMouseUp = useCallback((
    event: React.MouseEvent<HTMLDivElement>,
    targetItemId: string,
    targetPortId: string,
    targetDirection: 'input' | 'output',
    targetPortType: string
  ) => {
    event.preventDefault();
    event.stopPropagation();
    console.log(`[WorkflowEditor][handlePortMouseUp] Mouse up on ${targetDirection} port`, { targetItemId, targetPortId, targetPortType, connectingPort });

    if (connectingPort && connectingPort.itemId !== targetItemId && connectingPort.direction === 'output' && targetDirection === 'input') {
      if (connectingPort.type !== targetPortType) {
        console.warn("[WorkflowEditor][handlePortMouseUp] Port type mismatch!", { sourceType: connectingPort.type, targetType: targetPortType });
        toast.warn(`Cannot connect: Port type mismatch (${connectingPort.type} to ${targetPortType})`);
      } else {
        const newConnection: Connection = {
          sourceItemId: connectingPort.itemId,
          sourcePortId: connectingPort.portId,
          targetItemId: targetItemId,
          targetPortId: targetPortId,
        };
        console.log("[WorkflowEditor][handlePortMouseUp] Checking connection validity:", newConnection);

        const connectionExists = connections.some(conn =>
          conn.sourceItemId === newConnection.sourceItemId &&
          conn.sourcePortId === newConnection.sourcePortId &&
          conn.targetItemId === newConnection.targetItemId &&
          conn.targetPortId === newConnection.targetPortId
        );
        const targetInputAlreadyConnected = connections.some(conn =>
          conn.targetItemId === newConnection.targetItemId && conn.targetPortId === newConnection.targetPortId
        );

        if (connectionExists) {
          toast.info("Connection already exists.");
        } else if (targetInputAlreadyConnected) {
          toast.warn("Target input port already has a connection.");
        } else {
          console.log("[WorkflowEditor][handlePortMouseUp] Adding new connection.");
          setConnections(prevConnections => {
            const newConnections = [...prevConnections, newConnection];
            setCanvasItems(prevItems => {
              saveHistory(prevItems, newConnections);
              return prevItems;
            });
            return newConnections;
          });
          toast.success("Connection created!");
        }
      }
    } else if (connectingPort) {
      console.log("[WorkflowEditor][handlePortMouseUp] Invalid connection attempt.");
      if (connectingPort.itemId === targetItemId) toast.warn("Cannot connect an item to itself.");
      else if (connectingPort.direction !== 'output' || targetDirection !== 'input') toast.warn("Connection must be from Output to Input.");
    }

    console.log("[WorkflowEditor][handlePortMouseUp] Resetting connectingPort state.");
    setConnectingPort(null);
    setMousePosition(null);
  }, [connectingPort, connections, saveHistory]);

  const handleCanvasMouseUp = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    if (target.dataset.port === 'true') {
      return;
    }
    if (connectingPort) {
      console.log("[WorkflowEditor][handleCanvasMouseUp] Mouse up on canvas, canceling connection.");
      setConnectingPort(null);
      setMousePosition(null);
    }
  }, [connectingPort]);

  useEffect(() => {
    if (connectingPort) {
      console.log("[WorkflowEditor][useEffect] Adding mousemove listener.");
      document.addEventListener('mousemove', handleMouseMove);
      return () => {
        console.log("[WorkflowEditor][useEffect] Removing mousemove listener.");
        document.removeEventListener('mousemove', handleMouseMove);
      };
    }
  }, [connectingPort, handleMouseMove]);

  const renderConnections = () => {
    return connections.map((connection) => {
      const sourceItem = canvasItems.find(item => item.id === connection.sourceItemId);
      const targetItem = canvasItems.find(item => item.id === connection.targetItemId);
      if (!sourceItem || !targetItem) {
        console.warn("[WorkflowEditor] Skipping connection render: source or target item not found.", connection);
        return null;
      }
      return (
        <ConnectionRenderer
          key={`${connection.sourceItemId}-${connection.sourcePortId}-${connection.targetItemId}-${connection.targetPortId}`}
          connection={connection}
          canvasItems={canvasItems}
        />
      );
    });
  };

  const renderTemporaryConnection = () => {
    if (!connectingPort || !mousePosition || !canvasRef.current) return null;

    const sourcePos = getPortPosition(canvasRef.current, connectingPort.itemId, connectingPort.portId, connectingPort.direction);
    if (!sourcePos) return null;

    const canvasRect = canvasRef.current.getBoundingClientRect();
    const targetPos = {
      x: mousePosition.x - canvasRect.left,
      y: mousePosition.y - canvasRect.top
    };

    if (isNaN(sourcePos.x) || isNaN(sourcePos.y) || isNaN(targetPos.x) || isNaN(targetPos.y)) {
      console.error("[WorkflowEditor][renderTemporaryConnection] Invalid coordinates!", { sourcePos, targetPos });
      return null;
    }

    return (
      <line
        x1={sourcePos.x}
        y1={sourcePos.y}
        x2={targetPos.x}
        y2={targetPos.y}
        stroke="red"
        strokeDasharray="5,5"
        strokeWidth={2}
        style={{ pointerEvents: 'none' }}
      />
    );
  };

  const handleItemClick = useCallback((itemId: string) => {
    console.log(`[WorkflowEditor] Item clicked: ${itemId}`);
    setSelectedItemId(itemId);
  }, []);

  const handleConfigChange = useCallback((itemId: string, newConfig: any) => {
    console.log(`[WorkflowEditor] Config changed for item ${itemId}:`, newConfig);
    setCanvasItems(prevItems => {
      const newItems = prevItems.map(item =>
        item.id === itemId ? { ...item, config: newConfig } : item
      );
      const oldItem = prevItems.find(i => i.id === itemId);
      if (JSON.stringify(oldItem?.config) !== JSON.stringify(newConfig)) {
        saveHistory(newItems, connections);
      }
      return newItems;
    });
  }, [connections, saveHistory]);

  const handleContextMenu = useCallback((event: React.MouseEvent<HTMLDivElement>, itemId: string) => {
    event.preventDefault();
    console.log(`[WorkflowEditor] Context menu on item ${itemId}`);
    setSelectedItemId(itemId);
    toast.info(`Right-clicked on ${itemId}. Implement context menu.`);
  }, []);

  const deleteSelectedItem = useCallback(() => {
    if (selectedItemId) {
      console.log(`[WorkflowEditor] Deleting item ${selectedItemId} and its connections.`);
      setCanvasItems(prevItems => {
        const itemsToDelete = new Set([selectedItemId]);
        const newItems = prevItems.filter(item => !itemsToDelete.has(item.id));

        setConnections(prevConns => {
          const newConnections = prevConns.filter(conn =>
            !itemsToDelete.has(conn.sourceItemId) && !itemsToDelete.has(conn.targetItemId)
          );
          saveHistory(newItems, newConnections);
          return newConnections;
        });

        setSelectedItemId(null);
        toast.success("Item deleted.");
        return newItems;
      });
    }
  }, [selectedItemId, saveHistory]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.key === 'Delete' || event.key === 'Backspace') && selectedItemId) {
        const activeElement = document.activeElement;
        if (activeElement?.tagName !== 'INPUT' && activeElement?.tagName !== 'TEXTAREA' && activeElement?.tagName !== 'SELECT') {
          deleteSelectedItem();
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedItemId, deleteSelectedItem]);

  return (
    <div className="workflow-editor-container">
      <div
        ref={canvasRef}
        className={`canvas-container ${isLoading ? 'loading' : ''}`}
        onClick={e => {
          if (e.target === canvasRef.current) {
            setSelectedItemId(null);
            if (connectingPort) {
              setConnectingPort(null);
              setMousePosition(null);
            }
          }
        }}
        onMouseUp={handleCanvasMouseUp}
        style={{ position: 'relative', width: '100%', height: '100%', border: '1px solid #ccc', overflow: 'hidden' }}
      >
        <Toolbar
          onSave={handleSave}
          onLoad={handleLoad}
          onRun={handleRun}
          onUndo={handleUndo}
          onRedo={handleRedo}
          canUndo={canUndo}
          canRedo={canRedo}
          isLoading={isLoading}
        />
        {canvasItems.map((item: CanvasItem) => (
          <CanvasItemComponent
            key={item.id}
            item={item}
            isSelected={selectedItemId === item.id}
            onItemClick={handleItemClick}
            onContextMenu={handleContextMenu}
            onPortMouseDown={handlePortMouseDown}
            onPortMouseUp={handlePortMouseUp}
          />
        ))}
        {!canvasItems.length && !isLoading && (<div className="canvas-hint">Drag modules here...</div>)}
        <svg className="connections-svg" width="100%" height="100%" style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none', zIndex: 0 }}>
          <defs>
            <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto" markerUnits="strokeWidth">
              <polygon points="0 0, 10 3.5, 0 7" fill="#333" />
            </marker>
          </defs>
          {renderConnections()}
          {renderTemporaryConnection()}
        </svg>
        {isLoading && <div className="loading-overlay"><span>Loading...</span></div>}
      </div>

      <div className="config-panel-container" onClick={e => e.stopPropagation()}>
        <ConfigPanel
          key={selectedItemId || 'no-item'}
          selectedItemId={selectedItemId}
          canvasItems={canvasItems}
          onConfigChange={handleConfigChange}
        />
      </div>

      <ToastContainer
        position={"bottom-right" as ToastPosition}
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </div>
  );
};

interface CanvasItemComponentProps {
  item: CanvasItem;
  isSelected: boolean;
  onItemClick: (id: string) => void;
  onContextMenu: (event: React.MouseEvent<HTMLDivElement>, id: string) => void;
  onPortMouseDown: (event: React.MouseEvent<HTMLDivElement>, itemId: string, portId: string, direction: 'input' | 'output', portType: string) => void;
  onPortMouseUp: (event: React.MouseEvent<HTMLDivElement>, itemId: string, portId: string, direction: 'input' | 'output', portType: string) => void;
}

const CanvasItemComponent: React.FC<CanvasItemComponentProps> = ({
  item, isSelected, onItemClick, onContextMenu, onPortMouseDown, onPortMouseUp,
}) => {
  const itemRef = useRef<HTMLDivElement>(null);

  const [{ isDragging }, drag] = useDrag(() => ({
    type: ItemTypes.CANVAS_ITEM,
    item: { id: item.id, type: ItemTypes.CANVAS_ITEM, x: item.position.x, y: item.position.y },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }), [item.id, item.position.x, item.position.y]);

  drag(itemRef);

  return (
    <div
      ref={itemRef}
      data-id={item.id}
      className={`canvas-item ${isSelected ? 'selected' : ''} ${isDragging ? 'dragging' : ''}`}
      style={{
        position: 'absolute',
        left: `${item.position.x}px`,
        top: `${item.position.y}px`,
        opacity: isDragging ? 0.5 : 1,
        cursor: isDragging ? 'grabbing' : 'grab',
        zIndex: isSelected || isDragging ? 10 : 1,
        border: '1px solid #aaa',
        padding: '5px',
        backgroundColor: 'white',
        minWidth: '150px'
      }}
      onClick={e => { e.stopPropagation(); onItemClick(item.id); }}
      onContextMenu={(e) => onContextMenu(e, item.id)}
    >
      <div className="module-header" style={{ fontWeight: 'bold', marginBottom: '5px', textAlign: 'center' }}>{item.name}</div>
      <div className="ports" style={{ display: 'flex', justifyContent: 'space-between' }}>
        <div className="input-ports">
          {item.inputs?.map((port: Port) => (
            <div
              key={port.id}
              className="port input-port"
              title={`Input: ${port.label || port.id} (${port.type})`}
              data-port-id={port.id}
              data-item-id={item.id}
              data-direction="input"
              data-port-type={port.type}
              data-port="true"
              style={{ width: '10px', height: '10px', backgroundColor: 'blue', borderRadius: '50%', marginBottom: '5px' }}
              onMouseDown={e => onPortMouseDown(e, item.id, port.id, 'input', port.type)}
              onMouseUp={e => onPortMouseUp(e, item.id, port.id, 'input', port.type)}
            ></div>
          ))}
        </div>
        <div className="output-ports">
          {item.outputs?.map((port: Port) => (
            <div
              key={port.id}
              className="port output-port"
              title={`Output: ${port.label || port.id} (${port.type})`}
              data-port-id={port.id}
              data-item-id={item.id}
              data-direction="output"
              data-port-type={port.type}
              data-port="true"
              style={{ width: '10px', height: '10px', backgroundColor: 'red', borderRadius: '50%', marginBottom: '5px' }}
              onMouseDown={e => onPortMouseDown(e, item.id, port.id, 'output', port.type)}
              onMouseUp={e => onPortMouseUp(e, item.id, port.id, 'output', port.type)}
            ></div>
          ))}
        </div>
      </div>
      {item.executionResult && (
        <div className="execution-result" title={JSON.stringify(item.executionResult)} style={{ marginTop: '5px', fontSize: '0.8em', color: 'green' }}>
          Result: {typeof item.executionResult === 'string' ? item.executionResult.substring(0, 10) + '...' : 'Done'}
        </div>
      )}
    </div>
  );
};

const WorkflowEditorWrapper: React.FC<WorkflowEditorProps> = (props) => (
  <DndProvider backend={HTML5Backend}>
    <WorkflowEditor {...props} />
  </DndProvider>
);

export default WorkflowEditorWrapper;