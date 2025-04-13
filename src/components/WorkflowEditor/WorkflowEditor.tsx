// src/components/WorkflowEditor/WorkflowEditor.tsx (修复后)
import React, { useState, useRef, useCallback, useEffect, MouseEvent as ReactMouseEvent } from 'react';
import { useDrop, DropTargetMonitor } from 'react-dnd';
import { v4 as uuidv4 } from 'uuid';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// 导入类型和资源
import '../../styles/WorkflowEditor.scss';
import type { Connection } from '../../../types/Connection';
import type { AIModule, Port, ConfigSchemaItem } from '../../../types/ai_module_models';
import type { CanvasItem } from '../../../types/CanvasItem';
import { ItemTypes } from '../../constants/dndTypes';

// 导入子组件
import { DraggableCanvasItem } from '../DraggableCanvasItem';
import ConfigPanel from './ConfigPanel';
import ConnectionRenderer from './ConnectionRenderer';
import Toolbar from './Toolbar';

// --- 核心接口定义 (保持上次修复的完整版本) ---
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

export interface CanvasItemDragObject {
    type: typeof ItemTypes.CANVAS_ITEM;
    id: string;
}

interface WorkflowEditorProps {
  initialState?: WorkflowState;
  availableModules?: AIModule[];
}
// --- END: 核心接口定义 ---

// --- Utility Function (保持上次修复的完整版本) ---
const getPortCenterPosition = (
    canvasElement: HTMLDivElement | null,
    itemId: string,
    portId: string,
    direction: 'input' | 'output'
): { x: number; y: number } | null => {
    if (!canvasElement) return null;
    const portSelector = `div[data-item-id="${itemId}"] div[data-port-id="${portId}"][data-direction="${direction}"]`;
    const portElement = canvasElement.querySelector(portSelector);
    if (!portElement) return null;
    try {
        const portRect = portElement.getBoundingClientRect();
        const canvasRect = canvasElement.getBoundingClientRect();
        if (!portRect || !canvasRect || portRect.width === 0 || portRect.height === 0 || canvasRect.width === 0 || canvasRect.height === 0) return null;
        const x = portRect.left + portRect.width / 2 - canvasRect.left + canvasElement.scrollLeft;
        const y = portRect.top + portRect.height / 2 - canvasRect.top + canvasElement.scrollTop;
        if (isNaN(x) || isNaN(y)) return null;
        return { x, y };
    } catch (e) {
        console.error('[getPortCenterPosition] Error:', e);
        return null;
    }
};
// --- END: Utility Function ---

// --- Main Component ---
const WorkflowEditor: React.FC<WorkflowEditorProps> = ({ initialState, availableModules = [] }) => {
  // --- State & Refs (保持不变) ---
  const [canvasItems, setCanvasItems] = useState<CanvasItem[]>(initialState?.items || []);
  const [connections, setConnections] = useState<Connection[]>(initialState?.connections || []);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [selectedConnectionId, setSelectedConnectionId] = useState<string | null>(null);
  const [connectingPort, setConnectingPort] = useState<PortReference | null>(null);
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number } | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [history, setHistory] = useState<WorkflowState[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  // --- START: 回调函数定义 (恢复完整 useCallback 结构) ---

  const saveHistory = useCallback((currentItems: CanvasItem[], currentConnections: Connection[]) => {
      const newState: WorkflowState = {
          items: JSON.parse(JSON.stringify(currentItems)),
          connections: JSON.parse(JSON.stringify(currentConnections)),
      };
      if (historyIndex >= 0 && JSON.stringify(newState) === JSON.stringify(history[historyIndex])) {
          return;
      }
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(newState);
      const newIndex = newHistory.length - 1;
      setHistory(newHistory);
      setHistoryIndex(newIndex);
  }, [history, historyIndex]); // <-- 正确的 useCallback 结构

  const handleItemClick = useCallback((itemId: string): void => {
    setSelectedItemId(itemId);
    setSelectedConnectionId(null);
  }, []); // <-- 正确的 useCallback 结构

  const handleCanvasClick = useCallback((event: ReactMouseEvent<HTMLDivElement>): void => {
    if (event.target === canvasRef.current) {
      setSelectedItemId(null);
      setSelectedConnectionId(null);
    }
  }, []); // <-- 正确的 useCallback 结构 (canvasRef is stable)

  const handleConnectionClick = useCallback((connectionId: string): void => {
    setSelectedConnectionId(prevId => (prevId === connectionId ? null : connectionId));
    setSelectedItemId(null);
  }, []); // <-- 正确的 useCallback 结构

  const handlePortMouseDown = useCallback((event: ReactMouseEvent<HTMLDivElement>, itemId: string, portId: string, direction: 'input' | 'output', portType: string): void => {
        event.stopPropagation();
        if (direction === 'output') {
            const portInfo: PortReference = { itemId, portId, direction, type: portType };
            setConnectingPort(portInfo);
            setMousePosition(null);
            setSelectedItemId(null);
            setSelectedConnectionId(null);
        } else {
            toast.info('请从输出端口开始拖拽连接。');
        }
   }, []); // <-- 正确的 useCallback 结构

  const handleMouseMove = useCallback((event: globalThis.MouseEvent): void => {
    if (connectingPort && canvasRef.current) {
      const canvasRect = canvasRef.current.getBoundingClientRect();
      setMousePosition({
        x: event.clientX - canvasRect.left + canvasRef.current.scrollLeft,
        y: event.clientY - canvasRect.top + canvasRef.current.scrollTop,
      });
    }
   }, [connectingPort]); // <-- 正确的 useCallback 结构

  const handlePortMouseUp = useCallback((event: ReactMouseEvent<HTMLDivElement>, targetItemId: string, targetPortId: string, targetDirection: 'input' | 'output', targetPortType: string): void => {
      event.stopPropagation();
      if (!connectingPort || targetDirection !== 'input') {
           if (connectingPort) {
                setConnectingPort(null);
                setMousePosition(null);
           }
           return;
      }
      const startPortInfo: PortReference = connectingPort;
      const targetPortInfo: PortReference = { itemId: targetItemId, portId: targetPortId, direction: targetDirection, type: targetPortType };
      let validationError: string | null = null;
      if (startPortInfo.itemId === targetPortInfo.itemId) {
          validationError = "不允许节点自我连接。";
      } else if (connections.some(conn => conn.sourceItemId === startPortInfo.itemId && conn.sourcePortId === startPortInfo.portId && conn.targetItemId === targetPortInfo.itemId && conn.targetPortId === targetPortInfo.portId)) {
          validationError = "该连接已存在。";
      } else {
          const isInputOccupied = connections.some(conn => conn.targetItemId === targetPortInfo.itemId && conn.targetPortId === targetPortInfo.portId);
          if (isInputOccupied) {
              const targetItem = canvasItems.find(item => item.id === targetPortInfo.itemId);
              const portLabel = targetItem?.inputs.find(p => p.id === targetPortInfo.portId)?.label || targetPortInfo.portId;
              validationError = `输入端口 "${portLabel}" 只能连接一次。`;
          }
      }
      if (validationError) {
          toast.error(validationError);
      } else {
          const newConnection: Connection = { id: uuidv4(), sourceItemId: startPortInfo.itemId, sourcePortId: startPortInfo.portId, targetItemId: targetPortInfo.itemId, targetPortId: targetPortInfo.portId };
          const updatedConnections = [...connections, newConnection];
          setConnections(updatedConnections);
          saveHistory(canvasItems, updatedConnections);
      }
      setConnectingPort(null);
      setMousePosition(null);
   }, [connectingPort, connections, canvasItems, saveHistory]); // <-- 正确的 useCallback 结构

  const handleCanvasMouseUp = useCallback((event: ReactMouseEvent<HTMLDivElement>): void => {
    if (connectingPort && event.target === canvasRef.current) {
        setConnectingPort(null);
        setMousePosition(null);
    }
  }, [connectingPort]); // <-- 正确的 useCallback 结构

  const handleContextMenu = useCallback((event: ReactMouseEvent<HTMLDivElement>, itemId: string): void => {
    event.preventDefault();
    setSelectedItemId(itemId);
    setSelectedConnectionId(null);
    console.log('Context menu triggered on item:', itemId);
  }, []); // <-- 正确的 useCallback 结构

  const handleConfigChange = useCallback((itemId: string, newConfig: Record<string, any>): void => {
        let updatedItems: CanvasItem[] = [];
        setCanvasItems(prevItems => {
            updatedItems = prevItems.map(item => item.id === itemId ? { ...item, config: newConfig } : item );
            saveHistory(updatedItems, connections); // Save history here
            return updatedItems;
        });
   }, [connections, saveHistory]); // <-- 正确的 useCallback 结构

  const handleUndo = useCallback((): void => {
        if (historyIndex > 0) {
            const prevIndex = historyIndex - 1;
            const prevState = history[prevIndex];
            setCanvasItems(prevState.items);
            setConnections(prevState.connections);
            setHistoryIndex(prevIndex);
            setSelectedItemId(null);
            setSelectedConnectionId(null);
            toast.info("撤销操作");
        } else {
            toast.warn("没有更多可撤销的操作");
        }
   }, [history, historyIndex]); // <-- 正确的 useCallback 结构

  const handleRedo = useCallback((): void => {
        if (historyIndex < history.length - 1) {
            const nextIndex = historyIndex + 1;
            const nextState = history[nextIndex];
            setCanvasItems(nextState.items);
            setConnections(nextState.connections);
            setHistoryIndex(nextIndex);
            setSelectedItemId(null);
            setSelectedConnectionId(null);
            toast.info("重做操作");
        } else {
            toast.warn("没有更多可重做的操作");
        }
   }, [history, historyIndex]); // <-- 正确的 useCallback 结构

   const handleSave = useCallback(async (): Promise<void> => {
     setIsLoading(true);
     toast.info("正在保存工作流...");
     const workflowData: WorkflowState = { items: canvasItems, connections };
     try {
        localStorage.setItem('aiFlowWorkflow_v1', JSON.stringify(workflowData));
        await new Promise(res => setTimeout(res, 500));
        toast.success("流程已成功保存到本地存储！");
     } catch (error) {
        console.error("Failed to save workflow:", error);
        toast.error(`保存失败: ${error instanceof Error ? error.message : '未知错误'}`);
     } finally {
        setIsLoading(false);
     }
   }, [canvasItems, connections]); // <-- 正确的 useCallback 结构

   const handleLoad = useCallback(async (): Promise<void> => {
      setIsLoading(true);
      toast.info("正在加载工作流...");
      try {
        const savedData = localStorage.getItem('aiFlowWorkflow_v1');
        await new Promise(res => setTimeout(res, 500));
        if (savedData) {
            const loadedState: WorkflowState = JSON.parse(savedData);
            if (loadedState && Array.isArray(loadedState.items) && Array.isArray(loadedState.connections)) {
                setCanvasItems(loadedState.items);
                setConnections(loadedState.connections);
                // Reset history correctly when loading
                const deepCopiedState = JSON.parse(JSON.stringify(loadedState));
                setHistory([deepCopiedState]);
                setHistoryIndex(0);
                setSelectedItemId(null);
                setSelectedConnectionId(null);
                toast.success("流程已从本地存储加载！");
            } else {
                 toast.error("本地存储中发现无效的工作流数据。");
            }
        } else {
             toast.info("本地存储中未找到已保存的工作流。");
        }
      } catch (error) {
         console.error("Failed to load workflow:", error);
         toast.error(`加载失败: ${error instanceof Error ? error.message : '未知错误'}`);
      } finally {
          setIsLoading(false);
      }
   // Removed saveHistory dependency, history is reset explicitly
   }, []); // <-- 正确的 useCallback 结构

  const handleRun = useCallback(async (): Promise<void> => {
        setIsLoading(true);
        toast.info("开始执行工作流...");
        let itemsWithPendingStatus = canvasItems.map(item => ({ ...item, executionResult: { status: 'pending', message: '等待执行...' } as CanvasItem['executionResult'] }));
        setCanvasItems(itemsWithPendingStatus);
        try {
            console.log("Executing workflow (simulation):", { items: canvasItems, connections });
            await new Promise(resolve => setTimeout(resolve, 1500));
            const finalItems = itemsWithPendingStatus.map(item => {
                const success = Math.random() > 0.3;
                return { ...item, executionResult: success ? { status: 'success', output: `节点 '${item.name}' 模拟成功 @ ${new Date().toLocaleTimeString()}`, timestamp: Date.now() } : { status: 'error', message: `节点 '${item.name}' 模拟失败 @ ${new Date().toLocaleTimeString()}`, timestamp: Date.now() } } as CanvasItem;
            });
            setCanvasItems(finalItems);
            toast.success("工作流执行完成！");
        } catch (error) {
             console.error("Workflow execution failed:", error);
             toast.error(`工作流执行失败: ${error instanceof Error ? error.message : '未知错误'}`);
             setCanvasItems(canvasItems.map(item => ({ ...item, executionResult: { status: 'error', message: '执行期间发生错误' } as CanvasItem['executionResult']})));
        } finally {
             setIsLoading(false);
        }
   }, [canvasItems, connections]); // <-- 正确的 useCallback 结构

  const deleteSelectedConnection = useCallback((): void => {
    if (selectedConnectionId) {
        let updatedConnections : Connection[] = [];
        setConnections(prevConnections => {
            updatedConnections = prevConnections.filter(conn => conn.id !== selectedConnectionId);
            saveHistory(canvasItems, updatedConnections); // Pass current items state
            return updatedConnections;
        });
        setSelectedConnectionId(null);
        toast.info("连接已删除");
    }
   }, [selectedConnectionId, canvasItems, saveHistory]); // <-- 正确的 useCallback 结构

  const deleteSelectedItem = useCallback((): void => {
      if (!selectedItemId) return;
      let updatedItems: CanvasItem[] = [];
      let updatedConnections: Connection[] = [];
      setCanvasItems(prevItems => {
          updatedItems = prevItems.filter(item => item.id !== selectedItemId);
          setConnections(prevConnections => {
              updatedConnections = prevConnections.filter(conn => conn.sourceItemId !== selectedItemId && conn.targetItemId !== selectedItemId );
              // Save history after both states are updated
              saveHistory(updatedItems, updatedConnections);
              return updatedConnections;
          });
          return updatedItems;
      });
      setSelectedItemId(null);
      toast.info("节点已删除");
  }, [selectedItemId, saveHistory]); // <-- 正确的 useCallback 结构

  // --- END: 回调函数定义 (恢复完整 useCallback 结构) ---


  // --- renderTemporaryConnection (保持不变) ---
  const renderTemporaryConnection = (): JSX.Element | null => {
      if (!connectingPort || !mousePosition || !canvasRef.current) return null;
      const startPos = getPortCenterPosition(canvasRef.current, connectingPort.itemId, connectingPort.portId, 'output');
      if (!startPos) return null;
      const endPos = mousePosition;
      const pathData = `M ${startPos.x} ${startPos.y} L ${endPos.x} ${endPos.y}`;
      return (<path d={pathData} stroke="#aaa" strokeWidth="2" strokeDasharray="5,5" fill="none" markerEnd="url(#arrowhead)" style={{ pointerEvents: 'none' }} />);
  };


  // --- Drag and Drop (恢复 item 和 monitor 类型) ---
  const [{ isOver, canDrop }, drop] = useDrop<
    AIModule | CanvasItemDragObject,
    void,
    { isOver: boolean; canDrop: boolean }
  >( () => ({
    accept: [ItemTypes.MODULE, ItemTypes.CANVAS_ITEM],
    drop: (item: AIModule | CanvasItemDragObject, monitor: DropTargetMonitor<AIModule | CanvasItemDragObject, void>) => { // <-- 恢复类型
       const clientOffset = monitor.getClientOffset();
       if (!canvasRef.current || !clientOffset) return;
       const canvasRect = canvasRef.current.getBoundingClientRect();
       const droppedX = clientOffset.x - canvasRect.left + canvasRef.current.scrollLeft;
       const droppedY = clientOffset.y - canvasRect.top + canvasRef.current.scrollTop;
       const itemType = monitor.getItemType();

       if (itemType === ItemTypes.MODULE) {
           const module = item as AIModule;
           const moduleData = availableModules?.find((m: AIModule) => m.id === module.id);
           if (!moduleData) { toast.error(`无法找到模块 ${module.name} 的数据。`); return; }
           const newItem: CanvasItem = {
               id: uuidv4(), moduleId: moduleData.id, name: moduleData.name, config: moduleData.defaultConfig || {},
               configSchema: moduleData.configSchema, inputs: moduleData.inputs?.map((p: Port) => ({ ...p })) || [],
               outputs: moduleData.outputs?.map((p: Port) => ({ ...p })) || [], position: { x: Math.max(0, droppedX), y: Math.max(0, droppedY) },
               executionResult: null, zIndex: 1,
           };
           const updatedItems = [...canvasItems, newItem];
           setCanvasItems(updatedItems);
           saveHistory(updatedItems, connections); // Save history for new item
       } else if (itemType === ItemTypes.CANVAS_ITEM) {
           const dragObject = item as CanvasItemDragObject;
           const itemId = dragObject.id;
           let finalItems: CanvasItem[] = []; // To capture state for history
           setCanvasItems(prevItems => {
               finalItems = prevItems.map(ci => ci.id === itemId ? { ...ci, position: { x: Math.max(0, droppedX), y: Math.max(0, droppedY) } } : ci );
               saveHistory(finalItems, connections); // Save history for move
               return finalItems;
            });
       }
    },
    end: (item: AIModule | CanvasItemDragObject | undefined, monitor: DropTargetMonitor<AIModule | CanvasItemDragObject, void>) => { // <-- 添加类型
        // History saving is handled in 'drop' now
    },
    collect: (monitor: DropTargetMonitor<AIModule | CanvasItemDragObject, void>) => ({ // <-- 添加类型
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  }), [canvasItems, connections, saveHistory, availableModules] );

  drop(canvasRef);

  // --- Effects (保持不变) ---
  useEffect(() => { /* ... 初始化 ... */ }, [initialState]);
  useEffect(() => { /* ... 连接拖拽监听器 ... */ }, [connectingPort, handleMouseMove]);
  useEffect(() => { /* ... 键盘快捷键 ... */ }, [selectedConnectionId, selectedItemId, deleteSelectedConnection, deleteSelectedItem, handleUndo, handleRedo]);
  useEffect(() => { /* ... 更新 canUndo/canRedo ... */ }, [historyIndex, history.length]);


  // --- Rendering (将修复后的回调传递给子组件/DOM) ---
  return (
    <div className="workflow-editor-container">
      <Toolbar
        onSave={handleSave} // <-- 传递修复后的 handleSave
        onLoad={handleLoad} // <-- 传递修复后的 handleLoad
        onRun={handleRun}   // <-- 传递修复后的 handleRun
        onUndo={handleUndo} // <-- 传递修复后的 handleUndo
        onRedo={handleRedo} // <-- 传递修复后的 handleRedo
        canUndo={canUndo}
        canRedo={canRedo}
        isLoading={isLoading}
      />
       <div className="editor-body">
          <div
            ref={canvasRef}
            className={`canvas-container ${isOver ? 'is-over' : ''} ${canDrop ? 'can-drop' : ''}`}
            onClick={handleCanvasClick} // <-- 传递修复后的 handleCanvasClick
            onMouseUp={handleCanvasMouseUp} // <-- 传递修复后的 handleCanvasMouseUp
            onContextMenu={(e) => e.preventDefault()}
            style={{ /* styles... */ }}
          >
            {canvasItems.map((item) => (
              <DraggableCanvasItem key={item.id} item={item} >
                <div className={`canvas-item ${selectedItemId === item.id ? 'selected' : ''}`} data-item-id={item.id} style={{ position: 'absolute', left: `${item.position.x}px`, top: `${item.position.y}px`, /* ... */ }} onContextMenu={(e) => handleContextMenu(e, item.id)} onClick={(e) => { e.stopPropagation(); handleItemClick(item.id); }} >
                   <div className="item-header" style={{ /* styles */ }}> {item.name} </div>
                   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                     <div className="item-ports item-ports-input" style={{ /* styles */ }}>
                       {item.inputs.map((port: Port) => (<div key={port.id} className="port port-input" data-port-id={port.id} data-direction="input" data-port-type={port.type} title={`输入: ${port.label || port.id} (${port.type})`} style={{ /* port styles */ }} onMouseUp={(e) => handlePortMouseUp(e, item.id, port.id, 'input', port.type)} /> ))}
                     </div>
                     <div className="item-ports item-ports-output" style={{ /* styles */ }}>
                       {item.outputs.map((port: Port) => (<div key={port.id} className="port port-output" data-port-id={port.id} data-direction="output" data-port-type={port.type} title={`输出: ${port.label || port.id} (${port.type})`} style={{ /* port styles */ }} onMouseDown={(e) => handlePortMouseDown(e, item.id, port.id, 'output', port.type)} /> ))}
                     </div>
                   </div>
                  {item.executionResult && ( <div className={`execution-result ${item.executionResult.status}`} style={{ /* styles */ }}> {/* ... result display */} </div> )}
                </div>
              </DraggableCanvasItem>
            ))}
            <svg className="connection-layer" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0 }} >
               <defs> <marker id="arrowhead" /* ... */ > <polygon /* ... */ /> </marker> <marker id="arrowhead-selected" /* ... */ > <polygon /* ... */ /> </marker> </defs>
              <g> {connections.map((conn) => ( <ConnectionRenderer key={conn.id} connection={conn} canvasRef={canvasRef} isSelected={conn.id === selectedConnectionId} onClick={handleConnectionClick} /> ))} {renderTemporaryConnection()} </g> {/* <-- 传递修复后的 handleConnectionClick */}
            </svg>
          </div>
          <div className="config-panel-container" style={{ /* styles... */ }}>
            <ConfigPanel selectedItemId={selectedItemId} canvasItems={canvasItems} onConfigChange={handleConfigChange} /> {/* <-- 传递修复后的 handleConfigChange */}
          </div>
      </div>
      <ToastContainer position="bottom-right" autoClose={4000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover theme="colored" />
    </div>
  );
};

export default WorkflowEditor;