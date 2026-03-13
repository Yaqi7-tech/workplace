-- ============================================
-- 心理咨询师培训系统 - 数据库建表语句
-- ============================================

-- 1. 练习记录表
CREATE TABLE IF NOT EXISTS practice_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scenario_name VARCHAR(255) NOT NULL,
  total_score DECIMAL(3,1) NOT NULL CHECK (total_score >= 0 AND total_score <= 10),
  turns_count INTEGER NOT NULL DEFAULT 0,
  competency_scores JSONB NOT NULL DEFAULT '{}',
  overall_evaluation JSONB,
  chart_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- 添加索引用于快速查询
  CONSTRAINT practice_sessions_user_fkey FOREIGN KEY (user_id)
    REFERENCES auth.users(id)
    ON DELETE CASCADE
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_practice_sessions_user_id ON practice_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_practice_sessions_created_at ON practice_sessions(created_at DESC);

-- 2. 每轮督导记录表
CREATE TABLE IF NOT EXISTS turn_evaluations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES practice_sessions(id) ON DELETE CASCADE,
  turn_number INTEGER NOT NULL,
  score DECIMAL(3,1) NOT NULL CHECK (score >= 0 AND score <= 10),
  counselor_message TEXT NOT NULL,
  visitor_message TEXT NOT NULL,
  evaluation JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- 确保每个会话的每个轮次只有一条记录
  UNIQUE(session_id, turn_number),

  -- 添加外键约束
  CONSTRAINT turn_evaluations_session_fkey FOREIGN KEY (session_id)
    REFERENCES practice_sessions(id)
    ON DELETE CASCADE
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_turn_evaluations_session_id ON turn_evaluations(session_id);
CREATE INDEX IF NOT EXISTS idx_turn_evaluations_turn_number ON turn_evaluations(turn_number);

-- ============================================
-- 启用行级安全策略 (RLS)
-- ============================================

-- 启用 RLS
ALTER TABLE practice_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE turn_evaluations ENABLE ROW LEVEL SECURITY;

-- 练习记录表的安全策略
-- 用户只能查看自己的记录
CREATE POLICY "用户可以查看自己的练习记录"
  ON practice_sessions FOR SELECT
  USING (auth.uid() = user_id);

-- 用户只能插入自己的记录
CREATE POLICY "用户可以插入自己的练习记录"
  ON practice_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 用户只能更新自己的记录
CREATE POLICY "用户可以更新自己的练习记录"
  ON practice_sessions FOR UPDATE
  USING (auth.uid() = user_id);

-- 用户只能删除自己的记录
CREATE POLICY "用户可以删除自己的练习记录"
  ON practice_sessions FOR DELETE
  USING (auth.uid() = user_id);

-- 每轮督导记录表的安全策略
-- 用户只能查看自己会话的督导记录
CREATE POLICY "用户可以查看自己会话的督导记录"
  ON turn_evaluations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM practice_sessions
      WHERE practice_sessions.id = turn_evaluations.session_id
      AND practice_sessions.user_id = auth.uid()
    )
  );

-- 用户可以插入自己会话的督导记录
CREATE POLICY "用户可以插入自己会话的督导记录"
  ON turn_evaluations FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM practice_sessions
      WHERE practice_sessions.id = turn_evaluations.session_id
      AND practice_sessions.user_id = auth.uid()
    )
  );

-- ============================================
-- 创建辅助视图（用于统计分析）
-- ============================================

-- 用户统计视图
CREATE OR REPLACE VIEW user_stats AS
SELECT
  user_id,
  COUNT(*) as total_sessions,
  SUM(turns_count) as total_turns,
  AVG(total_score) as avg_score,
  MAX(total_score) as max_score,
  MIN(total_score) as min_score,
  MAX(created_at) as last_practice_date
FROM practice_sessions
GROUP BY user_id;

-- ============================================
-- 触发器：自动更新 updated_at 字段（可选）
-- ============================================

-- 如果需要 updated_at 字段，可以取消注释以下代码
/*
ALTER TABLE practice_sessions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_practice_sessions_updated_at
  BEFORE UPDATE ON practice_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
*/

-- ============================================
-- 完成！
-- ============================================

-- 验证表结构（使用 SQL 查询）
SELECT
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name IN ('practice_sessions', 'turn_evaluations')
ORDER BY table_name, ordinal_position;

-- 查看安全策略
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename IN ('practice_sessions', 'turn_evaluations');
