-- ============================================
-- 社交培训系统 - 独立数据库建表语句
-- 与心理咨询师培训系统完全隔离
-- ============================================

-- ============================================
-- 1. 社交培训会话表
-- ============================================
CREATE TABLE IF NOT EXISTS social_training_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scenario_name VARCHAR(255) NOT NULL,
  scenario_type VARCHAR(50) NOT NULL, -- 场景类型：求职面试、商务谈判、约会社交、公开演讲等
  difficulty_level VARCHAR(20) DEFAULT 'medium', -- 难度：easy, medium, hard
  total_score DECIMAL(3,1) NOT NULL CHECK (total_score >= 0 AND total_score <= 10),
  turns_count INTEGER NOT NULL DEFAULT 0,
  dimension_scores JSONB NOT NULL DEFAULT '{}', -- 各维度评分：沟通能力、情商表达、说服力、应变能力等
  overall_feedback JSONB,
  chart_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_social_training_sessions_user_id ON social_training_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_social_training_sessions_scenario_type ON social_training_sessions(scenario_type);
CREATE INDEX IF NOT EXISTS idx_social_training_sessions_created_at ON social_training_sessions(created_at DESC);

-- ============================================
-- 2. 社交培训对话轮次表
-- ============================================
CREATE TABLE IF NOT EXISTS social_training_turns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES social_training_sessions(id) ON DELETE CASCADE,
  turn_number INTEGER NOT NULL,
  score DECIMAL(3,1) NOT NULL CHECK (score >= 0 AND score_score <= 10),
  user_message TEXT NOT NULL,
  ai_message TEXT NOT NULL,
  evaluation JSONB NOT NULL,
  suggestions TEXT[], -- 改进建议列表
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- 确保每个会话的每个轮次只有一条记录
  UNIQUE(session_id, turn_number)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_social_training_turns_session_id ON social_training_turns(session_id);
CREATE INDEX IF NOT EXISTS idx_social_training_turns_turn_number ON social_training_turns(turn_number);

-- ============================================
-- 3. 社交场景模板表
-- ============================================
CREATE TABLE IF NOT EXISTS social_scenarios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  type VARCHAR(50) NOT NULL,
  description TEXT NOT NULL,
  difficulty VARCHAR(20) DEFAULT 'medium',
  ai_persona JSONB NOT NULL, -- AI角色设定
  evaluation_criteria JSONB NOT NULL, -- 评分标准
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_social_scenarios_type ON social_scenarios(type);
CREATE INDEX IF NOT EXISTS idx_social_scenarios_active ON social_scenarios(is_active);

-- ============================================
-- 4. 用户学习进度表
-- ============================================
CREATE TABLE IF NOT EXISTS social_user_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  total_sessions INTEGER DEFAULT 0,
  completed_scenarios TEXT[] DEFAULT '{}', -- 已完成的场景类型
  average_score DECIMAL(3,1),
  best_score DECIMAL(3,1),
  current_level VARCHAR(20) DEFAULT 'beginner', -- beginner, intermediate, advanced
  achievements JSONB DEFAULT '{}', -- 成就徽章等
  last_practice_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_social_user_progress_user_id ON social_user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_social_user_progress_level ON social_user_progress(current_level);

-- ============================================
-- 启用行级安全策略 (RLS)
-- ============================================

ALTER TABLE social_training_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_training_turns ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_user_progress ENABLE ROW LEVEL SECURITY;
-- 场景表不需要RLS，所有认证用户都可以读取

-- ============================================
-- 安全策略：社交培训会话
-- ============================================

CREATE POLICY "用户可以查看自己的社交培训记录"
  ON social_training_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "用户可以插入自己的社交培训记录"
  ON social_training_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "用户可以更新自己的社交培训记录"
  ON social_training_sessions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "用户可以删除自己的社交培训记录"
  ON social_training_sessions FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- 安全策略：社交培训对话轮次
-- ============================================

CREATE POLICY "用户可以查看自己会话的对话轮次"
  ON social_training_turns FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM social_training_sessions
      WHERE social_training_sessions.id = social_training_turns.session_id
      AND social_training_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "用户可以插入自己会话的对话轮次"
  ON social_training_turns FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM social_training_sessions
      WHERE social_training_sessions.id = social_training_turns.session_id
      AND social_training_sessions.user_id = auth.uid()
    )
  );

-- ============================================
-- 安全策略：用户学习进度
-- ============================================

CREATE POLICY "用户可以查看自己的学习进度"
  ON social_user_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "用户可以插入自己的学习进度"
  ON social_user_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "用户可以更新自己的学习进度"
  ON social_user_progress FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================
-- 安全策略：社交场景（所有认证用户可读）
-- ============================================

ALTER TABLE social_scenarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "所有认证用户可以查看活跃场景"
  ON social_scenarios FOR SELECT
  USING (is_active = true AND auth.role() = 'authenticated');

-- ============================================
-- 辅助视图：用户统计
-- ============================================

CREATE OR REPLACE VIEW social_training_user_stats AS
SELECT
  sts.user_id,
  COUNT(*) as total_sessions,
  SUM(sts.turns_count) as total_turns,
  AVG(sts.total_score) as avg_score,
  MAX(sts.total_score) as max_score,
  STRING_AGG(DISTINCT sts.scenario_type, ', ') as practiced_scenarios,
  MAX(sts.created_at) as last_practice_date
FROM social_training_sessions sts
GROUP BY sts.user_id;

-- ============================================
-- 辅助视图：场景统计
-- ============================================

CREATE OR REPLACE VIEW social_scenario_stats AS
SELECT
  scenario_type,
  COUNT(*) as total_sessions,
  AVG(total_score) as avg_score,
  AVG(turns_count) as avg_turns,
  COUNT(DISTINCT user_id) as unique_users
FROM social_training_sessions
GROUP BY scenario_type;

-- ============================================
-- 触发器：自动更新进度表的 updated_at
-- ============================================

CREATE OR REPLACE FUNCTION update_social_progress_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_social_user_progress_updated_at
  BEFORE UPDATE ON social_user_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_social_progress_updated_at();

CREATE OR REPLACE FUNCTION update_social_scenario_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_social_scenarios_updated_at
  BEFORE UPDATE ON social_scenarios
  FOR EACH ROW
  EXECUTE FUNCTION update_social_scenario_updated_at();

-- ============================================
-- 初始化默认场景数据（可选）
-- ============================================

INSERT INTO social_scenarios (name, type, description, difficulty, ai_persona, evaluation_criteria) VALUES
  ('求职面试 - 产品经理', 'interview', '模拟产品经理岗位面试场景，包含自我介绍、项目经历、问题回答等环节', 'medium',
   '{"role": "面试官", "style": "专业严谨", "focus": ["技术能力", "产品思维", "沟通表达"]}',
   '{"dimensions": ["专业能力", "逻辑思维", "沟通表达", "应变能力"], "weights": [0.3, 0.25, 0.25, 0.2]}'),

  ('商务谈判 - 合作协议', 'negotiation', '模拟商务谈判场景，讨论合作条款、利益分配、风险控制', 'hard',
   '{"role": "合作方代表", "style": "精明务实", "focus": ["商业价值", "风险控制", "双赢思维"]}',
   '{"dimensions": ["说服力", "谈判技巧", "商业思维", "情绪控制"], "weights": [0.3, 0.3, 0.25, 0.15]}'),

  ('约会社交 - 初次约会', 'dating', '模拟初次约会场景，练习破冰、话题展开、氛围营造', 'easy',
   '{"role": "约会对象", "style": "友善开放", "focus": ["真诚", "幽默", "倾听"]}',
   '{"dimensions": ["亲和力", "幽默感", "倾听能力", "话题掌控"], "weights": [0.3, 0.2, 0.25, 0.25]}'),

  ('公开演讲 - 项目路演', 'presentation', '模拟项目路演场景，向投资人/领导展示方案', 'hard',
   '{"role": "听众/投资人", "style": "专业挑剔", "focus": ["价值主张", "可行性和", "回报"]}',
   '{"dimensions": ["表达能力", "逻辑结构", "感染力", "问答应对"], "weights": [0.3, 0.25, 0.25, 0.2]}')
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- 验证表结构
-- ============================================

SELECT
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name LIKE 'social_%'
ORDER BY table_name, ordinal_position;

-- 查看安全策略
SELECT
    tablename,
    policyname,
    cmd
FROM pg_policies
WHERE tablename LIKE 'social_%';
