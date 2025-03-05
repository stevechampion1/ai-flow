# Dockerfile for AI-Flow Backend

# 使用官方 Python 3.12 镜像作为基础镜像
FROM python:3.12-slim-buster

# 设置工作目录在容器内
WORKDIR /app

# 将 requirements.txt 文件复制到工作目录
COPY requirements.txt .

# 安装 Python 依赖
RUN pip install --no-cache-dir -r requirements.txt

# 将当前目录下的所有文件复制到工作目录
COPY . .

# 暴露端口 8000，这是 FastAPI 应用默认监听的端口
EXPOSE 8000

# 定义容器启动时执行的命令
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]