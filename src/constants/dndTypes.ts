// src/constants/dndTypes.ts

/**
 * 定义可拖放项的类型常量。
 * 在拖动源 (useDrag) 和放置目标 (useDrop) 之间共享，
 * 以确保类型匹配。
 */
export const ItemTypes = {
    /**
     * 代表从 AI 模块库拖出的一个模块定义。
     */
    MODULE: 'module',
  
    /**
     * 代表画布上已经存在的一个可拖动项（节点）。
     */
    CANVAS_ITEM: 'canvasItem',
    // 如果未来有其他可拖放类型，可以在这里添加
  };