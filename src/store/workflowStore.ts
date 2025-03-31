// src/store/workflowStore.ts
import { create } from 'zustand';
import { CanvasItem, Connection } from '../components/WorkflowEditor/WorkflowEditor';
import { Port } from 'types/ai_module_models';

interface WorkflowState {
    canvasItems: CanvasItem[];
    connections: Connection[];
    selectedItemId: string | null;
    connecting: boolean;
    startComponent: string | null;
    mousePosition: { x: number; y: number };
    isSaved: boolean;
    history: { canvasItems: CanvasItem[]; connections: Connection[] }[];
    historyIndex: number;
    isLoading: boolean;
    error: string | null;

    setCanvasItems: (items: CanvasItem[]) => void;
    setConnections: (connections: Connection[]) => void;
    setSelectedItemId: (id: string | null) => void;
    setConnecting: (connecting: boolean) => void;
    setStartComponent: (id: string | null) => void;
    setMousePosition: (pos: { x: number; y: number }) => void;
    setIsSaved: (isSaved: boolean) => void;
    setLoading: (isLoading: boolean) => void;
    setError: (error: string | null) => void;

    addCanvasItem: (item: CanvasItem) => void;
    updateCanvasItemConfig: (itemId: string, newConfig: Record<string, any>) => void;
    addConnection: (connection: Connection) => void;
    removeConnection: (connection: Connection) => Promise<void>;
    updateCanvasItem: (updatedItem: CanvasItem) => void;
    removeCanvasItem: (itemId: string) => void;
    addToHistory: () => void;
    undo: () => void;
    redo: () => void;
    clearHistory: () => void;
}

const useWorkflowStore = create<WorkflowState>()((set, get) => ({
    canvasItems: [],
    connections: [],
    selectedItemId: null,
    connecting: false,
    startComponent: null,
    mousePosition: { x: 0, y: 0 },
    isSaved: true,
    history: [],
    historyIndex: -1,
    isLoading: false,
    error: null,

    setCanvasItems: (items) => set({ canvasItems: items }),
    setConnections: (connections) => set({ connections }),
    setSelectedItemId: (id) => set({ selectedItemId: id }),
    setConnecting: (connecting) => set({ connecting }),
    setStartComponent: (id) => set({ startComponent: id }),
    setMousePosition: (pos) => set({ mousePosition: pos }),
    setIsSaved: (isSaved) => set({ isSaved }),
    setLoading: (isLoading) => set({ isLoading }),
    setError: (error) => set({ error }),

    addCanvasItem: (item) => {
        set((state) => ({
            canvasItems: [...state.canvasItems, item],
            isSaved: false,
        }));
        get().addToHistory();
    },

    updateCanvasItemConfig: (itemId, newConfig) => {
        set((state) => ({
            canvasItems: state.canvasItems.map((item) =>
                item.id === itemId ? { ...item, config: newConfig } : item
            ),
            isSaved: false,
        }));
        get().addToHistory();
    },

    addConnection: (connection) => {
        set((state) => {
            const connectionExists = state.connections.some(
                (existingConn) =>
                    existingConn.sourceItemId === connection.sourceItemId &&
                    existingConn.sourcePortId === connection.sourcePortId &&
                    existingConn.targetItemId === connection.targetItemId &&
                    existingConn.targetPortId === connection.targetPortId
            );

            if (connectionExists) {
                console.warn("Connection already exists:", connection);
                return state;
            }

            const updatedCanvasItems = state.canvasItems.map((item) => {
                let updatedItem = { ...item };
                if (item.id === connection.sourceItemId && updatedItem.outputs) {
                    updatedItem = {
                        ...updatedItem,
                        outputs: updatedItem.outputs.map((port: Port) =>
                            port.id === connection.sourcePortId
                                ? { ...port, connectedTo: [...(port.connectedTo || []), { itemId: connection.targetItemId, portId: connection.targetPortId }] }
                                : port
                        ),
                    };
                }
                if (item.id === connection.targetItemId && updatedItem.inputs) {
                    updatedItem = {
                        ...updatedItem,
                        inputs: updatedItem.inputs.map((port: Port) =>
                            port.id === connection.targetPortId
                                ? { ...port, connectedTo: [...(port.connectedTo || []), { itemId: connection.sourceItemId, portId: connection.sourcePortId }] }
                                : port
                        ),
                    };
                }
                return updatedItem;
            });

            return {
                connections: [...state.connections, connection],
                canvasItems: updatedCanvasItems,
                isSaved: false,
            };
        });
        get().addToHistory();
    },

    removeConnection: async (connectionToRemove) => {
        set({ isLoading: true, error: null });

        try {
            const state = get();
            const connectionExists = state.connections.some(
                (conn) =>
                    conn.sourceItemId === connectionToRemove.sourceItemId &&
                    conn.sourcePortId === connectionToRemove.sourcePortId &&
                    conn.targetItemId === connectionToRemove.targetItemId &&
                    conn.targetPortId === connectionToRemove.targetPortId
            );

            if (!connectionExists) {
                throw new Error("Connection does not exist");
            }

            const newConnections = state.connections.filter(
                (conn) =>
                    !(
                        conn.sourceItemId === connectionToRemove.sourceItemId &&
                        conn.sourcePortId === connectionToRemove.sourcePortId &&
                        conn.targetItemId === connectionToRemove.targetItemId &&
                        conn.targetPortId === connectionToRemove.targetPortId
                    )
            );

            const updatedCanvasItems = state.canvasItems.map((item) => {
                let updatedItem = { ...item };
                if (item.id === connectionToRemove.sourceItemId && updatedItem.outputs) {
                    updatedItem = {
                        ...updatedItem,
                        outputs: updatedItem.outputs.map((port: Port) =>
                            port.id === connectionToRemove.sourcePortId
                                ? {
                                      ...port,
                                      connectedTo: (port.connectedTo || []).filter(
                                          (c: { itemId: string; portId: string }) => !(c.itemId === connectionToRemove.targetItemId && c.portId === connectionToRemove.targetPortId)
                                      ),
                                  }
                                : port
                        ),
                    };
                }
                if (item.id === connectionToRemove.targetItemId && updatedItem.inputs) {
                    updatedItem = {
                        ...updatedItem,
                        inputs: updatedItem.inputs.map((port: Port) =>
                            port.id === connectionToRemove.targetPortId
                                ? {
                                      ...port,
                                      connectedTo: (port.connectedTo || []).filter(
                                          (c: { itemId: string; portId: string }) => !(c.itemId === connectionToRemove.sourceItemId && c.portId === connectionToRemove.sourcePortId)
                                      ),
                                  }
                                : port
                        ),
                    };
                }
                return updatedItem;
            });

            set({
                connections: newConnections,
                canvasItems: updatedCanvasItems,
                isSaved: false,
                isLoading: false,
            });
            get().addToHistory();
        } catch (error: any) {
            set({
                isLoading: false,
                error: error.message || "Failed to remove connection",
            });
            console.error("Error removing connection:", error);
        }
    },

    updateCanvasItem: (updatedItem) => {
        set((state) => ({
            canvasItems: state.canvasItems.map((item) =>
                item.id === updatedItem.id ? updatedItem : item
            ),
            isSaved: false,
        }));
        get().addToHistory();
    },

    removeCanvasItem: (itemId) => {
        set((state) => {
            const newConnections = state.connections.filter(
                (conn) => conn.sourceItemId !== itemId && conn.targetItemId !== itemId
            );
            const newCanvasItems = state.canvasItems.filter((item) => item.id !== itemId);
            return {
                canvasItems: newCanvasItems,
                connections: newConnections,
                isSaved: false,
            };
        });
        get().addToHistory();
    },

    addToHistory: () => {
        set((state) => {
            const newState = {
                canvasItems: [...state.canvasItems],
                connections: [...state.connections],
            };
            let newHistory = state.history;
            let newIndex = state.historyIndex;

            if (newIndex < newHistory.length - 1) {
                newHistory = newHistory.slice(0, newIndex + 1);
            }
            newHistory.push(newState);
            newIndex++;

            const MAX_HISTORY_LENGTH = 50;
            if (newHistory.length > MAX_HISTORY_LENGTH) {
                newHistory.shift();
                newIndex--;
            }

            return {
                history: newHistory,
                historyIndex: newIndex,
            };
        });
    },

    undo: () => {
        set((state) => {
            if (state.historyIndex <= 0) return state;
            const newIndex = state.historyIndex - 1;
            const previousState = state.history[newIndex];
            return {
                canvasItems: [...previousState.canvasItems],
                connections: [...previousState.connections],
                historyIndex: newIndex,
                isSaved: false,
            };
        });
    },

    redo: () => {
        set((state) => {
            if (state.historyIndex >= state.history.length - 1) return state;
            const newIndex = state.historyIndex + 1;
            const nextState = state.history[newIndex];
            return {
                canvasItems: [...nextState.canvasItems],
                connections: [...nextState.connections],
                historyIndex: newIndex,
                isSaved: false,
            };
        });
    },

    clearHistory: () => {
        set({ history: [], historyIndex: -1 });
    },
}));

export default useWorkflowStore;