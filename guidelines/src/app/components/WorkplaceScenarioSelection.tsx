import { useState } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, BarChart3 } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import {
  PERSONA_CARDS,
  SCENARIO_CARDS,
  getCombinedPrompt,
  DIFFICULTY_LABELS,
  type PersonaType,
  type ScenarioType
} from '@/app/config/workplaceScenarios';

interface WorkplaceScenarioSelectionProps {
  onSelectConfiguration: (scenarioType: ScenarioType, personaType: PersonaType, combinedPrompt: string) => void;
  onLogout: () => void;
  onViewProgress?: () => void;
}

type SelectionStep = 'scenario' | 'persona' | 'confirm';

export function WorkplaceScenarioSelection({
  onSelectConfiguration,
  onLogout,
  onViewProgress
}: WorkplaceScenarioSelectionProps) {
  const [currentStep, setCurrentStep] = useState<SelectionStep>('scenario');
  const [selectedScenario, setSelectedScenario] = useState<ScenarioType | null>(null);
  const [selectedPersona, setSelectedPersona] = useState<PersonaType | null>(null);

  const scenarioTypes: ScenarioType[] = [
    '接受模糊指令',
    '工作失误汇报',
    '拒绝不合理要求',
    '进度滞后预警',
    '争取权益',
    '职场闲聊'
  ];

  const personaTypes: PersonaType[] = [
    '逻辑压制型',
    '模糊否定型',
    '沉默/冷处理型',
    '情绪施压型'
  ];

  const handleScenarioSelect = (scenario: ScenarioType) => {
    setSelectedScenario(scenario);
    setCurrentStep('persona');
  };

  const handlePersonaSelect = (persona: PersonaType) => {
    setSelectedPersona(persona);
    setCurrentStep('confirm');
  };

  const handleBackToScenarios = () => {
    setCurrentStep('scenario');
  };

  const handleBackToPersonas = () => {
    setCurrentStep('persona');
  };

  const handleStartPractice = () => {
    if (selectedScenario && selectedPersona) {
      const prompt = getCombinedPrompt(selectedPersona, selectedScenario);
      onSelectConfiguration(selectedScenario, selectedPersona, prompt);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            {currentStep !== 'scenario' && (
              <Button
                variant="ghost"
                size="icon"
                onClick={currentStep === 'confirm' ? handleBackToPersonas : handleBackToScenarios}
                className="hover:bg-slate-100"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
            )}
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">
                {currentStep === 'scenario' && '选择职场场景'}
                {currentStep === 'persona' && '选择带教老师人设'}
                {currentStep === 'confirm' && '确认训练配置'}
              </h1>
              <p className="text-slate-500 text-sm mt-1">
                {currentStep === 'scenario' && '请选择一个真实的职场沟通场景'}
                {currentStep === 'persona' && '不同人设会带来完全不同的沟通挑战'}
                {currentStep === 'confirm' && '检查配置后开始模拟训练'}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {onViewProgress && (
              <Button
                variant="outline"
                onClick={onViewProgress}
                className="border-slate-200 hover:bg-slate-50"
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                查看进步分析
              </Button>
            )}
            <Button
              variant="outline"
              onClick={onLogout}
              className="border-slate-200 hover:bg-slate-50"
            >
              退出登录
            </Button>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
            currentStep === 'scenario' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'
          }`}>
            <span className="w-6 h-6 rounded-full bg-white flex items-center justify-center text-sm font-medium">1</span>
            <span className="text-sm font-medium">选择场景</span>
          </div>
          <div className="w-12 h-0.5 bg-slate-200" />
          <div className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
            currentStep === 'persona' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'
          }`}>
            <span className="w-6 h-6 rounded-full bg-white flex items-center justify-center text-sm font-medium">2</span>
            <span className="text-sm font-medium">选择人设</span>
          </div>
          <div className="w-12 h-0.5 bg-slate-200" />
          <div className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
            currentStep === 'confirm' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'
          }`}>
            <span className="w-6 h-6 rounded-full bg-white flex items-center justify-center text-sm font-medium">3</span>
            <span className="text-sm font-medium">确认开始</span>
          </div>
        </div>

        {/* Step Content */}
        {currentStep === 'scenario' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {scenarioTypes.map((type) => {
              const scenario = SCENARIO_CARDS[type];
              const difficulty = DIFFICULTY_LABELS[scenario.difficulty];
              return (
                <div
                  key={type}
                  onClick={() => handleScenarioSelect(type)}
                  className="group relative overflow-hidden rounded-2xl bg-white border border-slate-200 hover:border-slate-300 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer"
                >
                  {/* Header */}
                  <div className="pt-6 px-6">
                    <div className="flex items-center justify-between">
                      <div
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-white text-lg"
                        style={{ backgroundColor: scenario.color }}
                      >
                        <span>{scenario.icon}</span>
                        <span className="font-medium">{scenario.title}</span>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${difficulty.color}`}>
                        {difficulty.label}
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6 text-left">
                    <div className="mb-4">
                      <p className="text-xs text-slate-500 font-medium mb-2">背景情境</p>
                      <p className="text-sm text-slate-600 leading-relaxed">
                        {scenario.background}
                      </p>
                    </div>
                    <div className="pt-4 border-t border-slate-100">
                      <p className="text-xs text-slate-500 font-medium mb-2">具体事件</p>
                      <p className="text-sm text-slate-600 leading-relaxed line-clamp-3">
                        {scenario.event}
                      </p>
                    </div>
                  </div>

                  {/* Arrow indicator */}
                  <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ArrowRight className="w-5 h-5 text-slate-400" />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {currentStep === 'persona' && selectedScenario && (
          <div>
            <div className="mb-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
              <p className="text-sm text-blue-800">
                <span className="font-medium">已选场景：</span>
                {SCENARIO_CARDS[selectedScenario].title}
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {personaTypes.map((type) => {
                const persona = PERSONA_CARDS[type];
                return (
                  <div
                    key={type}
                    onClick={() => handlePersonaSelect(type)}
                    className="group relative overflow-hidden rounded-2xl bg-white border border-slate-200 hover:border-slate-300 transition-all duration-300 hover:shadow-xl cursor-pointer"
                  >
                    {/* Header */}
                    <div className="pt-6 px-6">
                      <div
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-white"
                        style={{ backgroundColor: persona.color }}
                      >
                        <span className="text-2xl">{persona.icon}</span>
                        <span className="font-medium text-lg">{persona.title}</span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-6 text-left space-y-4">
                      <div>
                        <p className="text-xs text-slate-500 font-medium mb-1">特征</p>
                        <p className="text-sm text-slate-600">{persona.characteristics}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 font-medium mb-1">{persona.catchphrase.split('：')[0]}</p>
                        <p className="text-sm text-slate-600 italic">{persona.catchphrase.split('：')[1]}</p>
                      </div>
                      <div className="pt-3 border-t border-slate-100">
                        <p className="text-xs text-slate-500 leading-relaxed">{persona.behaviorRule}</p>
                      </div>
                    </div>

                    {/* Arrow indicator */}
                    <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <ArrowRight className="w-5 h-5 text-slate-400" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {currentStep === 'confirm' && selectedScenario && selectedPersona && (
          <div className="max-w-3xl mx-auto">
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              {/* Scenario */}
              <div className="p-6 border-b border-slate-100">
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                    style={{ backgroundColor: SCENARIO_CARDS[selectedScenario].color + '20' }}
                  >
                    {SCENARIO_CARDS[selectedScenario].icon}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">
                      {SCENARIO_CARDS[selectedScenario].title}
                    </h3>
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                      DIFFICULTY_LABELS[SCENARIO_CARDS[selectedScenario].difficulty].color
                    }`}>
                      {DIFFICULTY_LABELS[SCENARIO_CARDS[selectedScenario].difficulty].label}
                    </span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-slate-500 font-medium mb-1">背景情境</p>
                    <p className="text-sm text-slate-700">{SCENARIO_CARDS[selectedScenario].background}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-medium mb-1">具体事件</p>
                    <p className="text-sm text-slate-700">{SCENARIO_CARDS[selectedScenario].event}</p>
                  </div>
                </div>
              </div>

              {/* Persona */}
              <div className="p-6 bg-slate-50">
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                    style={{ backgroundColor: PERSONA_CARDS[selectedPersona].color + '20' }}
                  >
                    {PERSONA_CARDS[selectedPersona].icon}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">
                      {PERSONA_CARDS[selectedPersona].title}
                    </h3>
                    <p className="text-xs text-slate-500">带教老师人设</p>
                  </div>
                </div>
                <div className="space-y-2 text-sm text-slate-700">
                  <p><span className="font-medium">特征：</span>{PERSONA_CARDS[selectedPersona].characteristics}</p>
                  <p className="italic">{PERSONA_CARDS[selectedPersona].catchphrase}</p>
                </div>
              </div>
            </div>

            {/* Start Button */}
            <div className="mt-8 flex justify-center">
              <Button
                size="lg"
                className="px-12 py-6 text-lg bg-blue-600 hover:bg-blue-700"
                onClick={handleStartPractice}
              >
                <CheckCircle2 className="w-5 h-5 mr-2" />
                开始模拟训练
              </Button>
            </div>

            {/* Tips */}
            <div className="mt-6 p-4 bg-amber-50 rounded-xl border border-amber-100">
              <p className="text-sm text-amber-800">
                <span className="font-medium">💡 提示：</span>
                训练开始后，你需要根据场景给出的具体事件，发送你的开场白来开始对话。请尽量真实地模拟职场沟通场景。
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
