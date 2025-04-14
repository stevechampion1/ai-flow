// src/components/AIModuleLibrary.tsx (修改后)
import React, { useState } from 'react'; // 移除 useEffect
import './../styles/AIModuleLibrary.scss';
// 移除 fetchAIModules 的导入
import type { AIModule } from '../../types/ai_module_models'; // 确认类型路径正确
import AIModuleItem from './AIModuleItem'; // 假设 AIModuleItem 正确处理拖拽

// 定义接收的 Props
interface AIModuleLibraryProps {
  modules: AIModule[]; // 从父组件接收模块列表
  isLoading: boolean;   // 从父组件接收加载状态
  error: string | null; // 从父组件接收错误状态
}

const AIModuleLibrary: React.FC<AIModuleLibraryProps> = ({ modules, isLoading, error }) => {
  // 移除内部的 moduleList state
  // const [moduleList, setModuleList] = useState<AIModule[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');

  // 移除内部的 useEffect 获取逻辑
  // useEffect(() => { ... fetchAIModules logic removed ... }, []);

  // 直接使用传入的 modules prop 进行过滤
  const filteredModules = modules.filter((module) => {
    const searchLower = searchTerm.toLowerCase();
    const nameLower = module.name.toLowerCase();
    // 添加对 description 可能为空的检查
    const descriptionLower = module.description?.toLowerCase() || '';
    return nameLower.includes(searchLower) || descriptionLower.includes(searchLower);
  });

  return (
    <div className="ai-module-library-container">
      <h3>AI Module Library</h3>
      <div className="ai-module-library-search">
        <input
          type="text"
          placeholder="Search AI Modules..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      <div className="ai-module-list">
        <ul>
          {/* 根据 isLoading 和 error 显示不同内容 */}
          {isLoading && <li>Loading modules...</li>}
          {error && <li style={{ color: 'red' }}>Error: {error}</li>}
          {!isLoading && !error && filteredModules.length > 0 && (
            filteredModules.map((module) => (
              // 确保 AIModuleItem 能正确处理拖拽，它需要 module 数据
              <AIModuleItem key={module.id} module={module} />
            ))
          )}
          {!isLoading && !error && filteredModules.length === 0 && modules.length > 0 && searchTerm !== '' && (
            <li>No modules found matching "{searchTerm}"</li>
          )}
          {!isLoading && !error && modules.length === 0 && (
             <li>No modules available.</li> // 如果加载完成但列表为空
          )}
        </ul>
      </div>
    </div>
  );
};

export default AIModuleLibrary;