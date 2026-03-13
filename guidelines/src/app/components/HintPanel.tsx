"use client";

import { useState } from 'react';
import { Lightbulb, ChevronDown, ChevronRight, BookOpen, Target, MessageSquare, Copy } from 'lucide-react';
import { Button } from './ui/button';
import { HintData } from '@/app/services/api';

interface HintPanelProps {
  hintData: HintData;
  onUseExample: (example: string) => void;
}

// 模块配置
const SECTIONS = [
  {
    key: 'diagnosis' as const,
    label: '情境诊断',
    icon: Target,
    color: 'rgb(249,127,95)',
    bgLight: 'rgb(249,127,95,0.1)',
  },
  {
    key: 'theory_base' as const,
    label: '理论依据',
    icon: BookOpen,
    color: 'rgb(60,155,201)',
    bgLight: 'rgb(60,155,201,0.1)',
  },
  {
    key: 'guidance' as const,
    label: '应对指导',
    icon: Lightbulb,
    color: 'rgb(60,155,201)',
    bgLight: 'rgb(60,155,201,0.1)',
  },
  {
    key: 'example_reply' as const,
    label: '示例回复',
    icon: MessageSquare,
    color: 'rgb(176,214,169)',
    bgLight: 'rgb(176,214,169,0.2)',
  },
];

export function HintPanel({ hintData, onUseExample }: HintPanelProps) {
  // 默认所有模块都折叠
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  const toggleSection = (key: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };

  const expandAll = () => {
    setExpandedSections(new Set(SECTIONS.map(s => s.key)));
  };

  const collapseAll = () => {
    setExpandedSections(new Set());
  };

  return (
    <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgb(254,225,153)', backgroundColor: 'rgb(254,225,153,0.15)' }}>
      {/* 标题栏 */}
      <div className="px-3 py-2 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(254,225,153,0.3)' }}>
        <div className="flex items-center gap-2">
          <Lightbulb className="w-4 h-4" style={{ color: 'rgb(249,127,95)' }} />
          <span className="text-sm font-semibold" style={{ color: 'rgb(249,127,95)' }}>智能回复建议</span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={expandAll}
            className="text-xs px-2 py-1 h-auto hover:bg-[rgb(60,155,201,0.1)]"
            style={{ color: 'rgb(60,155,201)' }}
          >
            全部展开
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={collapseAll}
            className="text-xs px-2 py-1 h-auto hover:bg-[rgb(60,155,201,0.1)]"
            style={{ color: 'rgb(60,155,201)' }}
          >
            全部折叠
          </Button>
        </div>
      </div>

      {/* 内容区域 */}
      <div className="p-3 space-y-2">
        {SECTIONS.map(section => {
          const Icon = section.icon;
          const isExpanded = expandedSections.has(section.key);
          const content = hintData[section.key];

          return (
            <div
              key={section.key}
              className="rounded-lg overflow-hidden border transition-all"
              style={{
                borderColor: isExpanded ? section.color : 'rgba(0,0,0,0.1)',
                backgroundColor: isExpanded ? 'white' : 'rgba(255,255,255,0.5)',
              }}
            >
              {/* 标题栏（可点击折叠/展开） */}
              <button
                onClick={() => toggleSection(section.key)}
                className="w-full px-3 py-2 flex items-center justify-between hover:bg-black/5 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Icon className="w-3.5 h-3.5" style={{ color: section.color }} />
                  <span className="text-xs font-semibold" style={{ color: section.color }}>
                    {section.label}
                  </span>
                </div>
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 text-[rgb(122,122,122)]" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-[rgb(122,122,122)]" />
                )}
              </button>

              {/* 内容（折叠时隐藏） */}
              {isExpanded && (
                <div className="px-3 pb-3">
                  <div
                    className="text-xs leading-relaxed whitespace-pre-wrap"
                    style={{ color: 'rgb(45,45,45)' }}
                  >
                    {content}
                  </div>

                  {/* 示例回复特殊处理：添加"使用"按钮 */}
                  {section.key === 'example_reply' && (
                    <div className="mt-2 pt-2" style={{ borderTop: '1px dashed rgba(0,0,0,0.1)' }}>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onUseExample(content)}
                        className="text-xs px-3 py-1.5 h-auto flex items-center gap-1 hover:bg-[rgb(60,155,201,0.1)]"
                        style={{ color: 'rgb(60,155,201)' }}
                      >
                        <Copy className="w-3 h-3" />
                        使用此示例
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
