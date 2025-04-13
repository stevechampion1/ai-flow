// src/components/AIModuleLibrary.tsx
import React, { useState, useEffect } from 'react';
import './../styles/AIModuleLibrary.scss';
import { fetchAIModules } from '../api/workflowApi';
import { AIModule } from '../../types/ai_module_models'; // 更新路径
import AIModuleItem from './AIModuleItem';

interface AIModuleLibraryProps {
  // onSelectModule?: (moduleId: string) => void; // 可选
}

const AIModuleLibrary: React.FC<AIModuleLibraryProps> = () => {
  const [moduleList, setModuleList] = useState<AIModule[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');

  useEffect(() => {
    fetchAIModules()
      .then((data) => {
        setModuleList(data);
      })
      .catch((error) => {
        console.error('Error fetching AI modules:', error);
      });
  }, []);

  const filteredModules = moduleList.filter((module) => {
    const searchLower = searchTerm.toLowerCase();
    const nameLower = module.name.toLowerCase();
    const descriptionLower = module.description ? module.description.toLowerCase() : '';
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
          {filteredModules.map((module) => (
            <AIModuleItem key={module.id} module={module} />
          ))}
          {filteredModules.length === 0 && searchTerm !== '' && (
            <li>No modules found matching "{searchTerm}"</li>
          )}
          {moduleList.length === 0 && searchTerm === '' && <li>Loading modules...</li>}
        </ul>
      </div>
    </div>
  );
};

export default AIModuleLibrary;