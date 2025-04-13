// types/Connection.ts
// (这个文件应该放在项目根目录下的 types/ 文件夹中,
//  因为你的 tsconfig.json 的 include 指向 "types/**/*")

/**
 * 代表工作流编辑器中两个节点（CanvasItem）端口之间的连接。
 */
export interface Connection {
    id: string; // 连接的唯一标识符
    sourceItemId: string; // 源节点的 ID (CanvasItem ID)
    sourcePortId: string; // 源节点上的端口 ID
    targetItemId: string; // 目标节点的 ID (CanvasItem ID)
    targetPortId: string; // 目标节点上的端口 ID
  }
  
  // 如果还有其他共享的工作流相关类型，也可以考虑放在这里或同级目录下
  // 例如 Port, CanvasItem 等，如果它们也需要在多处共享的话
  // export interface Port { ... }
  // export interface CanvasItem { ... }