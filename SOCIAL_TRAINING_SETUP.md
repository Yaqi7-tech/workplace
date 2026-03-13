# 社交培训系统 - 独立部署指南

## 🔒 数据隔离说明

本系统与心理咨询师培训系统**完全隔离**，使用独立的数据库和配置：

| 项目 | 数据库前缀 | Supabase 项目 | 环境变量文件 |
|------|-----------|--------------|-------------|
| 心理咨询师培训 | `practice_sessions` | counseling-project | `.env` |
| 社交培训系统 | `social_training_sessions` | social-training-project | `.env.social` |

---

## 📋 新建 Supabase 项目步骤

### 1. 创建新项目

1. 访问 [supabase.com](https://supabase.com)
2. 点击 **New Project**
3. 填写项目信息：
   - **Name**: `social-training`（或任意名称）
   - **Database Password**: 保存好密码
   - **Region**: 选择距离最近的区域

### 2. 获取 API 密钥

1. 进入项目 → **Settings** → **API**
2. 复制以下信息：
   ```
   Project URL: https://xxxxx.supabase.co
   anon/public key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

### 3. 执行数据库建表语句

1. 进入项目 → **SQL Editor**
2. 点击 **New Query**
3. 复制 `supabase/social_training_schema.sql` 的全部内容
4. 点击 **Run** 执行

### 4. 验证表创建

在 SQL Editor 中执行：

```sql
-- 查看创建的表
SELECT tablename
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename LIKE 'social_%';

-- 预期结果：
-- social_training_sessions
-- social_training_turns
-- social_scenarios
-- social_user_progress
```

---

## 🗂️ 数据库表结构

```
social_training_sessions    # 社交培训会话主表
├── id: UUID (主键)
├── user_id: UUID (用户ID)
├── scenario_name: 场景名称
├── scenario_type: 场景类型
├── total_score: 总分 (0-10)
├── dimension_scores: 维度评分 JSONB
└── created_at: 创建时间

social_training_turns       # 对话轮次表
├── id: UUID (主键)
├── session_id: 关联会话
├── turn_number: 轮次编号
├── user_message: 用户消息
├── ai_message: AI回复
└── evaluation: 评估数据

social_scenarios            # 场景模板表
├── id: UUID (主键)
├── name: 场景名称
├── type: 场景类型
├── ai_persona: AI角色设定
└── evaluation_criteria: 评分标准

social_user_progress        # 用户学习进度
├── id: UUID (主键)
├── user_id: 用户ID
├── total_sessions: 总会话数
├── average_score: 平均分
├── current_level: 当前等级
└── achievements: 成就数据
```

---

## 🔧 环境配置

### 1. 复制配置文件

```bash
cp .env.social.example .env
```

### 2. 编辑 `.env` 文件

```bash
# 填入你的 Supabase 信息
VITE_SUPABASE_URL=https://your-social-training-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# 填入 Dify API 配置
VITE_SOCIAL_DIFY_PARTNER_API_URL=https://gateway.lingxinai.com/dify-test/v1
VITE_SOCIAL_DIFY_PARTNER_API_KEY=your-partner-agent-key
VITE_SOCIAL_DIFY_EVALUATOR_API_URL=https://gateway.lingxinai.com/dify-test/v1
VITE_SOCIAL_DIFY_EVALUATOR_API_KEY=your-evaluator-agent-key

# 应用标题
VITE_APP_TITLE=社交技能培训系统
VITE_APP_MODE=social
```

---

## 📦 可用的社交场景

系统预置了以下场景（可在 `social_scenarios` 表中扩展）：

| 场景类型 | 名称 | 难度 | AI角色 |
|---------|------|------|--------|
| interview | 求职面试 - 产品经理 | medium | 面试官 |
| negotiation | 商务谈判 - 合作协议 | hard | 合作方代表 |
| dating | 约会社交 - 初次约会 | easy | 约会对象 |
| presentation | 公开演讲 - 项目路演 | hard | 听众/投资人 |

---

## 🔐 行级安全策略 (RLS)

所有表都启用了行级安全，确保：
- ✅ 用户只能访问自己的数据
- ✅ 跨项目数据完全隔离
- ✅ 即使数据库泄露，用户也无法访问其他用户的数据

### RLS 策略列表

```sql
-- 社交培训会话
├── 用户可以查看自己的社交培训记录
├── 用户可以插入自己的社交培训记录
├── 用户可以更新自己的社交培训记录
└── 用户可以删除自己的社交培训记录

-- 对话轮次
├── 用户可以查看自己会话的对话轮次
└── 用户可以插入自己会话的对话轮次

-- 用户进度
├── 用户可以查看自己的学习进度
├── 用户可以插入自己的学习进度
└── 用户可以更新自己的学习进度

-- 场景模板
└── 所有认证用户可以查看活跃场景
```

---

## 🚀 启动项目

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build
```

---

## 📊 数据隔离对比

| 特性 | 心理咨询师培训 | 社交培训系统 |
|------|--------------|-------------|
| 表名前缀 | `practice_` | `social_` |
| 主表 | `practice_sessions` | `social_training_sessions` |
| 轮次表 | `turn_evaluations` | `social_training_turns` |
| 进度表 | 无 | `social_user_progress` |
| 场景表 | 无 | `social_scenarios` |
| 评分维度 | 咨询能力相关 | 沟通/情商/说服力等 |
| RLS策略 | 独立 | 独立 |

---

## ✅ 部署检查清单

- [ ] 创建了新的 Supabase 项目
- [ ] 执行了 `social_training_schema.sql`
- [ ] 验证了4个表创建成功
- [ ] 复制了 `.env.social.example` 为 `.env`
- [ ] 填入了正确的 Supabase URL 和 Key
- [ ] 配置了 Dify API Key
- [ ] 设置了 `VITE_APP_MODE=social`
- [ ] 测试了用户注册登录
- [ ] 测试了创建培训会话
- [ ] 验证了数据保存在正确的表中

---

## 🔄 切换/双系统运行

如果需要在同一台机器上运行两个系统：

```bash
# 终端1：心理咨询师培训系统
cd /path/to/counseling
export VITE_APP_MODE=counseling
npm run dev

# 终端2：社交培训系统
cd /path/to/social-training
export VITE_APP_MODE=social
npm run dev
```
