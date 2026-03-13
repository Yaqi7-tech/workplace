import { MessageSquare, User, Heart, Users, HelpCircle, Baby, Brain, Sparkles, Zap, AlertCircle, Clock, TrendingUp, BarChart3 } from 'lucide-react';
import { Button } from '@/app/components/ui/button';

interface VisitorProfile {
  name: string;
  age: string;
  problem: string;
  defense: string;
  trainingGoal: string;
}

interface Scenario {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  goal: string;
  color: string;
  icon: React.ReactNode;
  visitorProfile?: VisitorProfile;
}

const scenarios: Scenario[] = [
  {
    id: 1,
    title: '失恋导致人际关系受挫',
    subtitle: '情绪低落、焦虑、逃避',
    description: '',
    goal: '目标: 建立专业帮助关系，通过倾听和提问，展现以来访者为中心的态度，在互动中建立初步连接',
    color: '#71717a',
    icon: <MessageSquare className="w-6 h-6" />,
    visitorProfile: {
      name: '小妍（大学生，20岁）',
      age: '20岁',
      problem: '睡眠质量差，人际关系困扰',
      defense: '高阻抗/高度理性化。她倾向于否认情绪，将心理痛苦归因于外部琐事或生理不适。',
      trainingGoal: '面对一位极力维持"表面平静"的来访者，请尝试突破她的逻辑防御，建立安全信任的咨访同盟，引导她从"抱怨室友"转向"自我觉察"。'
    }
  },
  {
    id: 2,
    title: '',
    subtitle: '',
    description: '',
    goal: '',
    color: '#52525b',
    icon: <User className="w-6 h-6" />
  },
  {
    id: 3,
    title: '',
    subtitle: '',
    description: '',
    goal: '',
    color: '#3f3f46',
    icon: <Heart className="w-6 h-6" />
  },
  {
    id: 4,
    title: '',
    subtitle: '',
    description: '',
    goal: '',
    color: '#64748b',
    icon: <Users className="w-6 h-6" />
  },
  {
    id: 5,
    title: '',
    subtitle: '',
    description: '',
    goal: '',
    color: '#475569',
    icon: <HelpCircle className="w-6 h-6" />
  },
  {
    id: 6,
    title: '',
    subtitle: '',
    description: '',
    goal: '',
    color: '#78716c',
    icon: <Brain className="w-6 h-6" />
  },
  {
    id: 7,
    title: '',
    subtitle: '',
    description: '',
    goal: '',
    color: '#57534e',
    icon: <Sparkles className="w-6 h-6" />
  },
  {
    id: 8,
    title: '',
    subtitle: '',
    description: '',
    goal: '',
    color: '#44403c',
    icon: <Zap className="w-6 h-6" />
  },
  {
    id: 9,
    title: '',
    subtitle: '',
    description: '',
    goal: '',
    color: '#6b7280',
    icon: <TrendingUp className="w-6 h-6" />
  }
];

interface ScenarioSelectionProps {
  onSelectScenario: (scenario: Scenario) => void;
  onLogout: () => void;
  onViewProgress?: () => void;
}

export function ScenarioSelection({ onSelectScenario, onLogout, onViewProgress }: ScenarioSelectionProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-12">
          <div>
            <h1 className="text-3xl font-semibold text-slate-900 mb-2">
              选择咨询场景
            </h1>
            <p className="text-slate-500">
              请选择一个场景开始您的培训评测
            </p>
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

        {/* Scenario Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {scenarios.map((scenario) => (
            <div
              key={scenario.id}
              onClick={() => onSelectScenario(scenario)}
              className="group relative overflow-hidden rounded-2xl bg-white border border-slate-200 hover:border-slate-300 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer"
            >
              {/* Header - Minimalist badge style */}
              <div className="pt-6 px-6">
                <div 
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-white text-sm"
                  style={{ backgroundColor: scenario.color }}
                >
                  <span className="w-4 h-4">{scenario.icon}</span>
                  <span className="font-medium">场景 {scenario.id}</span>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 text-left">
                {scenario.title && (
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">
                    {scenario.title}
                  </h3>
                )}
                {scenario.subtitle && (
                  <p className="text-sm text-slate-500 mb-3">
                    情绪状态: {scenario.subtitle}
                  </p>
                )}
                {scenario.description && (
                  <p className="text-sm text-slate-600 leading-relaxed mb-4 line-clamp-3">
                    {scenario.description}
                  </p>
                )}
                {scenario.goal && (
                  <div className="pt-4 border-t border-slate-100 mb-4">
                    <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                      {scenario.goal}
                    </p>
                  </div>
                )}

                {/* Start Button - 只在有内容时显示 */}
                {scenario.title && (
                  <Button
                    className="w-full text-white hover:opacity-90"
                    style={{ backgroundColor: '#7BC0CD' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectScenario(scenario);
                    }}
                  >
                    开始新的对话
                  </Button>
                )}
              </div>

              {/* Hover Effect */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/0 to-black/0 group-hover:from-black/5 group-hover:to-black/0 transition-all duration-300 pointer-events-none"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// 导出Scenario类型以便其他组件使用
export type { Scenario };