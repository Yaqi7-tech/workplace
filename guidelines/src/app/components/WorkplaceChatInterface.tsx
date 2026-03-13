import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Send, Sparkles, Lightbulb, TrendingUp, AlertTriangle, Shield, Loader2, BookOpen, User } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import {
  SCENARIO_CARDS,
  PERSONA_CARDS,
  THEME_COLORS,
  type ScenarioType,
  type PersonaType
} from '@/app/config/workplaceScenarios';
import { workplaceApiService, ChatMessageItem, StructuredData, SupervisorFeedback } from '@/app/services/api';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface WorkplaceChatInterfaceProps {
  scenarioType: ScenarioType;
  personaType: PersonaType;
  systemPrompt: string;
  onBack: () => void;
  onFinish: (messages: Message[], metadata: any) => void;
}

export function WorkplaceChatInterface({
  scenarioType,
  personaType,
  systemPrompt,
  onBack,
  onFinish
}: WorkplaceChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isStarted, setIsStarted] = useState(false);
  const [hint, setHint] = useState<string>('');
  const [isLoadingHint, setIsLoadingHint] = useState(false);
  const [supervisorFeedback, setSupervisorFeedback] = useState<SupervisorFeedback | null>(null);
  const [structuredData, setStructuredData] = useState<StructuredData>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scenario = SCENARIO_CARDS[scenarioType];
  const persona = PERSONA_CARDS[personaType];

  // 滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 生成结构化数据
  const generateStructuredData = (): StructuredData => {
    const turnCount = Math.ceil(messages.length / 2);
    return {
      session_emotion_timeline: [
        { label: '平静', turn: 1 },
        { label: '困惑', turn: Math.max(2, turnCount) }
      ],
      stress_curve: [
        { turn: 1, value: 30 },
        { turn: Math.max(2, turnCount), value: 50 + Math.random() * 30 }
      ],
      emotion_curve: [
        { turn: 1, value: -5 },
        { turn: Math.max(2, turnCount), value: -10 + Math.random() * 20 }
      ]
    };
  };

  // 自动获取提示 - NPC回复后自动调用
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    // 只在最后一条是NPC回复且之前没有获取过hint时调用
    if (lastMessage && lastMessage.role === 'assistant' && !isLoading && !hint) {
      fetchHint();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, isLoading]);

  // 获取提示
  const fetchHint = async () => {
    setIsLoadingHint(true);
    try {
      const chatHistory: ChatMessageItem[] = messages.map(m => ({
        role: m.role,
        content: m.content,
        timestamp: m.timestamp
      }));

      const scenarioText = `背景情境：${scenario.background}\n具体事件：${scenario.event}`;
      const personaText = `特征：${persona.characteristics}\n${persona.catchphrase}\n${persona.behaviorRule}`;

      console.log('调用Hint API，场景:', scenario.title, '人设:', persona.title);

      const response = await workplaceApiService.callHintAPI(
        scenarioText,
        personaText,
        chatHistory,
        structuredData
      );

      console.log('Hint API响应:', response);
      setHint(response.hint);
    } catch (error) {
      console.error('获取提示失败:', error);
      setHint('请根据当前情境，思考如何回应带教老师。');
    } finally {
      setIsLoadingHint(false);
    }
  };

  // 获取督导反馈
  const fetchSupervisorFeedback = async (userReply: string) => {
    try {
      const chatHistory: ChatMessageItem[] = messages.map(m => ({
        role: m.role,
        content: m.content,
        timestamp: m.timestamp
      }));

      const scenarioText = `背景情境：${scenario.background}\n具体事件：${scenario.event}`;
      const personaText = `特征：${persona.characteristics}\n${persona.catchphrase}\n${persona.behaviorRule}`;

      const response = await workplaceApiService.callSupervisorAPI(
        scenarioText,
        personaText,
        chatHistory,
        userReply,
        structuredData
      );

      setSupervisorFeedback(response);
    } catch (error) {
      console.error('获取督导反馈失败:', error);
    }
  };

  // 处理发送消息
  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userReply = inputValue.trim();

    // 用户消息
    const userMessage: Message = {
      role: 'user',
      content: userReply,
      timestamp: new Date()
    };

    // 清空hint和督导反馈，准备新的一轮
    setHint('');
    setSupervisorFeedback(null);

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Dify现在通过表单字段接收场景和人设，query只需要用户的实际消息
      const response = await workplaceApiService.callNPC(userReply, persona.title, scenario.title);

      const assistantMessage: Message = {
        role: 'assistant',
        content: response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);

      // 更新结构化数据
      setStructuredData(generateStructuredData());

      // 调用督导API
      await fetchSupervisorFeedback(userReply);

    } catch (error) {
      console.error('发送消息失败:', error);
      const errorMessage: Message = {
        role: 'assistant',
        content: '抱歉，发生了错误，请稍后再试。',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  // 使用提示
  const useHint = () => {
    if (hint) {
      setInputValue(hint);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFinish = () => {
    const metadata = {
      scenarioType,
      personaType,
      scenarioTitle: scenario.title,
      personaTitle: persona.title,
      turnCount: messages.length,
      startedAt: messages[0]?.timestamp,
      finishedAt: new Date()
    };
    onFinish(messages, metadata);
  };

  const handleStart = () => {
    setIsStarted(true);
  };

  if (!isStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[rgb(254,254,250)] via-[rgb(254,253,249)] to-[rgb(254,254,250)]">
        <div className="bg-white border-b-2" style={{ borderColor: 'rgba(60,155,201,0.15)' }}>
          <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
            <Button variant="ghost" onClick={onBack} className="hover:bg-[rgb(60,155,201,0.1)]">
              <ArrowLeft className="w-4 h-4 mr-2" style={{ color: THEME_COLORS.blue }} />
              返回
            </Button>
            <h2 className="text-lg font-semibold text-[rgb(45,45,45)]">
              {scenario.title} × {persona.title}
            </h2>
            <div className="w-20" />
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-6 py-12">
          <div className="bg-white rounded-2xl border-2 overflow-hidden" style={{ borderColor: 'rgba(60,155,201,0.15)' }}>
            <div className="p-8" style={{ background: `linear-gradient(135deg, ${THEME_COLORS.cyan}22, ${THEME_COLORS.blue}22)` }}>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl bg-white shadow-sm">
                  {scenario.icon}
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-[rgb(45,45,45)] mb-1">{scenario.title}</h1>
                  <p className="text-[rgb(122,122,122)]">与 {persona.title} 的带教老师对话</p>
                </div>
              </div>
            </div>

            <div className="p-8 space-y-6">
              <div className="p-6 rounded-xl" style={{ backgroundColor: 'rgb(254,254,250)' }}>
                <h3 className="text-sm font-semibold text-[rgb(45,45,45)] mb-3 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" style={{ color: THEME_COLORS.blue }} />
                  背景情境
                </h3>
                <p className="text-[rgb(45,45,45)] leading-relaxed">{scenario.background}</p>
              </div>

              <div className="p-6 rounded-xl border-2" style={{ backgroundColor: 'rgb(254,225,153,0.4)', borderColor: 'rgb(254,225,153)' }}>
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: 'rgb(249,127,95)' }}>
                  📋 具体事件
                </h3>
                <p className="leading-relaxed" style={{ color: 'rgb(249,127,95)' }}>{scenario.event}</p>
              </div>

              <div className="p-6 rounded-xl" style={{ backgroundColor: 'rgb(254,254,250)' }}>
                <h3 className="text-sm font-semibold text-[rgb(45,45,45)] mb-3">👤 带教老师人设</h3>
                <p className="text-[rgb(45,45,45)] leading-relaxed mb-3">{persona.characteristics}</p>
                <p className="text-[rgb(122,122,122)] italic text-sm">{persona.catchphrase}</p>
              </div>

              <div className="p-6 rounded-xl border-2" style={{ backgroundColor: 'rgba(60,155,201,0.1)', borderColor: 'rgba(60,155,201,0.2)' }}>
                <h3 className="text-sm font-semibold mb-3" style={{ color: THEME_COLORS.blue }}>
                  💡 功能说明
                </h3>
                <ul className="text-sm space-y-2" style={{ color: THEME_COLORS.blue }}>
                  <li>• 右侧督导面板会实时分析你的回复</li>
                  <li>• 每轮对话后会显示风险判定和改进建议</li>
                  <li>• NPC回复后会自动生成回复提示</li>
                </ul>
              </div>
            </div>

            <div className="p-8" style={{ backgroundColor: 'rgb(254,254,250)', borderTop: '1px solid rgba(60,155,201,0.1)' }}>
              <Button
                size="lg"
                className="w-full py-6 text-lg text-white hover:opacity-90"
                style={{ backgroundColor: THEME_COLORS.blue }}
                onClick={handleStart}
              >
                <Send className="w-5 h-5 mr-2" />
                开始对话
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex" style={{ backgroundColor: 'rgb(254,254,250)' }}>
      {/* 左侧边栏 - 背景信息 */}
      <div className="w-80 border-r-2 flex flex-col bg-white shrink-0 overflow-y-auto" style={{ borderColor: 'rgba(60,155,201,0.15)' }}>
        {/* 顶部标题 */}
        <div className="px-4 py-3 border-b-2 shrink-0" style={{ borderColor: 'rgba(60,155,201,0.1)' }}>
          <h3 className="font-semibold text-sm text-[rgb(45,45,45)]">背景信息</h3>
        </div>

        {/* 场景信息 */}
        <div className="p-4 border-b-2" style={{ borderColor: 'rgba(60,155,201,0.1)' }}>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xl">{scenario.icon}</span>
            <h4 className="font-semibold text-sm text-[rgb(45,45,45)]">{scenario.title}</h4>
          </div>
          <div className="rounded-lg p-3 border" style={{ backgroundColor: 'rgb(254,225,153,0.25)', borderColor: 'rgb(254,225,153,0.5)' }}>
            <div className="flex items-center gap-1 mb-2">
              <BookOpen className="w-3 h-3" style={{ color: 'rgb(249,127,95)' }} />
              <span className="text-xs font-semibold" style={{ color: 'rgb(249,127,95)' }}>具体事件</span>
            </div>
            <p className="text-xs leading-relaxed text-[rgb(45,45,45)]">{scenario.event}</p>
          </div>
        </div>

        {/* 人设信息 */}
        <div className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xl">{persona.icon}</span>
            <h4 className="font-semibold text-sm text-[rgb(45,45,45)]">{persona.title}</h4>
          </div>
          <div className="rounded-lg p-3 border" style={{ backgroundColor: 'rgb(254,254,250)', borderColor: 'rgba(60,155,201,0.2)' }}>
            <div className="flex items-center gap-1 mb-2">
              <User className="w-3 h-3" style={{ color: THEME_COLORS.blue }} />
              <span className="text-xs font-semibold text-[rgb(45,45,45)]">带教老师人设</span>
            </div>
            <p className="text-xs leading-relaxed text-[rgb(45,45,45)]">{persona.characteristics}</p>
          </div>
        </div>
      </div>

      {/* 中间聊天区域 */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-white border-b-2 shrink-0" style={{ borderColor: 'rgba(60,155,201,0.15)' }}>
          <div className="max-w-4xl mx-auto px-6 py-3 flex items-center justify-between">
            <Button variant="ghost" onClick={onBack} className="hover:bg-[rgb(60,155,201,0.1)]">
              <ArrowLeft className="w-4 h-4 mr-2" style={{ color: THEME_COLORS.blue }} />
              返回
            </Button>
            <div className="text-center">
              <h2 className="text-base font-semibold text-[rgb(45,45,45)]">
                已进行 {Math.ceil(messages.length / 2)} 轮对话
              </h2>
            </div>
            <Button
              variant="outline"
              onClick={handleFinish}
              className="border-[rgb(60,155,201,0.3)] hover:bg-[rgb(60,155,201,0.1)] text-sm py-2"
              style={{ color: THEME_COLORS.blue }}
              disabled={messages.length < 2}
            >
              结束训练
            </Button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto px-6 py-6 space-y-4">
            {/* 初始提示 */}
            {messages.length === 0 && (
              <div className="text-center py-8">
                <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: 'rgba(60,155,201,0.2)' }}>
                  <Send className="w-8 h-8" style={{ color: THEME_COLORS.blue }} />
                </div>
                <h3 className="text-lg font-semibold text-[rgb(45,45,45)] mb-2">请发送你的开场白</h3>
                <p className="text-sm text-[rgb(122,122,122)]">
                  根据上方显示的场景和带教老师人设，开始对话
                </p>
              </div>
            )}

            {/* 消息列表 */}
            {messages.map((message, index) => (
              <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-2xl rounded-2xl px-5 py-3 ${
                    message.role === 'user' ? 'text-white' : 'bg-white border-2 text-[rgb(45,45,45)]'
                  }`}
                  style={message.role === 'user' ? { backgroundColor: THEME_COLORS.blue } : { borderColor: 'rgba(60,155,201,0.15)' }}
                >
                  <p className="whitespace-pre-wrap break-words leading-relaxed text-sm">{message.content}</p>
                  <p className={`text-xs mt-1 ${message.role === 'user' ? 'text-white/70' : 'text-[rgb(122,122,122)]'}`}>
                    {message.timestamp.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white border-2 rounded-2xl px-5 py-3" style={{ borderColor: 'rgba(60,155,201,0.15)' }}>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: THEME_COLORS.cyan }} />
                    <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: THEME_COLORS.cyan, animationDelay: '0.1s' }} />
                    <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: THEME_COLORS.cyan, animationDelay: '0.2s' }} />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Hint Panel */}
        {!isLoading && messages.length > 0 && (
          <div className="bg-white border-t-2 shrink-0" style={{ borderColor: 'rgba(60,155,201,0.15)' }}>
            <div className="max-w-4xl mx-auto px-6 py-3">
              {isLoadingHint ? (
                <div className="rounded-xl p-3" style={{ backgroundColor: 'rgb(254,225,153,0.2)', border: '1px solid rgb(254,225,153)' }}>
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" style={{ color: 'rgb(249,127,95)' }} />
                    <span className="text-sm" style={{ color: 'rgb(249,127,95)' }}>正在生成回复建议...</span>
                  </div>
                </div>
              ) : hint ? (
                <div className="rounded-xl p-3" style={{ backgroundColor: 'rgb(254,225,153,0.3)', border: '1px solid rgb(254,225,153)' }}>
                  <div className="flex items-start gap-2">
                    <Lightbulb className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: 'rgb(249,127,95)' }} />
                    <div className="flex-1">
                      <p className="text-sm leading-relaxed mr-3" style={{ color: 'rgb(45,45,45)' }}>{hint}</p>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={useHint}
                        className="text-xs px-2 py-1 h-auto hover:bg-[rgb(60,155,201,0.1)]"
                        style={{ color: THEME_COLORS.blue }}
                      >
                        使用
                      </Button>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="bg-white border-t-2 shrink-0" style={{ borderColor: 'rgba(60,155,201,0.15)' }}>
          <div className="max-w-4xl mx-auto px-6 py-3">
            <div className="flex items-end gap-3">
              <textarea
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="输入你的回复... (Shift+Enter 换行，Enter 发送)"
                className="flex-1 min-h-[50px] max-h-[120px] px-4 py-2 pr-12 rounded-xl border-2 focus:border-[rgb(60,155,201)] focus:ring-2 outline-none resize-none text-sm"
                style={{ borderColor: 'rgba(60,155,201,0.2)', backgroundColor: 'rgb(254,254,250)' }}
                disabled={isLoading}
              />
              <div className="absolute bottom-2 right-8 text-xs text-[rgb(122,122,122)]">{inputValue.length} 字</div>
              <Button
                size="lg"
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isLoading}
                className="px-6 text-white hover:opacity-90 h-[50px]"
                style={{ backgroundColor: THEME_COLORS.blue }}
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* 右侧督导侧边栏 */}
      <div className="w-96 border-l-2 flex flex-col bg-white shrink-0" style={{ borderColor: 'rgba(60,155,201,0.15)' }}>
        {/* 侧边栏头部 */}
        <div className="px-5 py-3 border-b-2 flex items-center justify-between" style={{ borderColor: 'rgba(60,155,201,0.1)' }}>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" style={{ color: THEME_COLORS.blue }} />
            <h3 className="font-semibold text-sm text-[rgb(45,45,45)]">职场社交督导</h3>
          </div>
        </div>

        {/* 督导内容 */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {!supervisorFeedback ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3" style={{ backgroundColor: 'rgba(60,155,201,0.1)' }}>
                <TrendingUp className="w-6 h-6" style={{ color: THEME_COLORS.blue }} />
              </div>
              <p className="text-xs text-[rgb(122,122,122)]">
                发送消息后，督导会分析你的回复并提供反馈
              </p>
            </div>
          ) : (
            <>
              {/* 风险判定 */}
              <div className="rounded-xl p-4 border-2" style={{ backgroundColor: 'rgb(252,117,123,0.15)', borderColor: 'rgb(252,117,123,0.4)' }}>
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4" style={{ color: 'rgb(252,117,123)' }} />
                  <h4 className="text-sm font-semibold" style={{ color: 'rgb(252,117,123)' }}>风险判定</h4>
                </div>
                <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: 'rgb(45,45,45)' }}>
                  {supervisorFeedback.risk_assessment || '暂无判定'}
                </p>
              </div>

              {/* 雷区定位 */}
              {supervisorFeedback.risk_zone && (
                <div className="rounded-xl p-4 border-2" style={{ backgroundColor: 'rgb(249,127,95,0.15)', borderColor: 'rgb(249,127,95,0.4)' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-4 h-4" style={{ color: 'rgb(249,127,95)' }} />
                    <h4 className="text-sm font-semibold" style={{ color: 'rgb(249,127,95)' }}>雷区定位</h4>
                  </div>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: 'rgb(45,45,45)' }}>
                    {supervisorFeedback.risk_zone}
                  </p>
                </div>
              )}

              {/* 安全替换 */}
              {supervisorFeedback.safe_alternative && (
                <div className="rounded-xl p-4 border-2" style={{ backgroundColor: 'rgb(176,214,169,0.2)', borderColor: 'rgb(176,214,169,0.5)' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="w-4 h-4" style={{ color: 'rgb(60,155,201)' }} />
                    <h4 className="text-sm font-semibold" style={{ color: 'rgb(60,155,201)' }}>安全替换</h4>
                  </div>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: 'rgb(45,45,45)' }}>
                    {supervisorFeedback.safe_alternative}
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
