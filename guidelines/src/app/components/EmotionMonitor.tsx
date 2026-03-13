"use client";

import { LineChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, AreaChart, Area } from 'recharts';
import { Brain, Activity } from 'lucide-react';

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

// 情绪颜色映射
const EMOTION_COLORS: Record<string, string> = {
  '平静': '#4CAF50',
  '困惑': '#FF9800',
  '愤怒': '#F44336',
  '焦虑': '#FF5722',
  '轻视': '#9C27B0',
  '满意': '#2196F3',
  '失望': '#795548',
  '期待': '#00BCD4',
  '紧张': '#E91E63',
  '放松': '#8BC34A',
};

const EMOTION_ORDER = ['愤怒', '焦虑', '紧张', '轻视', '困惑', '失望', '平静', '放松', '满意', '期待'];

export function EmotionMonitor({ emotionTimeline, stressCurve, emotionCurve }: EmotionMonitorProps) {
  // 处理数据用于图表显示
  const processedStressData = stressCurve.map(d => ({
    turn: `轮${d.turn}`,
    value: Math.round(d.value * 100)
  }));

  const processedEmotionData = emotionCurve.map(d => ({
    turn: `轮${d.turn}`,
    value: Math.round((d.value + 50) * 2) // 将 -50~50 映射到 0~100
  }));

  // 计算当前情绪分布
  const currentEmotionDistribution = emotionTimeline.reduce((acc, point) => {
    acc[point.label] = (acc[point.label] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const sortedEmotions = EMOTION_ORDER.filter(emotion => currentEmotionDistribution[emotion] > 0);
  const totalEmotions = Object.values(currentEmotionDistribution).reduce((a, b) => a + b, 0) || 1;

  return (
    <div className="flex flex-col gap-4">
      {/* 情绪标签进度条 */}
      <div>
        <div className="flex items-center gap-1.5 mb-2">
          <Brain className="w-3.5 h-3.5" style={{ color: 'rgb(60,155,201)' }} />
          <h4 className="text-xs font-semibold text-[rgb(45,45,45)]">情绪分布</h4>
        </div>
        <div className="h-3 rounded-full overflow-hidden flex" style={{ backgroundColor: 'rgba(60,155,201,0.1)' }}>
          {sortedEmotions.map((emotion, index) => {
            const percentage = (currentEmotionDistribution[emotion] / totalEmotions) * 100;
            const color = EMOTION_COLORS[emotion] || '#999';
            return (
              <div
                key={emotion}
                className="h-full transition-all duration-500 ease-in-out group relative"
                style={{
                  width: `${percentage}%`,
                  backgroundColor: color,
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
                style={{ backgroundColor: EMOTION_COLORS[emotion] }}
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
                domain={[0, 100]}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-white border border-gray-200 rounded-lg px-2 py-1 shadow-lg">
                        <p className="text-xs text-[rgb(45,45,45)]">{`轮次: ${payload[0].payload.turn}`}</p>
                        <p className="text-xs font-semibold" style={{ color: 'rgb(249,127,95)' }}>{`压力: ${payload[0].value}%`}</p>
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
                domain={[0, 100]}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-white border border-gray-200 rounded-lg px-2 py-1 shadow-lg">
                        <p className="text-xs text-[rgb(45,45,45)]">{`轮次: ${payload[0].payload.turn}`}</p>
                        <p className="text-xs font-semibold" style={{ color: 'rgb(60,155,201)' }}>{`强度: ${payload[0].value}%`}</p>
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
