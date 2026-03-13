import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Send, Sparkles, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { SCENARIO_CARDS, PERSONA_CARDS, type ScenarioType, type PersonaType } from '@/app/config/workplaceScenarios';

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
  const [hasStartedOnce, setHasStartedOnce] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scenario = SCENARIO_CARDS[scenarioType];
  const persona = PERSONA_CARDS[personaType];

  // 自动滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 处理发送消息
  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    // 如果是第一条消息，初始化对话
    const isFirstMessage = messages.length === 0;

    try {
      // 调用 Dify API
      const response = await fetch('/api/dify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          apiUrl: import.meta.env.VITE_SOCIAL_DIFY_PARTNER_API_URL || 'https://api.dify.ai/v1',
          apiKey: import.meta.env.VITE_SOCIAL_DIFY_PARTNER_API_KEY || '',
          payload: {
            query: userMessage.content,
            response_mode: 'blocking',
            conversation_id: '',  // 首次对话为空
            user: 'workplace-trainee',
            inputs: isFirstMessage ? {
              system_prompt: systemPrompt
            } : {}
          }
        })
      });

      if (!response.ok) {
        throw new Error('API 请求失败');
      }

      const data = await response.json();

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.answer || '抱歉，我现在无法回复。请稍后再试。',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);

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

  // 处理键盘事件
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // 结束对话
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

  // 开始对话（显示开场界面）
  const handleStart = () => {
    setIsStarted(true);
    setHasStartedOnce(true);
  };

  if (!isStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
        {/* Header */}
        <div className="bg-white border-b border-slate-200">
          <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={onBack}
              className="hover:bg-slate-100"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              返回
            </Button>
            <h2 className="text-lg font-semibold text-slate-900">
              {scenario.title} × {persona.title}
            </h2>
            <div className="w-20" /> {/* 占位保持居中 */}
          </div>
        </div>

        {/* Scenario Detail */}
        <div className="max-w-3xl mx-auto px-6 py-12">
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            {/* Scenario Header */}
            <div className="p-8 bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl bg-white shadow-sm">
                  {scenario.icon}
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-slate-900 mb-1">
                    {scenario.title}
                  </h1>
                  <p className="text-slate-600">与 {persona.title} 的带教老师对话</p>
                </div>
              </div>
            </div>

            {/* Scenario Content */}
            <div className="p-8 space-y-6">
              <div className="bg-slate-50 rounded-xl p-6">
                <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  背景情境
                </h3>
                <p className="text-slate-700 leading-relaxed">
                  {scenario.background}
                </p>
              </div>

              <div className="bg-amber-50 rounded-xl p-6 border border-amber-100">
                <h3 className="text-sm font-semibold text-amber-800 mb-3 flex items-center gap-2">
                  📋 具体事件
                </h3>
                <p className="text-amber-900 leading-relaxed">
                  {scenario.event}
                </p>
              </div>

              <div className="bg-slate-50 rounded-xl p-6">
                <h3 className="text-sm font-semibold text-slate-700 mb-3">
                  👤 带教老师人设
                </h3>
                <p className="text-slate-700 leading-relaxed mb-3">
                  {persona.characteristics}
                </p>
                <p className="text-slate-600 italic text-sm">
                  {persona.catchphrase}
                </p>
              </div>

              {/* Tips */}
              <div className="bg-blue-50 rounded-xl p-6 border border-blue-100">
                <h3 className="text-sm font-semibold text-blue-800 mb-3">
                  💡 开场提示
                </h3>
                <p className="text-blue-700 leading-relaxed text-sm">
                  根据上面的具体事件，思考你会如何回应。这是你与带教老师的真实对话，
                  请尽量自然地表达你的想法。准备好后，点击下方按钮开始对话。
                </p>
              </div>
            </div>

            {/* Start Button */}
            <div className="p-8 bg-slate-50 border-t border-slate-200">
              <Button
                size="lg"
                className="w-full py-6 text-lg bg-blue-600 hover:bg-blue-700"
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
    <div className="h-screen flex flex-col bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 shrink-0">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={onBack}
            className="hover:bg-slate-100"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回
          </Button>
          <div className="text-center">
            <h2 className="text-lg font-semibold text-slate-900">
              {scenario.title} × {persona.title}
            </h2>
            <p className="text-xs text-slate-500">
              已进行 {Math.ceil(messages.length / 2)} 轮对话
            </p>
          </div>
          <Button
            variant="outline"
            onClick={handleFinish}
            className="border-slate-200"
            disabled={messages.length < 2}
          >
            结束训练
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
          {messages.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
                <Send className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                请发送你的开场白
              </h3>
              <p className="text-slate-500 text-sm max-w-md mx-auto">
                根据场景中的具体事件，思考你会如何回应带教老师。
                这是真实职场情境的模拟，请自然地表达你的想法。
              </p>
            </div>
          )}

          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-2xl rounded-2xl px-6 py-4 ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white border border-slate-200 text-slate-800'
                }`}
              >
                <p className="whitespace-pre-wrap break-words leading-relaxed">
                  {message.content}
                </p>
                <p className={`text-xs mt-2 ${
                  message.role === 'user' ? 'text-blue-200' : 'text-slate-400'
                }`}>
                  {message.timestamp.toLocaleTimeString('zh-CN', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white border border-slate-200 rounded-2xl px-6 py-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" />
                  <div className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0.1s' }} />
                  <div className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0.2s' }} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="bg-white border-t border-slate-200 shrink-0">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-end gap-3">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="输入你的回复... (Shift+Enter 换行，Enter 发送)"
                className="w-full min-h-[60px] max-h-[200px] px-4 py-3 pr-12 rounded-xl border border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none resize-none"
                disabled={isLoading}
              />
              <div className="absolute bottom-3 right-3 text-xs text-slate-400">
                {inputValue.length} 字
              </div>
            </div>
            <Button
              size="lg"
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isLoading}
              className="px-6 bg-blue-600 hover:bg-blue-700 h-[60px]"
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
  );
}
