/**
 * src/utils/workflowExecutionUtils.ts
 *
 * 封装与工作流执行相关的逻辑，包括拓扑排序、调用后端 API 以及协调整个执行过程。
 */

interface CanvasItem {
  id: string;
  type: string; // AI 模块类型，例如 'image_classification', 'text_generation' 等
  data: any;    // 模块配置数据
  // 其他可能的属性...
}

interface Connection {
  // 修改这里
  sourceItemId: string;
  sourcePortId: string;
  targetItemId: string;
  targetPortId: string;
}

interface InputData {
  [key: string]: any; // 键是输入的名称，值是输入的数据
}

/**
 * 根据连接关系计算 AI 模块的执行顺序（拓扑排序算法）。
 *
 * @param canvasItems 画布上的 AI 模块列表
 * @param connections 模块之间的连接关系
 * @returns 排序后的模块 ID 数组，表示执行顺序
 */
function getExecutionOrder(canvasItems: CanvasItem[], connections: Connection[]): string[] {
  // 1. 构建图的邻接表表示
  const graph: { [key: string]: string[] } = {};
  const inDegree: { [key: string]: number } = {}; // 存储每个节点的入度

  // 初始化图和入度
  for (const item of canvasItems) {
    graph[item.id] = [];
    inDegree[item.id] = 0;
  }

  // 构建邻接表和计算入度
  for (const connection of connections) {
      // 修改这里
    graph[connection.sourceItemId].push(connection.targetItemId);
    inDegree[connection.targetItemId]++;
  }

  // 2. 拓扑排序 (Kahn's algorithm)
  const queue: string[] = [];
  const result: string[] = [];

  // 将所有入度为 0 的节点加入队列
  for (const nodeId in inDegree) {
    if (inDegree[nodeId] === 0) {
      queue.push(nodeId);
    }
  }

  while (queue.length > 0) {
    const nodeId = queue.shift()!; // 从队列中取出一个节点
    result.push(nodeId);

    // 遍历该节点的所有邻居
    for (const neighbor of graph[nodeId]) {
      inDegree[neighbor]--; // 邻居节点的入度减 1
      if (inDegree[neighbor] === 0) {
        queue.push(neighbor); // 如果邻居节点的入度变为 0，则加入队列
      }
    }
  }

  // 3. 检查是否有环 (如果 result 的长度不等于 canvasItems 的长度，则说明存在环)
  if (result.length !== canvasItems.length) {
    throw new Error("工作流中存在循环依赖，无法执行！");
  }

  return result;
}

/**
 * 根据模块类型和配置，调用后端 API 执行 AI 任务。
 *
 * @param module AI 模块信息
 * @param inputData 输入数据
 * @returns 执行结果
 */
async function executeAIModule(module: CanvasItem, inputData: InputData): Promise<any> {
  // 这里假设有一个名为 `callAIBackend` 的函数用于与后端 API 通信
  // 实际实现中，您需要根据具体的 API 接口进行调整
    try {
        const response = await callAIBackend(module.type, module.data, inputData);
        return response;
     }
     catch(error: any) // 将 error 的类型指定为 any
     {
        console.error("调用AI后端API失败:", error);
        throw new Error(`执行模块 ${module.id} 失败: ${error.message}`);
     }
}
/**
  * 模拟与后端API通讯.
  */
 async function callAIBackend(moduleType: string, moduleData:any, inputData: InputData):Promise<any>{
    // 模拟异步延迟
    await new Promise(resolve => setTimeout(resolve, 500));
    // 模拟不同模块类型的响应.
    switch(moduleType){
      case 'image_classification':
        return { label: 'cat', confidence: 0.9 };
      case 'text_generation':
          return { generated_text: 'This is a sample text.'};
      default:
          return {result: 'success'}
    }
 }
/**
 * 工作流执行的入口函数，协调整个执行过程。
 *
 * @param canvasItems 画布上的 AI 模块列表
 * @param connections 模块之间的连接关系
 * @returns 每个模块的执行结果, key 是模块的 ID, value 是执行结果.
 */
async function runWorkflow(canvasItems: CanvasItem[], connections: Connection[]): Promise<Record<string, any>> { // 修改了返回值类型
  try {
    // 1. 获取执行顺序
    const executionOrder = getExecutionOrder(canvasItems, connections);

    // 2. 准备一个地方来存储每个模块的输出
    const moduleOutputs: { [key: string]: any } = {};

    // 3. 按照执行顺序依次执行模块
    for (const moduleId of executionOrder) {
      const module = canvasItems.find((item) => item.id === moduleId)!;

      // 4. 准备输入数据 (从上游模块的输出中获取)
      const inputData: InputData = {};
      const incomingConnections = connections.filter((conn) => conn.targetItemId === moduleId); //修改这里

      for (const conn of incomingConnections) {
        // 假设连接的 source 属性对应的值就是 inputData 的 key
        // 修改这里
        inputData[conn.sourceItemId] = moduleOutputs[conn.sourceItemId];
      }

      // 5. 执行模块
      const output = await executeAIModule(module, inputData);

      // 6. 存储模块的输出
      moduleOutputs[moduleId] = output;
        console.log(`模块 ${moduleId} 执行完成，输出：`, output);
    }

    console.log("工作流执行完成！");
    return moduleOutputs; // 在 try 块的末尾返回 moduleOutputs
  } catch (error) {
    console.error("工作流执行失败：", error);
    throw error; // 重新抛出错误, 让调用者 (WorkflowEditor) 能够捕获到
  }
}

export { getExecutionOrder, executeAIModule, runWorkflow };