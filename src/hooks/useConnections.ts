// src/hooks/useConnections.ts
import { useState, useCallback } from "react";
// 使用相对路径从 types 目录导入共享类型
// 注意路径层级：从 src/hooks 到 types/
import type { Connection } from "../../types/Connection";
import { v4 as uuidv4 } from 'uuid'; // 引入 uuid 来生成 ID (假设你已安装 uuid)

// 注意：这个 Hook 现在与 WorkflowEditor 使用相同的 Connection 结构
export function useConnections(initialConnections: Connection[] = []) {
  const [connections, setConnections] = useState<Connection[]>(initialConnections);

  /**
   * 添加新连接 (确保参数与 Connection 结构匹配)
   */
  const addConnection = useCallback((newConnectionData: Omit<Connection, 'id'>) => {
    setConnections((prevConnections) => {
      // 检查连接是否已存在
      const exists = prevConnections.some(
        (conn) =>
          conn.sourceItemId === newConnectionData.sourceItemId &&
          conn.sourcePortId === newConnectionData.sourcePortId &&
          conn.targetItemId === newConnectionData.targetItemId &&
          conn.targetPortId === newConnectionData.targetPortId
      );

      if (exists) {
        console.warn("Connection already exists:", newConnectionData);
        return prevConnections; // 如果已存在，则不添加
      }

      // 创建带有唯一 ID 的新连接对象
      const connectionWithId: Connection = {
        ...newConnectionData,
        id: uuidv4(), // 自动生成 ID
      };

      return [...prevConnections, connectionWithId];
    });
  }, []);

  /**
   * 根据 ID 移除连接
   */
  const removeConnectionById = useCallback((connectionIdToRemove: string) => {
    setConnections((prevConnections) =>
      prevConnections.filter((conn) => conn.id !== connectionIdToRemove)
    );
  }, []);

  /**
   * 根据源和目标信息移除连接 (如果需要)
   * 注意：这可能不如按 ID 移除精确，因为可能存在结构相同但 ID 不同的连接（尽管 addConnection 会阻止重复）
   */
  const removeConnectionByEndpoints = useCallback((connectionToRemove: Omit<Connection, 'id'>) => {
     setConnections((prevConnections) =>
       prevConnections.filter(
         (conn) =>
           !(
             conn.sourceItemId === connectionToRemove.sourceItemId &&
             conn.sourcePortId === connectionToRemove.sourcePortId &&
             conn.targetItemId === connectionToRemove.targetItemId &&
             conn.targetPortId === connectionToRemove.targetPortId
           )
       )
     );
  }, []);


  /**
   * 清空所有连接
   */
  const clearConnections = useCallback(() => {
    setConnections([]);
  }, []);

  /**
   * 查找与指定节点相关的所有连接（作为源或目标）
   */
  const findConnectionsByNode = useCallback((nodeId: string): Connection[] => {
    // 确保在比较前 connections 状态是最新的
    // useState 的 connections 在回调函数闭包内可能不是最新的，除非它是依赖项
    // 但在这里，filter 是在调用时执行的，所以应该没问题
    return connections.filter(
      (conn) => conn.sourceItemId === nodeId || conn.targetItemId === nodeId
    );
  }, [connections]); // 将 connections 加入依赖数组，确保 filter 使用最新的状态

  return {
    connections,
    addConnection,
    removeConnectionById, // 推荐使用按 ID 删除
    removeConnectionByEndpoints, // 提供另一种删除方式（如果需要）
    clearConnections,
    findConnectionsByNode,
    setConnections, // 直接暴露 setConnections 以便外部（如历史记录）可以覆盖状态
  };
}