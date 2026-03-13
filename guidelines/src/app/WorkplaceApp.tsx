import { useState } from 'react';
import { LoginPage } from '@/app/components/LoginPage';
import { WorkplaceScenarioSelection } from '@/app/components/WorkplaceScenarioSelection';
import { WorkplaceChatInterface } from '@/app/components/WorkplaceChatInterface';
import { WorkplaceReport } from '@/app/components/WorkplaceReport';
import type { ScenarioType, PersonaType } from '@/app/config/workplaceScenarios';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

type AppState = 'login' | 'scenario-selection' | 'chat' | 'report';

export default function WorkplaceApp() {
  const [appState, setAppState] = useState<AppState>('login');
  const [userId, setUserId] = useState<string | null>(null);
  const [scenarioType, setScenarioType] = useState<ScenarioType | null>(null);
  const [personaType, setPersonaType] = useState<PersonaType | null>(null);
  const [systemPrompt, setSystemPrompt] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [metadata, setMetadata] = useState<any>(null);

  const handleLogin = (userId?: string) => {
    if (userId) {
      setUserId(userId);
    }
    setAppState('scenario-selection');
  };

  const handleLogout = () => {
    setAppState('login');
    setUserId(null);
    setScenarioType(null);
    setPersonaType(null);
    setMessages([]);
    setMetadata(null);
  };

  const handleSelectConfiguration = (
    selectedScenario: ScenarioType,
    selectedPersona: PersonaType,
    prompt: string
  ) => {
    setScenarioType(selectedScenario);
    setPersonaType(selectedPersona);
    setSystemPrompt(prompt);
    setAppState('chat');
  };

  const handleBackToSelection = () => {
    setAppState('scenario-selection');
    setScenarioType(null);
    setPersonaType(null);
    setMessages([]);
    setMetadata(null);
  };

  const handleFinish = (chatMessages: Message[], chatMetadata: any) => {
    setMessages(chatMessages);
    setMetadata(chatMetadata);
    setAppState('report');
  };

  const handleRestart = () => {
    // 重置对话，保留当前配置
    setMessages([]);
    setMetadata(null);
    setAppState('chat');
  };

  return (
    <div className="size-full">
      {appState === 'login' && (
        <LoginPage
          onLogin={handleLogin}
          title="职场 NPC 模拟培训系统"
          subtitle="提升职场沟通技能，真实模拟各种职场场景"
        />
      )}

      {appState === 'scenario-selection' && (
        <WorkplaceScenarioSelection
          onSelectConfiguration={handleSelectConfiguration}
          onLogout={handleLogout}
        />
      )}

      {appState === 'chat' && scenarioType && personaType && (
        <WorkplaceChatInterface
          scenarioType={scenarioType}
          personaType={personaType}
          systemPrompt={systemPrompt}
          onBack={handleBackToSelection}
          onFinish={handleFinish}
        />
      )}

      {appState === 'report' && messages.length > 0 && metadata && (
        <WorkplaceReport
          messages={messages}
          metadata={metadata}
          onBackToSelection={handleBackToSelection}
          onRestart={handleRestart}
        />
      )}
    </div>
  );
}
