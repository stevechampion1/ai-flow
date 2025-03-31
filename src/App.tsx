// src/App.tsx
import React from 'react';
import AIModuleLibrary from './components/AIModuleLibrary';
import WorkflowEditor from './components/WorkflowEditor/WorkflowEditor';
import './App.css';

import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

function App() {
  return (
    <DndProvider backend={HTML5Backend}>
      <div className="app-container">
        {/* 使用 Flexbox 布局 */}
        <aside className="sidebar">
            {/*  !!!  侧边栏  !!! */}
            AI Module Library
            <AIModuleLibrary />
        </aside>

        <main className="main-content">
          {/*   !!!  主内容区域  !!! */}
          Workflow Editor
          <WorkflowEditor />
        </main>
      </div>
    </DndProvider>
  );
}

export default App;