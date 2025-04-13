// src/components/WorkflowEditor/Toolbar.tsx
import React from 'react';
import useWorkflowStore from '../../store/workflowStore'; // 新增导入
import './../../styles/WorkflowEditor.scss';

interface ToolbarProps {
    onSave: () => Promise<void>;
    onLoad: () => Promise<void>;
    onRun: () => Promise<void>;
    onUndo: () => void;
    onRedo: () => void;
    canUndo: boolean;
    canRedo: boolean;
    isLoading: boolean; // 新增：加载状态
}

const Toolbar: React.FC<ToolbarProps> = ({ onSave, onLoad, onRun, onUndo, onRedo, canUndo, canRedo, isLoading }) => {
    const { setLoading } = useWorkflowStore(); // 获取 setLoading

    // 包装异步操作以控制加载状态
    const handleAsyncClick = async (action: () => Promise<void>) => {
        try {
            setLoading(true);
            await action();
        } catch (error) {
            console.error("Toolbar action failed:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="toolbar">
            <button
                onClick={() => handleAsyncClick(onSave)}
                title="Save"
                disabled={isLoading}
            >
                Save
            </button>
            <button
                onClick={() => handleAsyncClick(onLoad)}
                title="Load"
                disabled={isLoading}
            >
                Load
            </button>
            <button
                onClick={onUndo}
                title="Undo"
                disabled={isLoading || !canUndo}
            >
                Undo
            </button>
            <button
                onClick={onRedo}
                title="Redo"
                disabled={isLoading || !canRedo}
            >
                Redo
            </button>
            <button
                onClick={() => handleAsyncClick(onRun)}
                title="Run"
                disabled={isLoading}
            >
                Run
            </button>
        </div>
    );
};

export default Toolbar;