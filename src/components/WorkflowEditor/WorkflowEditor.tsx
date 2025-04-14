// src/components/WorkflowEditor/WorkflowEditor.tsx (最终修复版 - 完整代码 V3)
import React, { useState, useRef, useCallback, useEffect, MouseEvent as ReactMouseEvent } from 'react';
import { useDrop, DropTargetMonitor } from 'react-dnd';
import { v4 as uuidv4 } from 'uuid';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// 导入类型和资源
import '../../styles/WorkflowEditor.scss'; // 确认路径
import type { Connection } from '../../../types/Connection';
import type { AIModule, Port, ConfigSchemaItem } from '../../../types/ai_module_models'; // 确认路径
import type { CanvasItem } from '../../../types/CanvasItem'; // 确认路径
import { ItemTypes } from '../../constants/dndTypes'; // 确认路径

// 导入子组件
import { DraggableCanvasItem } from '../DraggableCanvasItem'; // 确认路径
import ConfigPanel from './ConfigPanel';                      // 同目录
import ConnectionRenderer from './ConnectionRenderer';        // 同目录
import Toolbar from './Toolbar';                              // 同目录

// --- 核心接口定义 (最终确认版) ---
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
    id: string; // <-- 确认 id 存在
}

// *** WorkflowEditorProps 接口定义 (最终确认版) ***
interface WorkflowEditorProps {
  initialState?: WorkflowState;     // 可选
  availableModules?: AIModule[];    // 可选
}
// --- END: 核心接口定义 ---


// --- Utility Function ---
const getPortCenterPosition = (
    canvasElement: HTMLDivElement | null,
    itemId: string,
    portId: string,
    direction: 'input' | 'output'
): { x: number; y: number } | null => {
    if (!canvasElement) { return null; }
    const portSelector = `div[data-item-id="${itemId}"] div[data-port-id="${portId}"][data-direction="${direction}"]`;
    const portElement = canvasElement.querySelector(portSelector);
    if (!portElement) { return null; }
    try {
        const portRect = portElement.getBoundingClientRect();
        const canvasRect = canvasElement.getBoundingClientRect();
        if (!portRect || !canvasRect || portRect.width === 0 || portRect.height === 0 || canvasRect.width === 0 || canvasRect.height === 0) {
            return null;
        }
        const x = portRect.left + portRect.width / 2 - canvasRect.left + canvasElement.scrollLeft;
        const y = portRect.top + portRect.height / 2 - canvasRect.top + canvasElement.scrollTop;
        if (isNaN(x) || isNaN(y)) {
            return null;
        }
        return { x, y };
    } catch (e) {
        console.error('[getPortCenterPosition] Error:', e);
        return null;
    }
};
// --- END: Utility Function ---


// --- Main Component ---
const WorkflowEditor: React.FC<WorkflowEditorProps> = ({ initialState, availableModules = [] }) => {
  // --- State & Refs ---
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

  // --- START: 回调函数定义 (提供完整实现) ---

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
  }, [history, historyIndex]);

  const handleItemClick = useCallback((itemId: string): void => {
    console.log('[WorkflowEditor] Item clicked:', itemId);
    setSelectedItemId(itemId);
    setSelectedConnectionId(null);
  }, []); // 无依赖

  const handleCanvasClick = useCallback((event: ReactMouseEvent<HTMLDivElement>): void => {
    console.log('[WorkflowEditor] Canvas clicked. Target:', event.target, 'Current target:', event.currentTarget);
    if (event.target === canvasRef.current) {
      console.log('[WorkflowEditor] Deselecting all on canvas click.');
      setSelectedItemId(null);
      setSelectedConnectionId(null);
    }
  }, []); // 无依赖

  const handleConnectionClick = useCallback((connectionId: string): void => {
    console.log('[WorkflowEditor] Connection clicked:', connectionId);
    setSelectedConnectionId(prevId => {
        const newId = prevId === connectionId ? null : connectionId;
        console.log('[WorkflowEditor] New selected connection ID:', newId);
        return newId;
    });
    setSelectedItemId(null);
  }, []); // 无依赖

  const handlePortMouseDown = useCallback((event: ReactMouseEvent<HTMLDivElement>, itemId: string, portId: string, direction: 'input' | 'output', portType: string): void => {
        console.log('[WorkflowEditor] PortMouseDown on:', { itemId, portId, direction });
        event.stopPropagation();
        if (direction === 'output') {
            const portInfo: PortReference = { itemId, portId, direction, type: portType };
            console.log('[WorkflowEditor] Starting connection from:', portInfo);
            setConnectingPort(portInfo);
            setMousePosition(null);
            setSelectedItemId(null);
            setSelectedConnectionId(null);
        } else {
            console.log('[WorkflowEditor] Attempted to start connection from input port.');
            toast.info('请从输出端口开始拖拽连接。');
        }
   }, []); // 无依赖

  const handleMouseMove = useCallback((event: globalThis.MouseEvent): void => {
    if (connectingPort && canvasRef.current) {
      const canvasRect = canvasRef.current.getBoundingClientRect();
      const newMousePosition = {
        x: event.clientX - canvasRect.left + canvasRef.current.scrollLeft,
        y: event.clientY - canvasRect.top + canvasRef.current.scrollTop,
      };
      setMousePosition(newMousePosition);
    }
   }, [connectingPort]); // 依赖项

  const handlePortMouseUp = useCallback((event: ReactMouseEvent<HTMLDivElement>, targetItemId: string, targetPortId: string, targetDirection: 'input' | 'output', targetPortType: string): void => {
      console.log('[WorkflowEditor] PortMouseUp on:', { targetItemId, targetPortId, targetDirection });
      console.log('[WorkflowEditor] Current connectingPort state before PortMouseUp:', connectingPort);
      event.stopPropagation();
      if (!connectingPort || targetDirection !== 'input') {
           console.log('[WorkflowEditor] PortMouseUp condition not met. Resetting.');
           if (connectingPort) { setConnectingPort(null); setMousePosition(null); }
           return;
      }
      const startPortInfo: PortReference = connectingPort;
      const targetPortInfo: PortReference = { itemId: targetItemId, portId: targetPortId, direction: targetDirection, type: targetPortType };
      console.log('[WorkflowEditor] Attempting connection between:', startPortInfo, 'and', targetPortInfo);
      let validationError: string | null = null;
      if (startPortInfo.itemId === targetPortInfo.itemId) {
          validationError = "不允许节点自我连接。";
      } else if (connections.some(conn => conn.sourceItemId === startPortInfo.itemId && conn.sourcePortId === startPortInfo.portId && conn.targetItemId === targetPortInfo.itemId && conn.targetPortId === targetPortInfo.portId )) {
          validationError = "该连接已存在。";
      } else {
          const isInputOccupied = connections.some(conn => conn.targetItemId === targetPortInfo.itemId && conn.targetPortId === targetPortInfo.portId);
          if (isInputOccupied) {
              const targetItem = canvasItems.find(item => item.id === targetPortInfo.itemId);
              const portLabel = targetItem?.inputs?.find(p => p.id === targetPortInfo.portId)?.label || targetPortInfo.portId;
              validationError = `输入端口 "${portLabel}" 只能连接一次。`;
          }
      }
      if (validationError) {
          console.warn('[WorkflowEditor] Connection validation failed:', validationError);
          toast.error(validationError);
      } else {
          const newConnection: Connection = { id: uuidv4(), sourceItemId: startPortInfo.itemId, sourcePortId: startPortInfo.portId, targetItemId: targetPortInfo.itemId, targetPortId: targetPortInfo.portId };
          console.log('[WorkflowEditor] Creating new connection:', newConnection);
          const updatedConnections = [...connections, newConnection];
          setConnections(updatedConnections);
          saveHistory(canvasItems, updatedConnections);
          toast.success("连接创建成功！");
      }
      console.log('[WorkflowEditor] Resetting connection state after PortMouseUp.');
      setConnectingPort(null);
      setMousePosition(null);
   }, [connectingPort, connections, canvasItems, saveHistory]); // 依赖项

  const handleCanvasMouseUp = useCallback((event: ReactMouseEvent<HTMLDivElement>): void => {
    console.log('[WorkflowEditor] CanvasMouseUp triggered. Target:', event.target, 'Current target:', event.currentTarget);
    console.log('[WorkflowEditor] Current connectingPort state before CanvasMouseUp:', connectingPort);
    const targetIsPort = (event.target as Element)?.closest('.port');
    if (connectingPort && !targetIsPort) {
      console.log('[WorkflowEditor] CanvasMouseUp detected outside a port while connecting. Resetting.');
      setConnectingPort(null);
      setMousePosition(null);
    }
  }, [connectingPort]); // 依赖项

  const handleContextMenu = useCallback((event: ReactMouseEvent<HTMLDivElement>, itemId: string): void => {
    event.preventDefault();
    setSelectedItemId(itemId);
    setSelectedConnectionId(null);
    console.log('Context menu triggered on item:', itemId);
  }, []); // 无依赖

  const handleConfigChange = useCallback((itemId: string, newConfig: Record<string, any>): void => {
        console.log(`[WorkflowEditor] Config change for item ${itemId}:`, newConfig);
        let updatedItems: CanvasItem[] = [];
        setCanvasItems(prevItems => {
            updatedItems = prevItems.map(item => item.id === itemId ? { ...item, config: newConfig } : item );
            saveHistory(updatedItems, connections);
            return updatedItems;
        });
   }, [connections, saveHistory]); // 依赖项

  const handleUndo = useCallback((): void => {
        console.log('[WorkflowEditor] Undo triggered. History index:', historyIndex);
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
   }, [history, historyIndex]); // 依赖项

  const handleRedo = useCallback((): void => {
        console.log('[WorkflowEditor] Redo triggered. History index:', historyIndex, 'History length:', history.length);
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
   }, [history, historyIndex]); // 依赖项

   const handleSave = useCallback(async (): Promise<void> => {
     console.log('[WorkflowEditor] Save triggered.');
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
   }, [canvasItems, connections]); // 依赖项

   const handleLoad = useCallback(async (): Promise<void> => {
      console.log('[WorkflowEditor] Load triggered.');
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
   }, []); // 无依赖

  const handleRun = useCallback(async (): Promise<void> => {
        console.log('[WorkflowEditor] Run triggered.');
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
   }, [canvasItems, connections]); // 依赖项

  const deleteSelectedConnection = useCallback((): void => {
    console.log('[WorkflowEditor] Delete connection triggered. Selected:', selectedConnectionId);
    if (selectedConnectionId) {
        let updatedConnections : Connection[] = [];
        setConnections(prevConnections => {
            updatedConnections = prevConnections.filter(conn => conn.id !== selectedConnectionId);
            saveHistory(canvasItems, updatedConnections);
            return updatedConnections;
        });
        setSelectedConnectionId(null);
        toast.info("连接已删除");
    }
   }, [selectedConnectionId, canvasItems, saveHistory]); // 依赖项

  const deleteSelectedItem = useCallback((): void => {
      console.log('[WorkflowEditor] Delete item triggered. Selected:', selectedItemId);
      if (!selectedItemId) return;
      let updatedItems: CanvasItem[] = [];
      let updatedConnections: Connection[] = [];
      setCanvasItems(prevItems => {
          updatedItems = prevItems.filter(item => item.id !== selectedItemId);
          setConnections(prevConnections => {
              updatedConnections = prevConnections.filter(conn => conn.sourceItemId !== selectedItemId && conn.targetItemId !== selectedItemId );
              saveHistory(updatedItems, updatedConnections);
              return updatedConnections;
          });
          return updatedItems;
      });
      setSelectedItemId(null);
      toast.info("节点已删除");
  }, [selectedItemId, saveHistory]); // 依赖项

  // --- END: 回调函数定义 ---


  // --- renderTemporaryConnection ---
  const renderTemporaryConnection = (): JSX.Element | null => {
      if (!connectingPort || !mousePosition || !canvasRef.current) return null;
      const startPos = getPortCenterPosition(canvasRef.current, connectingPort.itemId, connectingPort.portId, 'output');
      if (!startPos) return null;
      const endPos = mousePosition;
      const pathData = `M ${startPos.x} ${startPos.y} L ${endPos.x} ${endPos.y}`;
      return (<path d={pathData} stroke="#aaa" strokeWidth="2" strokeDasharray="5,5" fill="none" markerEnd="url(#arrowhead)" style={{ pointerEvents: 'none' }} />);
  };


  // --- Drag and Drop ---
  const [{ isOver, canDrop }, drop] = useDrop< AIModule | CanvasItemDragObject, void, { isOver: boolean; canDrop: boolean } >( () => ({
    accept: [ItemTypes.MODULE, ItemTypes.CANVAS_ITEM],
    drop: (item: AIModule | CanvasItemDragObject, monitor: DropTargetMonitor<AIModule | CanvasItemDragObject, void>) => {
       console.log('[WorkflowEditor] Drop event triggered');
       const clientOffset = monitor.getClientOffset();
       if (!canvasRef.current || !clientOffset) return;
       const canvasRect = canvasRef.current.getBoundingClientRect();
       const droppedX = clientOffset.x - canvasRect.left + canvasRef.current.scrollLeft;
       const droppedY = clientOffset.y - canvasRect.top + canvasRef.current.scrollTop;
       console.log(`[WorkflowEditor] Drop coordinates (raw): x=${droppedX}, y=${droppedY}`);
       const itemType = monitor.getItemType();
       console.log(`[WorkflowEditor] Dropped item type: ${String(itemType)}`, item);

       if (itemType === ItemTypes.MODULE) {
           const module = item as AIModule;
           console.log('[WorkflowEditor] Processing dropped module:', module);
           if (!module || !module.id) {
               console.error('[WorkflowEditor] Dropped module item is invalid:', module);
               toast.error('拖拽的模块数据无效。');
               return;
           }
           const moduleData = module;
           console.log(`[WorkflowEditor] Using module data directly from drop item '${moduleData.id}':`, moduleData);
           const inputsArray = Array.isArray(moduleData.inputs) ? moduleData.inputs : [];
           const outputsArray = Array.isArray(moduleData.outputs) ? moduleData.outputs : [];
           if (!Array.isArray(moduleData.inputs)) console.warn(`[WorkflowEditor] Module data '${moduleData.name}' missing/invalid 'inputs'.`);
           if (!Array.isArray(moduleData.outputs)) console.warn(`[WorkflowEditor] Module data '${moduleData.name}' missing/invalid 'outputs'.`);

           const newItem: CanvasItem = {
               id: uuidv4(), moduleId: moduleData.id, name: moduleData.name || 'Unnamed Node',
               config: moduleData.defaultConfig || {}, configSchema: moduleData.configSchema,
               inputs: inputsArray.map((p: Port) => ({ ...p })),
               outputs: outputsArray.map((p: Port) => ({ ...p })),
               position: { x: Math.max(0, droppedX), y: Math.max(0, droppedY) },
               executionResult: null, zIndex: 1,
           };
           console.log('[WorkflowEditor] Created new canvas item:', newItem);
           let updatedItems: CanvasItem[] = [];
           setCanvasItems(prevItems => {
                updatedItems = [...prevItems, newItem];
                console.log('[WorkflowEditor] Canvas items state AFTER add:', updatedItems);
                saveHistory(updatedItems, connections);
                return updatedItems;
           });

       } else if (itemType === ItemTypes.CANVAS_ITEM) {
           const dragObject = item as CanvasItemDragObject;
           const itemId = dragObject.id; // 访问 id
           console.log(`[WorkflowEditor] Processing dropped canvas item (move): ${itemId}`);
           const delta = monitor.getDifferenceFromInitialOffset();
           let finalItems: CanvasItem[] = [];
           setCanvasItems(prevItems => {
               const originalItem = prevItems.find(ci => ci.id === itemId);
               if (!originalItem || !delta) return prevItems;
               const newX = Math.max(0, originalItem.position.x + delta.x);
               const newY = Math.max(0, originalItem.position.y + delta.y);
               console.log(`[WorkflowEditor] Moving item ${itemId} to x=${newX}, y=${newY} (Delta: ${JSON.stringify(delta)})`);
               finalItems = prevItems.map(ci => ci.id === itemId ? { ...ci, position: { x: newX, y: newY } } : ci );
               saveHistory(finalItems, connections);
               console.log('[WorkflowEditor] Canvas items state AFTER move:', finalItems);
               return finalItems;
            });
       }
    },
    end: (item: AIModule | CanvasItemDragObject | undefined, monitor: DropTargetMonitor<AIModule | CanvasItemDragObject, void>) => { // 添加类型
        console.log('[WorkflowEditor] Drag end:', item, 'Did drop:', monitor.didDrop());
    },
    collect: (monitor: DropTargetMonitor<AIModule | CanvasItemDragObject, void>) => ({ // 返回正确结构
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  }), [canvasItems, connections, saveHistory, availableModules] ); // 依赖项

  drop(canvasRef);

  // --- Effects ---
  useEffect(() => {
    console.log('[WorkflowEditor] Initializing state. Initial props:', initialState);
    if (initialState) {
        const validInitialState: WorkflowState = {
            items: initialState.items || [],
            connections: initialState.connections || []
        };
        setCanvasItems(validInitialState.items);
        setConnections(validInitialState.connections);
        setHistory([JSON.parse(JSON.stringify(validInitialState))]);
        setHistoryIndex(0);
    } else {
        const emptyState: WorkflowState = { items: [], connections: [] };
        setCanvasItems([]);
        setConnections([]);
        setHistory([emptyState]);
        setHistoryIndex(0);
    }
    setSelectedItemId(null);
    setSelectedConnectionId(null);
   }, [initialState]);

  useEffect(() => {
      if (!connectingPort) return;
      const handleGlobalMouseUp = (event: globalThis.MouseEvent) => {
          const targetElement = event.target as Element;
          const targetIsPort = targetElement.closest('.port');
          console.log('[WorkflowEditor] GlobalMouseUp detected. Target is port:', !!targetIsPort, 'Current connectingPort:', connectingPort);
          if (connectingPort && !targetIsPort) {
                console.log('[WorkflowEditor] GlobalMouseUp resetting connection state.');
                setConnectingPort(null);
                setMousePosition(null);
          }
      };
      console.log('[WorkflowEditor] Adding global mousemove and mouseup listeners.');
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleGlobalMouseUp, true);
      return () => {
          console.log('[WorkflowEditor] Removing global mousemove and mouseup listeners.');
          window.removeEventListener('mousemove', handleMouseMove);
          window.removeEventListener('mouseup', handleGlobalMouseUp, true);
      };
   }, [connectingPort, handleMouseMove]); // 依赖项

  useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent): void => {
            const activeElement = document.activeElement;
            const isInputFocused = activeElement instanceof HTMLElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA' || activeElement.isContentEditable);
            if (isInputFocused) return;
            console.log('[WorkflowEditor] KeyDown:', event.key, 'Ctrl/Meta:', event.ctrlKey || event.metaKey);
            if ((event.key === 'Delete' || event.key === 'Backspace') && !event.repeat) {
                if (selectedConnectionId) { deleteSelectedConnection(); event.preventDefault(); }
                else if (selectedItemId) { deleteSelectedItem(); event.preventDefault(); }
            }
            else if ((event.ctrlKey || event.metaKey) && event.key === 'z' && !event.repeat) { handleUndo(); event.preventDefault(); }
            else if (((event.ctrlKey && event.key === 'y') || (event.metaKey && event.shiftKey && event.key === 'z')) && !event.repeat) { handleRedo(); event.preventDefault(); }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => { window.removeEventListener('keydown', handleKeyDown); };
   }, [selectedConnectionId, selectedItemId, deleteSelectedConnection, deleteSelectedItem, handleUndo, handleRedo]); // 依赖项

  useEffect(() => {
      setCanUndo(historyIndex > 0);
      setCanRedo(historyIndex < history.length - 1);
  }, [historyIndex, history.length]);


  // --- Rendering ---
  return (
    <div className="workflow-editor-container">
      {/* Toolbar */}
      <Toolbar
        onSave={handleSave} onLoad={handleLoad} onRun={handleRun}
        onUndo={handleUndo} onRedo={handleRedo} canUndo={canUndo}
        canRedo={canRedo} isLoading={isLoading}
      />
       <div className="editor-body">
          {/* Canvas */}
          <div ref={canvasRef} className={`canvas-container ${isOver ? 'is-over' : ''} ${canDrop ? 'can-drop' : ''}`}
            onClick={handleCanvasClick} /* onMouseUp 由全局处理 */
            onContextMenu={(e) => e.preventDefault()}
            style={{ overflow: 'auto', minWidth: '1000px', minHeight: '800px' }} > {/* 应用滚动和最小尺寸 */}
            {/* Items */}
            {canvasItems.map((item) => {
               // console.log(`[WorkflowEditor] Rendering item: ${item.name} (${item.id})`);
               const itemInputs = Array.isArray(item.inputs) ? item.inputs : [];
               const itemOutputs = Array.isArray(item.outputs) ? item.outputs : [];
               // if (!Array.isArray(item.inputs)) console.warn(`[Render] Item '${item.name}' has invalid inputs.`);
               // if (!Array.isArray(item.outputs)) console.warn(`[Render] Item '${item.name}' has invalid outputs.`);

               return (
                  <DraggableCanvasItem key={item.id} item={item} >
                    <div className={`canvas-item ${selectedItemId === item.id ? 'selected' : ''}`} data-item-id={item.id}
                         style={{ position: 'absolute', left: `${item.position.x}px`, top: `${item.position.y}px` }}
                         onContextMenu={(e) => handleContextMenu(e, item.id)} onClick={(e) => { e.stopPropagation(); handleItemClick(item.id); }} >
                       <div className="item-header">{item.name}</div>
                       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative' }}>
                         <div className="item-ports item-ports-input">
                           {itemInputs.map((port: Port) => (
                               <div key={port.id} className="port port-input" data-port-id={port.id} data-direction="input" data-port-type={port.type}
                                    title={`输入: ${port.label || port.id} (${port.type})`} style={{ /* port styles */ }}
                                    onMouseUp={(e) => handlePortMouseUp(e, item.id, port.id, 'input', port.type)} />
                           ))}
                         </div>
                         <div className="item-ports item-ports-output">
                           {itemOutputs.map((port: Port) => (
                               <div key={port.id} className="port port-output" data-port-id={port.id} data-direction="output" data-port-type={port.type}
                                    title={`输出: ${port.label || port.id} (${port.type})`} style={{ /* port styles */ }}
                                    onMouseDown={(e) => handlePortMouseDown(e, item.id, port.id, 'output', port.type)} />
                           ))}
                         </div>
                       </div>
                      {item.executionResult && ( <div className={`execution-result ${item.executionResult.status}`}> {/* ... */} </div> )}
                    </div>
                  </DraggableCanvasItem>
               );
            })}
            {/* Connections SVG */}
            <svg className="connection-layer" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0 }} >
               <defs>
                 <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto" markerUnits="strokeWidth"> <polygon points="0 0, 10 3.5, 0 7" fill="#666" /> </marker>
                 <marker id="arrowhead-selected" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto" markerUnits="strokeWidth"> <polygon points="0 0, 10 3.5, 0 7" fill="#ff4d4d" /> </marker>
               </defs>
              <g>
                {connections.map((conn) => ( <ConnectionRenderer key={conn.id} connection={conn} canvasRef={canvasRef} isSelected={conn.id === selectedConnectionId} onClick={handleConnectionClick} /> ))}
                {renderTemporaryConnection()}
              </g>
            </svg>
          </div>
          {/* Config Panel */}
          <div className="config-panel-container" style={{ width: '300px', borderLeft: '1px solid #e8e8e8', background: '#fff', padding: '15px', overflowY: 'auto', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
            <ConfigPanel selectedItemId={selectedItemId} canvasItems={canvasItems} onConfigChange={handleConfigChange} />
          </div>
      </div>
      <ToastContainer position="bottom-right" autoClose={4000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover theme="colored" />
    </div>
  );
};

export default WorkflowEditor;