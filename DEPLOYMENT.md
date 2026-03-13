# Vercel 部署指南

## 项目概述

这是一个心理咨询师培训评测系统，基于 Vite + React + TypeScript 构建。

## 前置条件

1. **Dify API 服务**：项目依赖 Dify API（https://dify.ai）
   - 你需要在 Dify 创建两个应用：
     - **访客AI**：扮演来访者角色
     - **督导AI**：提供实时督导反馈

2. **Vercel 账号**：https://vercel.com

## 部署步骤

### 方法一：通过 Vercel CLI 部署（推荐）

1. 安装 Vercel CLI
   ```bash
   npm install -g vercel
   ```

2. 在项目根目录运行
   ```bash
   vercel
   ```

3. 按提示操作：
   - 登录你的 Vercel 账号
   - 选择项目设置
   - 配置环境变量（见下方）

### 方法二：通过 Vercel 网站部署

1. 将代码推送到 GitHub 仓库

2. 登录 Vercel (https://vercel.com)

3. 点击 "Add New Project"

4. 导入你的 GitHub 仓库

5. 配置项目：
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

6. 配置环境变量（见下方）

7. 点击 "Deploy"

## 环境变量配置

在 Vercel 项目设置中添加以下环境变量：

| 变量名 | 值 | 说明 |
|--------|-----|------|
| `VITE_DIFY_VISITOR_API_URL` | `https://api.dify.ai/v1` | Dify API 地址 |
| `VITE_DIFY_VISITOR_API_KEY` | `your_visitor_app_key` | 访客AI应用密钥 |
| `VITE_DIFY_SUPERVISOR_API_URL` | `https://api.dify.ai/v1` | Dify API 地址 |
| `VITE_DIFY_SUPERVISOR_API_KEY` | `your_supervisor_app_key` | 督导AI应用密钥 |

## 获取 Dify API 密钥

1. 登录 Dify (https://cloud.dify.ai)

2. 创建或选择你的应用

3. 点击 "访问 API" 或 "发布"

4. 复制 API 密钥

## 本地开发

1. 复制环境变量示例文件：
   ```bash
   cp .env.example .env.local
   ```

2. 编辑 `.env.local` 填入你的 API 密钥

3. 安装依赖：
   ```bash
   npm install
   ```

4. 启动开发服务器：
   ```bash
   npm run dev
   ```

## 项目结构

```
counseling_training-main/
├── guidelines/src/app/       # 源代码
│   ├── components/          # React 组件
│   └── services/            # API 服务
├── dist/                    # 构建输出（自动生成）
├── vercel.json              # Vercel 配置
├── vite.config.ts           # Vite 配置
├── package.json
└── tsconfig.json            # TypeScript 配置
```

## 常见问题

### Q: 部署后 API 调用失败？
A: 检查环境变量是否正确配置，确保 Dify API 密钥有效。

### Q: 如何更新部署？
A: 推送代码到 GitHub，Vercel 会自动重新部署。或使用 `vercel --prod` 命令。

### Q: 本地开发和生产环境配置不同？
A: 使用 `.env.local` 存放本地开发配置，生产环境配置在 Vercel 项目设置中。

## 技术栈

- **框架**: React 18 + TypeScript
- **构建工具**: Vite 6
- **样式**: Tailwind CSS
- **UI 组件**: Radix UI + Material Icons
- **图表**: Recharts
- **动画**: Motion
- **部署**: Vercel

## 支持

如有问题，请检查：
1. Vercel 部署日志
2. 浏览器控制台错误
3. Dify API 状态

---

祝部署顺利！
