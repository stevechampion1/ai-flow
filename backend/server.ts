// backend/server.ts (修正导入语句为 .js)
import express from 'express';
import cors from 'cors';
// *** 修正：添加 .js 扩展名 ***
import workflowRoutes from './routes/workflowRoutes.js'; // <--- 修改此行

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.send('AI Flow Backend is running!');
});

// --- API 路由 ---
// 确保 './routes/workflowRoutes.js' (编译后的文件) 存在或能被 ts-node 正确处理
app.use('/api', workflowRoutes);

app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("错误处理中间件捕获到错误:", err.stack);
  res.status(500).send('服务器内部发生错误!');
});

app.listen(PORT, () => {
  console.log(`后端服务器正在运行于 http://localhost:${PORT}`);
});