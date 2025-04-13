# AI-Flow - 低代码 AI 应用开发平台 (Low-Code AI Application Development Platform)

[![GitHub Stars](https://img.shields.io/github/stars/stevechampion1/ai-flow?style=social)](https://github.com/stevechampion1/ai-flow)
[![GitHub Forks](https://img.shields.io/github/forks/stevechampion1/ai-flow?style=social)](https://github.com/stevechampion1/ai-flow)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**AI-Flow** 是一个开源、低代码的 AI 应用开发平台，旨在帮助开发者快速构建、部署和管理 AI 驱动的应用程序。 该平台集成了大型语言模型 (LLM)、生成式 AI 以及多种 AI 智能体，用户可以通过直观的可视化界面设计复杂的工作流程和自动化任务，无需深入的编码知识。

**项目愿景:**

*   **简化 AI 开发:**  通过可视化拖放界面和预构建模块，大幅降低 AI 应用的开发门槛，让更多开发者能够轻松构建 AI 驱动的解决方案。
*   **赋能创新:**  集成多样化的 AI 技术，包括文本生成、图像处理、语音识别等，支持开发者探索和创新各种 AI 应用场景。
*   **社区驱动:**  构建一个活跃的开源社区，鼓励开发者共同贡献代码、模块和创意，促进 AI-Flow 平台的持续发展和创新。

**核心功能 (当前及规划中):**

*   **可视化工作流编辑器:**  直观的拖放式界面，用于设计复杂的工作流程，支持条件逻辑、循环处理和并行任务。 (当前为 *占位符*,  UI 和功能开发中)
*   **AI 模块库:**  丰富的开箱即用 AI 模块，包括文本生成、图像分类、语音转文本等，支持用户自定义和扩展模块。 (当前为 *框架搭建中*,  部分模块示例实现)
*   **智能体集成:**  支持创建和部署 AI 智能体，执行独立任务，如数据分析、报告生成等。 (计划中)
*   **数据处理管道:**  内置数据清洗、转换和可视化工具，简化数据准备流程。 (部分工具函数占位符)
*   **API 与 Webhook 支持:**  提供灵活的集成选项，支持与其他服务和应用的无缝连接。 (后端 API 框架已搭建)
*   **实时监控与调试:**  内置日志和性能监控工具，帮助用户快速排查问题。 (计划中)
*   **多语言支持:**  界面和文档支持多种语言，吸引全球开发者。 (计划中)

**技术栈:**

*   **前端:**  TypeScript, React
*   **后端:**  Python, FastAPI
*   **AI 模型:**  Hugging Face Transformers, OpenAI API
*   **数据库:**  PostgreSQL
*   **缓存:**  Redis
*   **部署:**  Docker, Kubernetes

**快速上手 (Getting Started):**

以下是在本地运行 AI-Flow 后端和前端 (可选) 的基本步骤。  **请确保您已安装 Docker Desktop (推荐) 或 Node.js, Python, PostgreSQL, Redis 等必要的开发环境。**

**使用 Docker Compose (推荐，一键启动所有服务):**

1.  **克隆代码仓库:**

    ```bash
    git clone https://github.com/stevechampion1/ai-flow.git
    cd ai-flow
    ```

2.  **构建并启动 Docker Compose 应用:**

    ```bash
    docker-compose up --build
    ```

    等待 Docker Compose 应用启动完成。

3.  **访问后端 API 文档:**  打开浏览器，访问 [http://localhost:8000/docs](http://localhost:8000/docs) 查看 Swagger UI API 文档。

4.  **访问前端应用 (如果已容器化):**  打开浏览器，访问 [http://localhost:3000](http://localhost:3000) (或您配置的前端端口)。

5.  **停止 Docker Compose 应用:**

    ```bash
    docker-compose down
    ```

**不使用 Docker Compose (手动启动服务):**

1.  **克隆代码仓库:**

    ```bash
    git clone https://github.com/your-github-username/ai-flow.git
    cd ai-flow
    ```

2.  **创建并激活 Python 虚拟环境 (推荐):**

    ```bash
    python -m venv venv
    source venv/bin/activate  # Linux/macOS
    venv\Scripts\activate  # Windows
    ```

3.  **安装后端依赖:**

    ```bash
    pip install -r requirements.txt
    ```

4.  **启动 PostgreSQL 数据库服务器 (确保已安装并运行).**
5.  **创建 PostgreSQL 数据库 `aiflow_db` 并运行 `schema.sql` 文件创建表结构.**
6.  **启动 Redis 缓存服务器 (确保已安装并运行).**
7.  **设置环境变量:**  例如 `OPENAI_API_KEY`, `DATABASE_URL`, `REDIS_URL` (具体环境变量请参考 `docker-compose.yml` 文件中的 environment 配置)。
8.  **启动后端 FastAPI 应用:**

    ```bash
    cd backend
    uvicorn main:app --reload
    ```

9.  **启动前端 React 应用 (可选，如果需要运行前端):**

    ```bash
    cd frontend
    npm install
    npm start
    ```

10. **访问后端 API 文档:**  打开浏览器，访问 [http://localhost:8000/docs](http://localhost:8000/docs) 查看 Swagger UI API 文档。

11. **访问前端应用 (如果已启动):**  打开浏览器，访问 [http://localhost:3000](http://localhost:3000) (或您配置的前端端口)。

**路线图 (Roadmap - 规划中的功能):**

*   **Phase 2: 完善可视化工作流编辑器 UI 和基本功能。**
*   **Phase 3: 实现 AI 模块库的基本功能和部分核心 AI 模块集成 (文本生成、图像分类等)。**
*   **Phase 4:  添加智能体集成功能和数据处理管道的初步实现。**
*   **Phase 5:  完善实时监控与调试功能，并开始探索多语言支持。**
*   **长期目标:  打造一个功能完善、易用、可扩展的低代码 AI 应用开发平台，并持续迭代和改进。**

**贡献指南 (Contributing):**

欢迎任何形式的贡献！  如果您有任何想法、建议或代码贡献，请随时参与进来！

*   **报告 Bug:**  如果您在使用过程中发现了 Bug 或问题，请在 GitHub Issues 中提交 Issue，详细描述您遇到的问题和复现步骤。
*   **功能建议:**  如果您有新的功能建议或改进意见，欢迎在 GitHub Discussions 中发起讨论。
*   **代码贡献:**  如果您想贡献代码，请 Fork 代码仓库，创建您的 Feature Branch，并提交 Pull Request。  请遵循代码风格指南，并尽量提供完善的测试用例。

详细的贡献指南和代码风格规范将在后续完善。

**License:**

AI-Flow 项目使用 [MIT License](LICENSE) 开源许可。  MIT License 是一种非常宽松的开源许可协议，允许您自由使用、修改、复制、发布和分发本项目的代码，包括商业用途。

**联系方式 (Contact):**

*   GitHub Discussions: [https://github.com/stevechampion1/ai-flow/discussions](https://github.com/stevechampion1/ai-flow/discussions)
