# Supabase 数据库设置指南

## 第一步：创建 Supabase 项目

1. 访问 [supabase.com](https://supabase.com)
2. 注册账号（免费）
3. 点击 "New Project"
4. 填写项目信息：
   - Project Name: `psychology-training`
   - Database Password: (设置一个强密码，请保存好)
   - Region: 选择距离你最近的区域
5. 等待项目创建完成（约 2 分钟）

## 第二步：获取 API 凭证

1. 在项目仪表板中，点击左侧 **Settings** → **API**
2. 复制以下信息：
   - Project URL: `https://xxx.supabase.co`
   - anon/public key: `eyJhbGc...`

## 第三步：执行建表语句

1. 在项目仪表板中，点击左侧 **SQL Editor**
2. 点击 "New query"
3. 复制 `schema.sql` 文件的内容
4. 粘贴到编辑器中
5. 点击 **Run** 按钮执行

## 第四步：配置环境变量

在项目根目录创建 `.env` 文件：

```bash
# Supabase 配置
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# Dify API 配置（保持原有配置）
VITE_DIFY_VISITOR_API_URL=https://gateway.lingxinai.com/dify-test/v1
VITE_DIFY_VISITOR_API_KEY=app-2HjDhAbbHNl8N4T2Rcs2C25s
VITE_DIFY_SUPERVISOR_API_URL=https://gateway.lingxinai.com/dify-test/v1
VITE_DIFY_SUPERVISOR_API_KEY=app-3NPjpb7nkYhFAYtXpFvOShv6
VITE_DIFY_API_OVERALL_URL=https://gateway.lingxinai.com/dify-test/v1
VITE_DIFY_API_OVERALL_KEY=
```

## 第五步：安装依赖

```bash
npm install @supabase/supabase-js
```

## 第六步：启动开发服务器

```bash
npm run dev
```

## 验证设置

登录系统后，完成一次练习，检查 Supabase 数据库：

1. 在 Supabase 仪表板，点击 **Table Editor**
2. 查看 `practice_sessions` 表是否有新记录
3. 查看 `turn_evaluations` 表是否有督导记录

---

## 数据库结构说明

### practice_sessions (练习记录表)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| user_id | UUID | 用户 ID |
| scenario_name | string | 场景名称 |
| total_score | number | 综合得分 (0-10) |
| turns_count | number | 对话轮次 |
| competency_scores | JSON | 胜任力维度 |
| overall_evaluation | JSON | 综合评价 |
| chart_data | JSON | 图表数据 |
| created_at | timestamp | 创建时间 |

### turn_evaluations (督导记录表)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| session_id | UUID | 关联练习记录 |
| turn_number | number | 轮次 |
| score | number | 得分 (0-10) |
| counselor_message | text | 咨询师回复 |
| visitor_message | text | 来访者消息 |
| evaluation | JSON | 督导评价 |
| created_at | timestamp | 创建时间 |

---

## 安全策略 (RLS)

已启用行级安全策略，确保：
- ✅ 用户只能访问自己的数据
- ✅ 用户无法修改他人记录
- ✅ 删除用户时自动删除相关记录

---

## 故障排查

### 问题：保存数据失败
**解决方案**：
1. 检查 `.env` 文件配置是否正确
2. 确认 Supabase 项目已启动
3. 检查浏览器控制台错误信息

### 问题：登录失败
**解决方案**：
1. 在 Supabase 仪表板 → Authentication → Users
2. 确认用户是否已创建
3. 检查邮箱是否已验证

### 问题：无法查看历史记录
**解决方案**：
1. 在 SQL Editor 中运行：`\d turn_evaluations`
2. 确认 RLS 策略已启用：`SELECT * FROM pg_policies;`
