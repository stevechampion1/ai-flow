// backend/server.ts
import express from 'express';
import cors from 'cors'; // 新增
import workflowRoutes from './routes/workflowRoutes.ts';

const app = express();

// 中间件
app.use(express.json());
app.use(cors()); // 启用 CORS，允许所有来源

// 路由
app.use('/api', workflowRoutes);

// 启动服务器
const PORT = 3001;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});