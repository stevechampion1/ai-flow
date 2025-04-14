// src/App.tsx (修改后)
import React, { useState, useEffect } from 'react'; // 引入 useState, useEffect
import AIModuleLibrary from './components/AIModuleLibrary';
import WorkflowEditor from './components/WorkflowEditor/WorkflowEditor';
import './App.css';

import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

// 引入 API 函数和类型
import { fetchAIModules } from './api/workflowApi';
import type { AIModule } from '../types/ai_module_models'; // 确认类型路径正确

function App() {
  // --- 状态提升 ---
  // 在 App 组件中管理 availableModules 状态
  const [availableModules, setAvailableModules] = useState<AIModule[]>([]);
  const [isLoadingModules, setIsLoadingModules] = useState<boolean>(true); // 可选：添加加载状态
  const [moduleError, setModuleError] = useState<string | null>(null);   // 可选：添加错误状态

  // 使用 useEffect 在组件挂载时获取模块列表
  useEffect(() => {
    setIsLoadingModules(true); // 开始加载
    setModuleError(null);      // 清除旧错误
    fetchAIModules()
      .then((data) => {
        setAvailableModules(data); // 更新状态
      })
      .catch((error) => {
        console.error('Error fetching AI modules in App:', error);
        setModuleError('Failed to load AI modules. Please try refreshing.'); // 设置错误信息
      })
      .finally(() => {
        setIsLoadingModules(false); // 结束加载
      });
  }, []); // 空依赖数组表示只在挂载时运行一次
  // --- 状态提升结束 ---

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="app-container">
        <aside className="sidebar">
           {/* 将模块列表和加载/错误状态传递给 AIModuleLibrary */}
           <AIModuleLibrary
             modules={availableModules}
             isLoading={isLoadingModules}
             error={moduleError}
           />
        </aside>

        <main className="main-content">
           {/* 将模块列表传递给 WorkflowEditor */}
           <WorkflowEditor availableModules={availableModules} />
           {/* 可选：在编辑器区域显示加载或错误状态 */}
           {/* {isLoadingModules && <p>Loading editor resources...</p>} */}
           {moduleError && <p style={{ color: 'red', padding: '10px' }}>Error: {moduleError}</p>}
        </main>
      </div>
    </DndProvider>
  );
}

export default App;