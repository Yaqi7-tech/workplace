# Supabase 数据库集成 - 实施总结

## ✅ 已完��的工作

### 1. 核心文件创建

| 文件 | 说明 |
|------|------|
| `guidelines/src/lib/supabase.ts` | Supabase 客户端配置和类型定义 |
| `supabase/schema.sql` | 数据库建表 SQL 脚本 |
| `supabase/README.md` | 详细的设置指南 |
| `guidelines/src/app/components/ProgressAnalysis.tsx` | 个人进步分析页面 |
| `.env.example` | 环境变量配置示例 |

### 2. 组件更新

| 组件 | 更新内容 |
|------|----------|
| `LoginPage.tsx` | 集成 Supabase Auth，支持注册/登录，兼容模拟模式 |
| `App.tsx` | 添加用户ID管理，自动保存练习记录到数据库 |
| `ScenarioSelection.tsx` | 添加"查看进步分析"按钮入口 |

### 3. 数据库结构

#### practice_sessions (练习记录表)
```sql
- id: UUID (主键)
- user_id: UUID (用户ID)
- scenario_name: string (场景名称)
- total_score: number (综合得分 0-10)
- turns_count: number (对话轮次)
- competency_scores: JSON (胜任力维度)
- overall_evaluation: JSON (综合评价)
- chart_data: JSON (图表数据)
- created_at: timestamp (创建时间)
```

#### turn_evaluations (督导记录表)
```sql
- id: UUID (主键)
- session_id: UUID (关联练习记录)
- turn_number: number (轮次)
- score: number (得分 0-10)
- counselor_message: text (咨询师回复)
- visitor_message: text (来访者消息)
- evaluation: JSON (督导评价)
- created_at: timestamp (创建时间)
```

### 4. 安全策略

✅ 启用行级安全策略 (RLS)
✅ 用户只能访问自己的数据
✅ 用户无法修改他人记录
✅ 删除用户时自动删除相关记录

---

## 🚀 功能实现

### 个人进步分析页面

包含以下功能模块：

1. **统计卡片**
   - 练习次数
   - 对话轮次
   - 平均得分
   - 最高得分

2. **综合得分趋势图**
   - 折线图显示每次练习的得分变化
   - 显示练习日期

3. **胜任力雷达图对比**
   - 首次 vs 最新
   - 最新 vs 平均水平

4. **历史记录列表**
   - 显示所有练习记录
   - 点击查看详情

---

## 📝 使用步骤

### 开发环境设置

1. **安装依赖**
   ```bash
   npm install
   ```

2. **配置环境变量**
   ```bash
   # 复制示例文件
   cp .env.example .env

   # 编辑 .env 文件，填入你的 Supabase 凭证
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```

3. **创建 Supabase 项目**
   - 访问 https://supabase.com
   - 创建新项目
   - 在 SQL Editor 中执行 `supabase/schema.sql`

4. **启动开发服务器**
   ```bash
   npm run dev
   ```

### 生产部署

1. 在 Vercel/Netlify 等平台设置环境变量
2. 部署 `api/dify.js` 代理函数
3. 构建并部署前端

---

## 🔄 数据流程

```
用户登录
    ↓
选择场景 → 点击"查看进步分析" (可选)
    ↓               ↓
进行对话练习    显示进步分析
    ↓
完成练习 → 自动保存到数据库
    ↓
查看评价报告
```

---

## 🛡️ 兼容性

### 模拟模式（未配置 Supabase）
- ✅ 系统可正常运行
- ✅ 使用模拟登录
- ⚠️ 数据不保存到数据库
- ⚠️ 无法查看进步分析

### 数据库模式（已配置 Supabase）
- ✅ 真实用户注册/登录
- ✅ 自动保存所有练习记录
- ✅ 可查看完整的进步分析

---

## 📊 数据分析能力

### 可实现的查询

1. **个人进步趋势**
   ```sql
   SELECT created_at, total_score
   FROM practice_sessions
   WHERE user_id = ?
   ORDER BY created_at
   ```

2. **胜任力平均值**
   ```sql
   SELECT
     AVG(compentency_scores->>'Professionalism') as avg_professionalism,
     AVG(compentency_scores->>'Relational') as avg_relational
   FROM practice_sessions
   WHERE user_id = ?
   ```

3. **最高分记录**
   ```sql
   SELECT *
   FROM practice_sessions
   WHERE user_id = ?
   ORDER BY total_score DESC
   LIMIT 1
   ```

---

## 🔧 故障排查

### 问题：登录后看不到"查看进步分析"按钮
**原因**：未配置 Supabase 或登录失败
**解决**：
1. 检查 `.env` 文件配置
2. 打开浏览器控制台查看错误
3. 确认 Supabase 项目正常运行

### 问题：练习完成后数据未保存
**原因**：userId 为空或数据库连接失败
**解决**：
1. 确认已成功登录
2. 检查 Supabase RLS 策略
3. 查看控制台错误日志

### 问题：进步分析页面无数据
**原因**：没有保存过练习记录
**解决**：
1. 完成至少一次练习
2. 检查数据库 `practice_sessions` 表
3. 确认当前用户ID匹配

---

## 📚 相关文件

```
training/
├── guidelines/src/
│   ├── lib/
│   │   └── supabase.ts              # Supabase 配置
│   └── app/
│       ├── App.tsx                   # 主应用（已更新）
│       └── components/
│           ├── LoginPage.tsx         # 登录页（已更新）
│           ├── ScenarioSelection.tsx # 场景选择（已更新）
│           └── ProgressAnalysis.tsx  # 进步分析（新建）
├── supabase/
│   ├── schema.sql                    # 建表 SQL
│   └── README.md                     # 设置指南
├── package.json                      # 添加了 @supabase/supabase-js
└── .env.example                      # 环境变量示例
```

---

## 🎯 下一步优化建议

1. **数据导出功能**
   - 导出 CSV 格式
   - 生成 PDF 报告

2. **更多分析维度**
   - 按场景分类统计
   - 同比/环比分析
   - 薄弱项识别

3. **社交功能（可选）**
   - 排行榜
   - 成就系统
   - 分享功能

4. **性能优化**
   - 添加数据缓存
   - 实现分页加载
   - 优化图表渲染
