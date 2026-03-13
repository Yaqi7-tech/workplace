# 职场 NPC 模拟培训系统

## 项目简介

这是一个职场沟通技能培训系统，通过模拟真实的职场场景和不同类型的带教老师/上级人设，帮助学员提升职场沟通能力。

## 系统特点

- **6种真实职场场景**：接受模糊指令、工作失误汇报、拒绝不合理要求、进度滞后预警、争取权益、职场闲聊
- **4种带教老师人设**：逻辑压制型、模糊否定型、沉默/冷处理型、情绪施压型
- **AI驱动对话**：使用 Dify API 实现 NPC 角色扮演
- **完整训练流程**：场景选择 → 人设选择 → 模拟对话 → 自我评估

## 技术栈

- **前端**: React 18 + TypeScript + Vite
- **UI**: Tailwind CSS + Radix UI
- **后端**: Vercel Serverless Functions
- **AI**: Dify API
- **数据库**: Supabase (可选)

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env`：

```bash
cp .env.example .env
```

编辑 `.env` 文件，配置以下变量：

```bash
# Dify API 配置（必需）
VITE_SOCIAL_DIFY_PARTNER_API_URL=https://api.dify.ai/v1
VITE_SOCIAL_DIFY_PARTNER_API_KEY=your-api-key-here

# Supabase 配置（可选，用于保存训练记录）
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# 应用模式
VITE_APP_MODE=workplace
```

### 3. 获取 Dify API Key

1. 访问 [Dify.ai](https://dify.ai)
2. 创建一个新的对话型应用
3. 在应用设置中获取 API Key
4. 配置提示词模板（见下方）

### 4. 启动开发服务器

```bash
npm run dev
```

访问 `http://localhost:5173` 即可使用。

## Dify 提示词配置

创建 Dify 应用时，使用以下提示词模板：

```
你是一位职场带教老师/上级，需要与学员进行职场沟通训练。

【场景设定】
{{scenario}}

【人设设定】
{{persona}}

【对话规则】
1. 严格按照人设特征回应
2. 不要跳出角色
3. 根据学员的开场白给出符合人设的回应
4. 回应要简短有力

现在请等待学员的开场白。
```

在对话开始时，系统会传入以下变量：
- `scenario`: 场景描述
- `persona`: 人设描述

## 数据库表结构（可选）

如果使用 Supabase 保存训练记录，执行以下 SQL 创建表：

```sql
CREATE TABLE IF NOT EXISTS workplace_training_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scenario_type VARCHAR(50) NOT NULL,
  persona_type VARCHAR(50) NOT NULL,
  messages JSONB NOT NULL,
  turn_count INTEGER DEFAULT 0,
  self_rating INTEGER,
  self_reflection TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workplace_sessions_user_id ON workplace_training_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_workplace_sessions_scenario ON workplace_training_sessions(scenario_type);
```

## 项目结构

```
training/
├── guidelines/
│   └── src/
│       ├── app/
│       │   ├── components/
│       │   │   ├── WorkplaceScenarioSelection.tsx  # 场景/人设选择
│       │   │   ├── WorkplaceChatInterface.tsx      # 对话界面
│       │   │   └── WorkplaceReport.tsx             # 训练报告
│       │   ├── config/
│       │   │   └── workplaceScenarios.ts           # 场景和人设配置
│       │   └── WorkplaceApp.tsx                    # 主应用入口
│       └── main.tsx
├── api/
│   └── dify.js                                    # Dify API 代理
└── .env.example
```

## 场景说明

| 场景 | 难度 | 描述 |
|------|------|------|
| 接受模糊指令 | 进阶 | 领导只说"看着办"，不敢细问要求 |
| 工作失误汇报 | 挑战 | 发错邮件等严重失误，如何止损和道歉 |
| 拒绝不合理要求 | 进阶 | 非工作时间安排非紧急任务 |
| 进度滞后预警 | 挑战 | 任务完不成，如何提前说明 |
| 争取权益 | 挑战 | 申请转正、加薪或询问加班费 |
| 职场闲聊 | 入门 | 电梯偶遇大领导，如何破冰 |

## 人设说明

| 人设 | 特点 |
|------|------|
| 逻辑压制型 | 抠细节，崇尚数据，连珠炮反问 |
| 模糊否定型 | 只说"感觉不对"，不给具体标准 |
| 沉默/冷处理型 | 回复简短，已读不回 |
| 情绪施压型 | 阴阳怪气，施加心理压力 |

## 部署

### Vercel 部署

1. 将项目推送到 GitHub
2. 在 Vercel 中导入项目
3. 配置环境变量
4. 部署完成

### 环境变量配置

在 Vercel 项目设置中添加：

```
VITE_SOCIAL_DIFY_PARTNER_API_URL=https://api.dify.ai/v1
VITE_SOCIAL_DIFY_PARTNER_API_KEY=your-api-key
VITE_APP_MODE=workplace
```

## 开发计划

- [ ] AI 自动评估功能
- [ ] 多轮对话评估维度
- [ ] 用户进步分析图表
- [ ] 导出训练报告为 PDF
- [ ] 移动端适配优化

## 许可证

MIT
