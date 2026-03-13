import { useState } from 'react';
import { ArrowLeft, Download, Share2, MessageSquare, Star, TrendingUp } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { SCENARIO_CARDS, PERSONA_CARDS, type ScenarioType, type PersonaType } from '@/app/config/workplaceScenarios';

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

  // 提取用户消息
  const userMessages = messages.filter(m => m.role === 'user');
  const assistantMessages = messages.filter(m => m.role === 'assistant');

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
    // 这里可以将评估数据保存到数据库
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={onBackToSelection}
            className="hover:bg-slate-100"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回场景选择
          </Button>
          <h2 className="text-lg font-semibold text-slate-900">
            训练报告
          </h2>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleExport}
              className="border-slate-200"
            >
              <Download className="w-4 h-4 mr-2" />
              导出记录
            </Button>
            <Button
              onClick={onRestart}
              className="bg-blue-600 hover:bg-blue-700"
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
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-2xl">
                  {scenario.icon}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">{metadata.scenarioTitle}</h3>
                  <p className="text-sm text-slate-500">与 {persona.icon} {metadata.personaTitle} 的对话</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-slate-50 rounded-xl">
                  <MessageSquare className="w-5 h-5 text-slate-400 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-slate-900">{metadata.turnCount}</p>
                  <p className="text-xs text-slate-500">对话轮次</p>
                </div>
                <div className="text-center p-4 bg-slate-50 rounded-xl">
                  <TrendingUp className="w-5 h-5 text-slate-400 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-slate-900">{duration}</p>
                  <p className="text-xs text-slate-500">训练时长(分钟)</p>
                </div>
                <div className="text-center p-4 bg-slate-50 rounded-xl">
                  <Star className="w-5 h-5 text-slate-400 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-slate-900">{selectedRating || '-'}</p>
                  <p className="text-xs text-slate-500">自我评分</p>
                </div>
              </div>
            </div>

            {/* 对话历史 */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
                <h3 className="font-semibold text-slate-900">对话记录</h3>
              </div>
              <div className="max-h-[600px] overflow-y-auto p-6 space-y-4">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-lg rounded-2xl px-5 py-3 ${
                      message.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 text-slate-800'
                    }`}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-medium opacity-70">
                          {message.role === 'user' ? '👤 你' : `${persona.icon} 带教老师`}
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
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-500" />
                自我评分
              </h3>
              <p className="text-sm text-slate-600 mb-4">
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
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    } ${hasSubmitted ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                  >
                    {score}
                  </button>
                ))}
              </div>
              {selectedRating > 0 && !hasSubmitted && (
                <p className="text-sm text-blue-600">
                  你选择了 {selectedRating} 分
                </p>
              )}
            </div>

            {/* 自我反思 */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h3 className="font-semibold text-slate-900 mb-4">自我反思</h3>
              <p className="text-sm text-slate-600 mb-4">
                回顾这次对话，你觉得哪些地方做得好？哪些地方可以改进？
              </p>
              <textarea
                value={selfReflection}
                onChange={(e) => setSelfReflection(e.target.value)}
                placeholder="写下你的反思..."
                className="w-full min-h-[150px] px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none resize-none text-sm"
                disabled={hasSubmitted}
              />
              {!hasSubmitted ? (
                <Button
                  className="w-full mt-4 bg-blue-600 hover:bg-blue-700"
                  onClick={handleSubmitReflection}
                >
                  提交评估
                </Button>
              ) : (
                <div className="mt-4 p-4 bg-green-50 rounded-xl border border-green-100 text-center">
                  <p className="text-sm text-green-700 font-medium">✓ 评估已提交</p>
                </div>
              )}
            </div>

            {/* 人设回顾 */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h3 className="font-semibold text-slate-900 mb-4">人设回顾</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-slate-500 mb-1">特征</p>
                  <p className="text-slate-700">{persona.characteristics}</p>
                </div>
                <div>
                  <p className="text-slate-500 mb-1">口头禅</p>
                  <p className="text-slate-700 italic">{persona.catchphrase}</p>
                </div>
              </div>
            </div>

            {/* 改进建议 */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-100 p-6">
              <h3 className="font-semibold text-blue-900 mb-3">💡 练习建议</h3>
              <ul className="text-sm text-blue-800 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">•</span>
                  <span>尝试不同的人设组合，体验多样的职场沟通风格</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">•</span>
                  <span>在反思中记录关键的学习点</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">•</span>
                  <span>多次练习同一场景，观察自己的进步</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">•</span>
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
