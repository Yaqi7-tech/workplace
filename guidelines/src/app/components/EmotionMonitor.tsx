"use client";

import { LineChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, AreaChart, Area } from 'recharts';
import { Brain, Activity } from 'lucide-react';
import { THEME_COLORS } from '@/app/config/workplaceScenarios';

interface EmotionDataPoint {
  turn: number;
  value: number;
}

interface EmotionTimelinePoint {
  label: string;
  turn: number;
}

interface EmotionMonitorProps {
  emotionTimeline: EmotionTimelinePoint[];
  stressCurve: EmotionDataPoint[];
  emotionCurve: EmotionDataPoint[];
}

// 情绪颜色映射（使用主题色渐变）
const EMOTION_COLORS: Record<string, { start: string; end: string }> = {
  '平静': { start: THEME_COLORS.greenLight, end: THEME_COLORS.cyan },
  '困惑': { start: THEME_COLORS.yellow, end: THEME_COLORS.lightOrange },
  '愤怒': { start: THEME_COLORS.red, end: THEME_COLORS.orange },
  '焦虑': { start: THEME_COLORS.orange, end: THEME_COLORS.lightOrange },
  '轻视': { start: THEME_COLORS.lightOrange, end: THEME_COLORS.yellow },
  '满意': { start: THEME_COLORS.cyan, end: THEME_COLORS.blue },
  '失望': { start: THEME_COLORS.yellowLight, end: THEME_COLORS.yellow },
  '期待': { start: THEME_COLORS.greenLight, end: THEME_COLORS.cyan },
  '紧张': { start: THEME_COLORS.orange, end: THEME_COLORS.red },
  '放松': { start: THEME_COLORS.greenLight, end: THEME_COLORS.cyan },
  '麻木': { start: 'rgb(150, 150, 150)', end: 'rgb(200, 200, 200)' }, // 灰色渐变
};

const EMOTION_ORDER = ['愤怒', '焦虑', '紧张', '轻视', '困惑', '失望', '平静', '放松', '满意', '期待'];

export function EmotionMonitor({ emotionTimeline, stressCurve, emotionCurve }: EmotionMonitorProps) {
  // 处理数据用于图表显示
  // 压力值范围 0-1，情绪值范围 -1 到 1
  const processedStressData = stressCurve.map(d => ({
    turn: `轮${d.turn}`,
    value: d.value // 保持原始值 0-1
  }));

  const processedEmotionData = emotionCurve.map(d => ({
    turn: `轮${d.turn}`,
    value: d.value // 保持原始值 -1 到 1
  }));

  // 计算当前情绪分布
  const currentEmotionDistribution = emotionTimeline.reduce((acc, point) => {
    acc[point.label] = (acc[point.label] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // 扩展情绪顺序，包含"麻木"
  const EXTENDED_EMOTION_ORDER = [...EMOTION_ORDER, '麻木'];

  const sortedEmotions = EXTENDED_EMOTION_ORDER.filter(emotion => currentEmotionDistribution[emotion] > 0);
  const totalEmotions = Object.values(currentEmotionDistribution).reduce((a, b) => a + b, 0) || 1;

  // 调试日志
  console.log('EmotionMonitor - emotionTimeline:', emotionTimeline);
  console.log('EmotionMonitor - currentEmotionDistribution:', currentEmotionDistribution);
  console.log('EmotionMonitor - sortedEmotions:', sortedEmotions);

  return (
    <div className="flex flex-col gap-4">
      {/* 情绪标签进度条 */}
      <div>
        <div className="flex items-center gap-1.5 mb-2">
          <Brain className="w-3.5 h-3.5" style={{ color: 'rgb(60,155,201)' }} />
          <h4 className="text-xs font-semibold text-[rgb(45,45,45)]">情绪分布</h4>
        </div>
        <div className="h-3 rounded-full overflow-hidden flex" style={{ backgroundColor: 'rgba(60,155,201,0.1)' }}>
          {sortedEmotions.map((emotion) => {
            const percentage = (currentEmotionDistribution[emotion] / totalEmotions) * 100;
            const colors = EMOTION_COLORS[emotion] || { start: '#999', end: '#ccc' };
            const backgroundStyle = `linear-gradient(90deg, ${colors.start}, ${colors.end})`;

            console.log(`Emotion: ${emotion}, Percentage: ${percentage}%, Background: ${backgroundStyle}`);

            return (
              <div
                key={emotion}
                className="h-full transition-all duration-500 ease-in-out group relative"
                style={{
                  width: `${percentage}%`,
                  background: backgroundStyle,
                  minWidth: percentage > 0 ? '2px' : '0'
                }}
                title={`${emotion}: ${currentEmotionDistribution[emotion]}次 (${percentage.toFixed(1)}%)`}
              >
                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none transition-opacity z-10">
                  {emotion}: {currentEmotionDistribution[emotion]}次 ({percentage.toFixed(1)}%)
                </div>
              </div>
            );
          })}
        </div>
        {/* 图例 */}
        <div className="flex flex-wrap gap-1.5 mt-2">
          {sortedEmotions.map(emotion => (
            <div key={emotion} className="flex items-center gap-1">
              <div
                className="w-2 h-2 rounded-full"
                style={{
                  background: `linear-gradient(135deg, ${EMOTION_COLORS[emotion]?.start || '#999'}, ${EMOTION_COLORS[emotion]?.end || '#ccc'})`
                }}
              />
              <span className="text-xs text-[rgb(122,122,122)]">{emotion}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 压力强度折线图 */}
      <div>
        <div className="flex items-center gap-1.5 mb-2">
          <Activity className="w-3.5 h-3.5" style={{ color: 'rgb(249,127,95)' }} />
          <h4 className="text-xs font-semibold text-[rgb(45,45,45)]">压力强度</h4>
        </div>
        <div className="h-20">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={processedStressData}>
              <defs>
                <linearGradient id="stressGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="rgb(249,127,95)" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="rgb(249,127,95)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(60,155,201,0.1)" />
              <XAxis
                dataKey="turn"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 9, fill: 'rgb(122,122,122)' }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 9, fill: 'rgb(122,122,122)' }}
                domain={[0, 1]}
                tickFormatter={(value) => value.toFixed(1)}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-white border border-gray-200 rounded-lg px-2 py-1 shadow-lg">
                        <p className="text-xs text-[rgb(45,45,45)]">{`轮次: ${payload[0].payload.turn}`}</p>
                        <p className="text-xs font-semibold" style={{ color: 'rgb(249,127,95)' }}>{`压力: ${(payload[0].value).toFixed(2)}`}</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="rgb(249,127,95)"
                strokeWidth={2}
                fill="url(#stressGradient)"
                activeDot={{ r: 4 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 情感强度折线图 */}
      <div>
        <div className="flex items-center gap-1.5 mb-2">
          <Brain className="w-3.5 h-3.5" style={{ color: 'rgb(60,155,201)' }} />
          <h4 className="text-xs font-semibold text-[rgb(45,45,45)]">情感强度</h4>
        </div>
        <div className="h-20">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={processedEmotionData}>
              <defs>
                <linearGradient id="emotionGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="rgb(60,155,201)" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="rgb(60,155,201)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(60,155,201,0.1)" />
              <XAxis
                dataKey="turn"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 9, fill: 'rgb(122,122,122)' }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 9, fill: 'rgb(122,122,122)' }}
                domain={[-1, 1]}
                tickFormatter={(value) => value.toFixed(1)}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const value = payload[0].value;
                    const emotionLabel = value > 0.3 ? '积极' : value < -0.3 ? '消极' : '中性';
                    return (
                      <div className="bg-white border border-gray-200 rounded-lg px-2 py-1 shadow-lg">
                        <p className="text-xs text-[rgb(45,45,45)]">{`轮次: ${payload[0].payload.turn}`}</p>
                        <p className="text-xs font-semibold" style={{ color: 'rgb(60,155,201)' }}>{`强度: ${value.toFixed(2)} (${emotionLabel})`}</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="rgb(60,155,201)"
                strokeWidth={2}
                fill="url(#emotionGradient)"
                activeDot={{ r: 4 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
