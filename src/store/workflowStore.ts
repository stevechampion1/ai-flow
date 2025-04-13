// src/store/workflowStore.ts (修复后)
import { create } from 'zustand';
// *** 修正导入路径 (移除 .js 后缀, 确保相对路径正确) ***
import type { CanvasItem } from '../../types/CanvasItem';
import type { Connection } from '../../types/Connection';
import type { Port } from '../../types/ai_module_models'; // Only if Port type is directly used here

// 定义 Zustand Store 的状态和 Actions 接口
interface WorkflowState {
    canvasItems: CanvasItem[];
    connections: Connection[];
    selectedItemId: string | null;
    isSaved: boolean;
    history: { canvasItems: CanvasItem[]; connections: Connection[] }[];
    historyIndex: number;
    isLoading: boolean;
    error: string | null;

    // Actions
    setCanvasItems: (items: CanvasItem[]) => void;
    setConnections: (connections: Connection[]) => void;
    setSelectedItemId: (id: string | null) => void;
    setIsSaved: (isSaved: boolean) => void;
    setLoading: (isLoading: boolean) => void;
    setError: (error: string | null) => void;
    addCanvasItem: (item: CanvasItem) => void;
    updateCanvasItemConfig: (itemId: string, newConfig: Record<string, any>) => void;
    addConnection: (connection: Connection) => void;
    removeConnection: (connectionId: string) => void;
    updateCanvasItemPosition: (itemId: string, position: { x: number; y: number }) => void;
    removeCanvasItem: (itemId: string) => void;
    loadState: (newState: { canvasItems: CanvasItem[], connections: Connection[] }) => void;
    addToHistory: (stateSnapshot: { canvasItems: CanvasItem[], connections: Connection[] }) => void;
    undo: () => void;
    redo: () => void;
    clearHistory: () => void;

    // *** 添加 _updateStateAndHistory 到接口定义 ***
    _updateStateAndHistory: (updater: (state: WorkflowState) => Partial<WorkflowState>) => void;
}

// 创建 Zustand Store
const useWorkflowStore = create<WorkflowState>()((set, get) => ({
    // 初始状态 (保持不变)
    canvasItems: [],
    connections: [],
    selectedItemId: null,
    isSaved: true,
    history: [{ canvasItems: [], connections: [] }],
    historyIndex: 0,
    isLoading: false,
    error: null,

    // --- 实现 Actions ---
    setCanvasItems: (items) => set({ canvasItems: items, isSaved: false }),
    setConnections: (connections) => set({ connections: connections, isSaved: false }),
    setSelectedItemId: (id) => set({ selectedItemId: id }),
    setIsSaved: (isSaved) => set({ isSaved }),
    setLoading: (isLoading) => set({ isLoading }),
    setError: (error) => set({ error }),

    // Helper function for state updates + history (add types here too)
    _updateStateAndHistory: (updater: (state: WorkflowState) => Partial<WorkflowState>) => {
        let newStateSnapshot: { canvasItems: CanvasItem[], connections: Connection[] } | null = null;
        set((state: WorkflowState) => { // <-- Add type to state
            const changes = updater(state);
            // Create snapshot *after* potential changes using current state + changes
            newStateSnapshot = {
                canvasItems: changes.canvasItems ?? state.canvasItems,
                connections: changes.connections ?? state.connections,
            };
            // Return changes and mark as unsaved
            return { ...changes, isSaved: false };
        });
        // Add to history *after* state update is likely complete
        if (newStateSnapshot) {
            get().addToHistory(newStateSnapshot);
        }
    },


    addCanvasItem: (item: CanvasItem) => { // <-- Add type to item
        get()._updateStateAndHistory((state: WorkflowState) => ({ // <-- Add type to state
             canvasItems: [...state.canvasItems, item]
        }));
    },

    updateCanvasItemConfig: (itemId: string, newConfig: Record<string, any>) => {
         get()._updateStateAndHistory((state: WorkflowState) => ({ // <-- Add type to state
             canvasItems: state.canvasItems.map((item: CanvasItem) => // <-- Add type to item
                 item.id === itemId ? { ...item, config: newConfig } : item
             )
         }));
    },

    updateCanvasItemPosition: (itemId: string, position: { x: number; y: number }) => {
         get()._updateStateAndHistory((state: WorkflowState) => ({ // <-- Add type to state
             canvasItems: state.canvasItems.map((item: CanvasItem) => // <-- Add type to item
                 item.id === itemId ? { ...item, position: position } : item
             )
         }));
         // Consider moving history save to drag end if performance is an issue
    },

    addConnection: (connection: Connection) => { // <-- Add type to connection
        get()._updateStateAndHistory((state: WorkflowState) => { // <-- Add type to state
            // Prevent duplicates
             const connectionExists = state.connections.some(
                 (existingConn: Connection) => // <-- Add type to existingConn
                    existingConn.sourceItemId === connection.sourceItemId && existingConn.sourcePortId === connection.sourcePortId &&
                    existingConn.targetItemId === connection.targetItemId && existingConn.targetPortId === connection.targetPortId
             );
            if (connectionExists) {
                console.warn("Attempt to add duplicate connection ignored:", connection);
                return {}; // No change
            }
            // Prevent input port multi-connection
            const inputPortOccupied = state.connections.some(
                (existingConn: Connection) => existingConn.targetItemId === connection.targetItemId && existingConn.targetPortId === connection.targetPortId // <-- Add type to existingConn
            );
            if (inputPortOccupied) {
                 console.warn(`Attempt to connect to already occupied input port ignored: ${connection.targetItemId}.${connection.targetPortId}`);
                 // Optionally set an error state: get().setError(...)
                 return {}; // No change
            }

            return { connections: [...state.connections, connection] };
        });
    },

    removeConnection: (connectionId: string) => {
       get()._updateStateAndHistory((state: WorkflowState) => { // <-- Add type to state
            const newConnections = state.connections.filter((conn: Connection) => conn.id !== connectionId); // <-- Add type to conn
             if (newConnections.length === state.connections.length) {
                 console.warn("Attempted to remove non-existent connection ID:", connectionId);
                 return {}; // No change
             }
             return { connections: newConnections };
       });
    },

    removeCanvasItem: (itemId: string) => {
       get()._updateStateAndHistory((state: WorkflowState) => { // <-- Add type to state
            const newItems = state.canvasItems.filter((item: CanvasItem) => item.id !== itemId); // <-- Add type to item
            if (newItems.length === state.canvasItems.length) {
                 console.warn("Attempted to remove non-existent item ID:", itemId);
                 return {}; // No change
             }
            // Also remove connections associated with the item
            const newConnections = state.connections.filter(
                (conn: Connection) => conn.sourceItemId !== itemId && conn.targetItemId !== itemId // <-- Add type to conn
            );
            const newSelectedItemId = state.selectedItemId === itemId ? null : state.selectedItemId;

            return {
                canvasItems: newItems,
                connections: newConnections,
                selectedItemId: newSelectedItemId
            };
        });
    },

    // Load state replaces current state and resets history
    loadState: (newState: { canvasItems: CanvasItem[], connections: Connection[] }) => { // <-- Add type to newState
        // ... (validation remains the same)
        if (!newState || !Array.isArray(newState.canvasItems) || !Array.isArray(newState.connections)) {
            console.error("Invalid state provided to loadState:", newState);
            set({ error: "Failed to load invalid state.", isLoading: false });
            return;
        }
        const deepCopiedState = {
            canvasItems: JSON.parse(JSON.stringify(newState.canvasItems)),
            connections: JSON.parse(JSON.stringify(newState.connections))
        };
        set({
            ...deepCopiedState,
            selectedItemId: null,
            isSaved: true,
            history: [deepCopiedState],
            historyIndex: 0,
            error: null,
            isLoading: false,
        });
        console.log("Workflow state loaded.");
    },

    // History management
    addToHistory: (stateSnapshot: { canvasItems: CanvasItem[], connections: Connection[] }) => { // <-- Add type to stateSnapshot
        set((state: WorkflowState) => { // <-- Add type to state
            const newState = JSON.parse(JSON.stringify(stateSnapshot));
            // Avoid adding duplicates
            if (state.historyIndex >= 0 && JSON.stringify(newState) === JSON.stringify(state.history[state.historyIndex])) {
                return {};
            }
            const newHistory = state.history.slice(0, state.historyIndex + 1);
            newHistory.push(newState);
            const newIndex = newHistory.length - 1;
            // Optional: Limit history size
            return { history: newHistory, historyIndex: newIndex };
        });
    },

    undo: () => {
        set((state: WorkflowState) => { // <-- Add type to state
            if (state.historyIndex <= 0) return {};
            const newIndex = state.historyIndex - 1;
            const previousState = state.history[newIndex];
            return {
                canvasItems: JSON.parse(JSON.stringify(previousState.canvasItems)),
                connections: JSON.parse(JSON.stringify(previousState.connections)),
                historyIndex: newIndex,
                isSaved: false,
                selectedItemId: null,
            };
        });
    },

    redo: () => {
        set((state: WorkflowState) => { // <-- Add type to state
            if (state.historyIndex >= state.history.length - 1) return {};
            const newIndex = state.historyIndex + 1;
            const nextState = state.history[newIndex];
            return {
                canvasItems: JSON.parse(JSON.stringify(nextState.canvasItems)),
                connections: JSON.parse(JSON.stringify(nextState.connections)),
                historyIndex: newIndex,
                isSaved: false,
                selectedItemId: null,
            };
        });
    },

    clearHistory: () => {
        set((state: WorkflowState) => ({ // <-- Add type to state
            history: [{
                canvasItems: JSON.parse(JSON.stringify(state.canvasItems)),
                connections: JSON.parse(JSON.stringify(state.connections))
            }],
            historyIndex: 0,
        }));
    },
}));

export default useWorkflowStore;