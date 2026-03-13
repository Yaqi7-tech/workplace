import { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, Lightbulb, ChevronDown, ChevronRight } from 'lucide-react';
import type { SupervisorEvaluation } from '@/app/services/api';

interface SupervisorEvaluationWithTurn extends SupervisorEvaluation {
  turn: number;
}

interface SupervisorFeedbackProps {
  evaluations: SupervisorEvaluationWithTurn[];
}

export function SupervisorFeedback({ evaluations }: SupervisorFeedbackProps) {
  // 为每个评价跟踪自然语言反馈展开/折叠状态 - 默认全部折叠
  const [expandedFeedbacks, setExpandedFeedbacks] = useState<Set<number>>(new Set());

  // 切换某轮的自然语言反馈展开状态
  const toggleFeedback = (turn: number) => {
    setExpandedFeedbacks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(turn)) {
        newSet.delete(turn);
      } else {
        newSet.add(turn);
      }
      return newSet;
    });
  };

  // 全部展开/折叠
  const expandAll = () => {
    setExpandedFeedbacks(new Set(evaluations.map(e => e.turn)));
  };

  const collapseAll = () => {
    setExpandedFeedbacks(new Set()); // 折叠所有
  };

  // 当 evaluations 更新时，保持折叠状态
  useEffect(() => {
    // 不自动展开任何轮次，保持用户手动选择的状态
  }, [evaluations]);

  const getScoreClass = (score: number) => {
    if (score >= 4) return 'text-green-600';
    if (score >= 3) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgClass = (score: number) => {
    if (score >= 4) return 'from-green-50 to-emerald-50 border-green-200';
    if (score >= 3) return 'from-yellow-50 to-amber-50 border-yellow-200';
    return 'from-red-50 to-orange-50 border-red-200';
  };

  // evaluations 已经按轮次倒序排列（最新的在前）
  return (
    <div className="h-full bg-white border-l border-slate-200 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 flex-shrink-0">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-base font-semibold text-slate-900">
            督导反馈
          </h2>
          {evaluations.length > 1 && (
            <div className="flex gap-1">
              <button
                onClick={expandAll}
                className="text-xs text-blue-600 hover:text-blue-700 px-2 py-1 rounded hover:bg-blue-50"
              >
                全部展开
              </button>
              <button
                onClick={collapseAll}
                className="text-xs text-slate-500 hover:text-slate-600 px-2 py-1 rounded hover:bg-slate-100"
              >
                折叠
              </button>
            </div>
          )}
        </div>
        <p className="text-xs text-slate-500">
          共 {evaluations.length} 轮评价
        </p>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-3">
          {evaluations.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <AlertCircle className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                <p className="text-slate-400 text-sm">
                  开始对话后将显示督导评价
                </p>
              </div>
            </div>
          ) : (
            evaluations.map((evaluation, index) => {
              const isLatest = index === 0;
              const isExpanded = expandedFeedbacks.has(evaluation.turn);

              return (
                <div key={evaluation.turn} className="border border-slate-200 rounded-lg overflow-hidden">
                  {/* 轮次标题栏（始终显示） */}
                  <div className={`p-3 ${isLatest ? 'bg-blue-50' : 'bg-slate-50'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-medium ${isLatest ? 'text-blue-700' : 'text-slate-700'}`}>
                          第 {evaluation.turn} 轮
                        </span>
                        {isLatest && (
                          <span className="text-xs px-1.5 py-0.5 bg-blue-500 text-white rounded">
                            当前
                          </span>
                        )}
                      </div>
                      <span className={`text-sm font-bold ${getScoreClass(evaluation.综合得分)}`}>
                        {evaluation.综合得分.toFixed(1)}
                      </span>
                    </div>

                    {/* 展开/折叠自然语言反馈按钮 */}
                    {evaluation.natural_language_feedback && (
                      <button
                        onClick={() => toggleFeedback(evaluation.turn)}
                        className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 transition-colors"
                      >
                        {isExpanded ? (
                          <>
                            <ChevronDown className="w-3 h-3" />
                            收起详细反馈
                          </>
                        ) : (
                          <>
                            <ChevronRight className="w-3 h-3" />
                            查看详细反馈
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  {/* 内容区域 - 始终可见 */}
                  <div className={`p-4 bg-gradient-to-br ${getScoreBgClass(evaluation.综合得分)} border-t`}>
                    {/* Natural Language Feedback - 可折叠 */}
                    {isExpanded && evaluation.natural_language_feedback && (
                      <div className="mb-4 pb-4 border-b border-black/10">
                        <p className="text-sm text-slate-700 leading-relaxed">
                          {evaluation.natural_language_feedback}
                        </p>
                      </div>
                    )}

                    {/* Summary - 始终可见 */}
                    {evaluation.总体评价 && (
                      <div className="mb-4">
                        <p className="text-xs text-slate-500 mb-1">总体评价</p>
                        <p className="text-sm text-slate-700 leading-relaxed">
                          {evaluation.总体评价}
                        </p>
                      </div>
                    )}

                    {/* Suggestion - 始终可见 */}
                    {evaluation.建议 && (
                      <div className="bg-white/80 rounded-lg p-3 mb-3 border border-white/50">
                        <div className="flex items-start gap-2 mb-1">
                          <Lightbulb className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                          <span className="text-xs font-semibold text-slate-700">建议:</span>
                        </div>
                        <p className="text-sm text-slate-700 leading-relaxed ml-6">
                          {evaluation.建议}
                        </p>
                      </div>
                    )}

                    {/* Warning - 跳步 - 始终可见 */}
                    {evaluation.跳步判断?.是否跳步 && (
                      <div className="bg-amber-100/80 rounded-lg p-3 border border-amber-200">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <span className="text-xs font-semibold text-amber-800 block mb-1">
                              跳步提示: {evaluation.跳步判断.跳步类型}
                            </span>
                            <p className="text-xs text-amber-700 leading-relaxed">
                              {evaluation.跳步判断.督导建议}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Success - 无跳步 - 始终可见 */}
                    {!evaluation.跳步判断?.是否跳步 && (
                      <div className="bg-emerald-100/80 rounded-lg p-3 border border-emerald-200">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-emerald-600" />
                          <span className="text-xs font-medium text-emerald-800">
                            节奏合适，未发现跳步问题
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
