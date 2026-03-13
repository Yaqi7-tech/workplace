import { useState } from 'react';
import { LoginPage } from '@/app/components/LoginPage';
import { ScenarioSelection } from '@/app/components/ScenarioSelection';
import { ChatInterface } from '@/app/components/ChatInterface';
import { EvaluationReport } from '@/app/components/EvaluationReport';
import { ProgressAnalysis } from '@/app/components/ProgressAnalysis';
import { difyApiService } from '@/app/services/api';
import { supabase } from '@/lib/supabase';
import type { Scenario } from '@/app/components/ScenarioSelection';
import type { OverallEvaluation } from '@/app/services/api';
import type { CompetencyScores } from '@/app/services/api';
import type { ChartData } from '@/app/services/api';

// 每轮对话记录
interface SessionTurnRecord {
  turn: number;
  counselorMessage: string;
  visitorMessage: string;
  evaluation: any;
  score: number;
  feedback: string;
  competencyScores?: CompetencyScores;
}

type AppState = 'login' | 'scenario-selection' | 'chat' | 'report' | 'progress';

export default function App() {
  const [appState, setAppState] = useState<AppState>('login');
  const [userId, setUserId] = useState<string | null>(null);
  const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(null);
  const [overallEvaluation, setOverallEvaluation] = useState<OverallEvaluation | null>(null);
  const [competencyScores, setCompetencyScores] = useState<CompetencyScores>({});
  const [conversationTurns, setConversationTurns] = useState(0);
  const [sessionTurnRecords, setSessionTurnRecords] = useState<SessionTurnRecord[]>([]);
  const [allChartData, setAllChartData] = useState<ChartData | null>(null);
  const [chatSessionKey, setChatSessionKey] = useState(0);  // 用于强制重置ChatInterface

  const handleLogin = (userId?: string) => {
    if (userId) {
      setUserId(userId);
    }
    setAppState('scenario-selection');
  };

  const handleLogout = () => {
    setAppState('login');
    setSelectedScenario(null);
    setUserId(null);
  };

  const handleSelectScenario = (scenario: Scenario) => {
    setSelectedScenario(scenario);
    setAppState('chat');
  };

  const handleBackToScenarios = () => {
    setSelectedScenario(null);
    setAppState('scenario-selection');
  };

  const handleViewProgress = () => {
    setAppState('progress');
  };

  const handleFinishPractice = async (
    evaluation?: OverallEvaluation,
    scores?: CompetencyScores,
    turns?: number,
    records?: SessionTurnRecord[],
    chartData?: ChartData | null,
    messages?: any[]
  ) => {
    if (evaluation) setOverallEvaluation(evaluation);
    if (scores) setCompetencyScores(scores);
    if (turns) setConversationTurns(turns);
    if (records) setSessionTurnRecords(records);
    if (chartData) setAllChartData(chartData);
    // 存储消息历史（可选，用于导出）
    if (messages) (window as any).sessionMessages = messages;

    // 保存到数据库
    if (userId && selectedScenario && scores) {
      try {
        // 如果有综合评价使用综合得分，否则计算胜任力平均分
        const scoreValues = Object.values(scores).filter(v => v !== undefined && v !== null);
        const avgScore = scoreValues.length > 0
          ? scoreValues.reduce((sum, val) => sum + val, 0) / scoreValues.length
          : 5; // 默认分数

        const totalScore = evaluation?.structured_output?.综合得分 || avgScore;

        console.log('准备保存数据:', { userId, totalScore, turns, hasEvaluation: !!evaluation, scoreCount: scoreValues.length });

        // 保存练习记录
        const { data: sessionData, error: sessionError } = await supabase
          .from('practice_sessions')
          .insert({
            user_id: userId,
            scenario_name: selectedScenario.title,
            total_score: totalScore,
            turns_count: turns || 0,
            competency_scores: scores,
            overall_evaluation: evaluation || null,
            chart_data: chartData || null,
          })
          .select('id')
          .single();

        if (sessionError) {
          console.error('保存练习记录失败:', sessionError);
        } else if (sessionData && records) {
          // 保存每轮督导记录
          const turnRecordsToInsert = records.map((record) => ({
            session_id: sessionData.id,
            turn_number: record.turn,
            score: record.score,
            counselor_message: record.counselorMessage,
            visitor_message: record.visitorMessage,
            evaluation: record.evaluation,
            competency_scores: record.competencyScores || null,
          }));

          const { error: turnsError } = await supabase
            .from('turn_evaluations')
            .insert(turnRecordsToInsert);

          if (turnsError) {
            console.error('保存督导记录失败:', turnsError);
          } else {
            console.log('数据保存成功');
          }
        }
      } catch (error) {
        console.error('保存数据时出错:', error);
      }
    }

    setAppState('report');
  };

  const handleStartNew = () => {
    // 保留当前场景，重置数据，开始新对话
    setOverallEvaluation(null);
    setCompetencyScores({});
    setConversationTurns(0);
    setSessionTurnRecords([]);
    setAllChartData(null);
    // 清空消息历史
    (window as any).sessionMessages = [];
    // 重置API服务中的对话状态
    difyApiService.resetConversations();
    // 递增key以强制重新创建ChatInterface组件
    setChatSessionKey(prev => prev + 1);
    setAppState('chat');
  };

  return (
    <div className="size-full">
      {appState === 'login' && (
        <LoginPage onLogin={handleLogin} />
      )}

      {appState === 'scenario-selection' && (
        <ScenarioSelection
          onSelectScenario={handleSelectScenario}
          onLogout={handleLogout}
          onViewProgress={userId ? handleViewProgress : undefined}
        />
      )}

      {appState === 'chat' && selectedScenario && (
        <ChatInterface
          key={chatSessionKey}
          scenario={selectedScenario}
          onBack={handleBackToScenarios}
          onFinish={handleFinishPractice}
        />
      )}

      {appState === 'report' && selectedScenario && (
        <EvaluationReport
          scenarioName={selectedScenario.title}
          overallEvaluation={overallEvaluation}
          competencyScores={competencyScores}
          conversationTurns={conversationTurns}
          sessionTurnRecords={sessionTurnRecords}
          allChartData={allChartData}
          onStartNew={handleStartNew}
          onBackToScenarios={handleBackToScenarios}
        />
      )}

      {appState === 'progress' && userId && (
        <ProgressAnalysis
          userId={userId}
          onBack={handleBackToScenarios}
        />
      )}
    </div>
  );
}
