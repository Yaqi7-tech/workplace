import { useState } from 'react';
import { ArrowLeft, Download, MessageSquare, Star, TrendingUp } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import {
  SCENARIO_CARDS,
  PERSONA_CARDS,
  THEME_COLORS,
  type ScenarioType,
  type PersonaType
} from '@/app/config/workplaceScenarios';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface WorkplaceReportProps {
  messages: Message[];
  metadata: {
    scenarioType: ScenarioType;
    personaType: PersonaType;
    scenarioTitle: string;
    personaTitle: string;
    turnCount: number;
    startedAt?: Date;
    finishedAt?: Date;
  };
  onBackToSelection: () => void;
  onRestart: () => void;
}

export function WorkplaceReport({
  messages,
  metadata,
  onBackToSelection,
  onRestart
}: WorkplaceReportProps) {
  const [selectedRating, setSelectedRating] = useState(0);
  const [selfReflection, setSelfReflection] = useState('');
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const scenario = SCENARIO_CARDS[metadata.scenarioType];
  const persona = PERSONA_CARDS[metadata.personaType];

  // 计算对话时长
  const duration = metadata.startedAt && metadata.finishedAt
    ? Math.round((metadata.finishedAt.getTime() - metadata.startedAt.getTime()) / 1000 / 60)
    : 0;

  // 导出对话记录
  const handleExport = () => {
    const exportData = {
      scenario: metadata.scenarioTitle,
      persona: metadata.personaTitle,
      duration: `${duration} 分钟`,
      turnCount: metadata.turnCount,
      timestamp: new Date().toISOString(),
      messages: messages.map(m => ({
        role: m.role === 'user' ? '学员' : '带教老师',
        content: m.content,
        time: m.timestamp.toLocaleString('zh-CN')
      })),
      selfRating: selectedRating,
      selfReflection: selfReflection
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `职场训练_${metadata.scenarioTitle}_${new Date().toLocaleDateString('zh-CN')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // 提交自我评估
  const handleSubmitReflection = () => {
    if (selectedRating === 0) {
      alert('请先选择评分');
      return;
    }
    setHasSubmitted(true);
  };

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, rgb(254,254,250), rgb(254,253,249), rgb(254,254,250))' }}>
      {/* Header */}
      <div className="bg-white border-b-2">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between" style={{ borderColor: 'rgba(60,155,201,0.15)' }}>
          <Button
            variant="ghost"
            onClick={onBackToSelection}
            className="hover:bg-[rgb(60,155,201,0.1)]"
          >
            <ArrowLeft className="w-4 h-4 mr-2" style={{ color: THEME_COLORS.blue }} />
            返回场景选择
          </Button>
          <h2 className="text-lg font-semibold text-[rgb(45,45,45)]">
            训练报告
          </h2>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleExport}
              className="border-[rgb(60,155,201,0.3)] hover:bg-[rgb(60,155,201,0.1)]"
              style={{ color: THEME_COLORS.blue }}
            >
              <Download className="w-4 h-4 mr-2" />
              导出记录
            </Button>
            <Button
              onClick={onRestart}
              className="text-white hover:opacity-90"
              style={{ backgroundColor: THEME_COLORS.blue }}
            >
              再次训练
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左侧：对话记录 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 训练概览 */}
            <div className="bg-white rounded-2xl border-2 p-6" style={{ borderColor: 'rgba(60,155,201,0.15)' }}>
              <div className="flex items-center gap-3 mb-6">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                  style={{ backgroundColor: scenario.color + '33' }}
                >
                  {scenario.icon}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-[rgb(45,45,45)]">{metadata.scenarioTitle}</h3>
                  <p className="text-sm text-[rgb(122,122,122)]">与 {persona.icon} {metadata.personaTitle} 的对话</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 rounded-xl" style={{ backgroundColor: 'rgb(254,254,250)' }}>
                  <MessageSquare className="w-5 h-5 mx-auto mb-2" style={{ color: THEME_COLORS.cyan }} />
                  <p className="text-2xl font-bold text-[rgb(45,45,45)]">{metadata.turnCount}</p>
                  <p className="text-xs text-[rgb(122,122,122)]">对话轮次</p>
                </div>
                <div className="text-center p-4 rounded-xl" style={{ backgroundColor: 'rgb(254,254,250)' }}>
                  <TrendingUp className="w-5 h-5 mx-auto mb-2" style={{ color: THEME_COLORS.cyan }} />
                  <p className="text-2xl font-bold text-[rgb(45,45,45)]">{duration}</p>
                  <p className="text-xs text-[rgb(122,122,122)]">训练时长(分钟)</p>
                </div>
                <div className="text-center p-4 rounded-xl" style={{ backgroundColor: 'rgb(254,254,250)' }}>
                  <Star className="w-5 h-5 mx-auto mb-2" style={{ color: THEME_COLORS.orange }} />
                  <p className="text-2xl font-bold text-[rgb(45,45,45)]">{selectedRating || '-'}</p>
                  <p className="text-xs text-[rgb(122,122,122)]">自我评分</p>
                </div>
              </div>
            </div>

            {/* 对话历史 */}
            <div className="bg-white rounded-2xl border-2 overflow-hidden" style={{ borderColor: 'rgba(60,155,201,0.15)' }}>
              <div className="px-6 py-4 border-b-2" style={{ backgroundColor: 'rgb(254,254,250)', borderColor: 'rgba(60,155,201,0.1)' }}>
                <h3 className="font-semibold text-[rgb(45,45,45)]">对话记录</h3>
              </div>
              <div className="max-h-[600px] overflow-y-auto p-6 space-y-4">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-lg rounded-2xl px-5 py-3 ${
                      message.role === 'user'
                        ? 'text-white'
                        : 'text-[rgb(45,45,45)]'
                    }`}
                    style={message.role === 'user' ? { backgroundColor: THEME_COLORS.blue } : { backgroundColor: 'rgb(254,254,250)' }}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-medium opacity-70">
                          {message.role === 'user' ? '👤 你' : `${persona.icon} ${persona.name}`}
                        </span>
                        <span className="text-xs opacity-50">
                          {message.timestamp.toLocaleTimeString('zh-CN', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
                        {message.content}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 右侧：自我评估 */}
          <div className="space-y-6">
            {/* 自我评分 */}
            <div className="bg-white rounded-2xl border-2 p-6" style={{ borderColor: 'rgba(60,155,201,0.15)' }}>
              <h3 className="font-semibold text-[rgb(45,45,45)] mb-4 flex items-center gap-2">
                <Star className="w-5 h-5" style={{ color: THEME_COLORS.orange }} />
                自我评分
              </h3>
              <p className="text-sm text-[rgb(122,122,122)] mb-4">
                请为这次训练表现打分（1-10分）
              </p>
              <div className="flex flex-wrap gap-2 mb-4">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => (
                  <button
                    key={score}
                    onClick={() => setSelectedRating(score)}
                    disabled={hasSubmitted}
                    className={`w-10 h-10 rounded-lg font-medium transition-all ${
                      selectedRating === score
                        ? 'text-white'
                        : 'hover:opacity-80'
                    } ${hasSubmitted ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                    style={{
                      backgroundColor: selectedRating === score ? THEME_COLORS.blue : 'rgb(254,254,250)',
                      color: selectedRating === score ? 'white' : 'rgb(45,45,45)'
                    }}
                  >
                    {score}
                  </button>
                ))}
              </div>
              {selectedRating > 0 && !hasSubmitted && (
                <p className="text-sm" style={{ color: THEME_COLORS.blue }}>
                  你选择了 {selectedRating} 分
                </p>
              )}
            </div>

            {/* 自我反思 */}
            <div className="bg-white rounded-2xl border-2 p-6" style={{ borderColor: 'rgba(60,155,201,0.15)' }}>
              <h3 className="font-semibold text-[rgb(45,45,45)] mb-4">自我反思</h3>
              <p className="text-sm text-[rgb(122,122,122)] mb-4">
                回顾这次对话，你觉得哪些地方做得好？哪些地方可以改进？
              </p>
              <textarea
                value={selfReflection}
                onChange={(e) => setSelfReflection(e.target.value)}
                placeholder="写下你的反思..."
                className="w-full min-h-[150px] px-4 py-3 rounded-xl border-2 outline-none resize-none text-sm transition-colors"
                style={{ borderColor: 'rgba(60,155,201,0.2)', backgroundColor: 'rgb(254,254,250)' }}
                disabled={hasSubmitted}
              />
              {!hasSubmitted ? (
                <Button
                  className="w-full mt-4 text-white hover:opacity-90"
                  style={{ backgroundColor: THEME_COLORS.blue }}
                  onClick={handleSubmitReflection}
                >
                  提交评估
                </Button>
              ) : (
                <div className="mt-4 p-4 rounded-xl border-2 text-center" style={{ backgroundColor: 'rgb(176,214,169,0.3)', borderColor: 'rgb(176,214,169)' }}>
                  <p className="text-sm font-medium" style={{ color: 'rgb(60,155,201)' }}>✓ 评估已提交</p>
                </div>
              )}
            </div>

            {/* 人设回顾 */}
            <div className="bg-white rounded-2xl border-2 p-6" style={{ borderColor: 'rgba(60,155,201,0.15)' }}>
              <h3 className="font-semibold text-[rgb(45,45,45)] mb-4">人设回顾</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-[rgb(122,122,122)] mb-1">特征</p>
                  <p className="text-[rgb(45,45,45)]">{persona.characteristics}</p>
                </div>
                <div>
                  <p className="text-[rgb(122,122,122)] mb-1">口头禅</p>
                  <p className="text-[rgb(45,45,45)] italic">{persona.catchphrase}</p>
                </div>
              </div>
            </div>

            {/* 改进建议 */}
            <div className="rounded-2xl border-2 p-6" style={{ background: 'linear-gradient(135deg, rgba(60,155,201,0.1), rgba(101,189,186,0.1))', borderColor: 'rgba(60,155,201,0.2)' }}>
              <h3 className="font-semibold mb-3" style={{ color: THEME_COLORS.blue }}>💡 练习建议</h3>
              <ul className="text-sm space-y-2" style={{ color: THEME_COLORS.blue }}>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5">•</span>
                  <span>尝试不同的人设组合，体验多样的职场沟通风格</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5">•</span>
                  <span>在反思中记录关键的学习点</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5">•</span>
                  <span>多次练习同一场景，观察自己的进步</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5">•</span>
                  <span>将训练中学到的技巧应用到实际工作中</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
