import { createClient } from '@supabase/supabase-js';

// 优先使用环境变量，如果没有则使用默认配置
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://hnlvsrfginhrvrmrrtbd.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_7LkSAJSi4r2Nb1rFwtTALQ_HEmvvZdv';

// 创建 Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 数据库类型定义
export interface Database {
  public: {
    Tables: {
      practice_sessions: {
        Row: {
          id: string;
          user_id: string;
          scenario_name: string;
          total_score: number;
          turns_count: number;
          competency_scores: {
            Professionalism?: number;
            Relational?: number;
            Science?: number;
            Application?: number;
            Education?: number;
            Systems?: number;
          };
          overall_evaluation?: {
            natural_language_feedback: string;
            structured_output: {
              综合得分: number;
              稳定优势: string[];
              结构性短板: string[];
            };
          };
          chart_data?: {
            conversation_stage_curve?: Array<{ dialogue_count: number; stage: number }>;
            session_emotion_timeline?: Array<{ label: string; turn: number }>;
            stress_curve?: Array<{ turn: number; value: number }>;
            emotion_curve?: Array<{ turn: number; value: number }>;
          };
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          scenario_name: string;
          total_score: number;
          turns_count: number;
          competency_scores: {
            Professionalism?: number;
            Relational?: number;
            Science?: number;
            Application?: number;
            Education?: number;
            Systems?: number;
          };
          overall_evaluation?: {
            natural_language_feedback: string;
            structured_output: {
              综合得分: number;
              稳定优势: string[];
              结构性短板: string[];
            };
          };
          chart_data?: {
            conversation_stage_curve?: Array<{ dialogue_count: number; stage: number }>;
            session_emotion_timeline?: Array<{ label: string; turn: number }>;
            stress_curve?: Array<{ turn: number; value: number }>;
            emotion_curve?: Array<{ turn: number; value: number }>;
          };
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          scenario_name?: string;
          total_score?: number;
          turns_count?: number;
          competency_scores?: {
            Professionalism?: number;
            Relational?: number;
            Science?: number;
            Application?: number;
            Education?: number;
            Systems?: number;
          };
          overall_evaluation?: {
            natural_language_feedback: string;
            structured_output: {
              综合得分: number;
              稳定优势: string[];
              结构性短板: string[];
            };
          };
          chart_data?: {
            conversation_stage_curve?: Array<{ dialogue_count: number; stage: number }>;
            session_emotion_timeline?: Array<{ label: string; turn: number }>;
            stress_curve?: Array<{ turn: number; value: number }>;
            emotion_curve?: Array<{ turn: number; value: number }>;
          };
          created_at?: string;
        };
      };
      turn_evaluations: {
        Row: {
          id: string;
          session_id: string;
          turn_number: number;
          score: number;
          counselor_message: string;
          visitor_message: string;
          evaluation: {
            综合得分: number;
            总体评价: string;
            建议: string;
            跳步判断: {
              是否跳步: boolean;
              跳步类型: string;
              督导建议: string;
            };
            natural_language_feedback?: string;
          };
          competency_scores?: {
            Professionalism?: number;
            Relational?: number;
            Science?: number;
            Application?: number;
            Education?: number;
            Systems?: number;
          };
          created_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          turn_number: number;
          score: number;
          counselor_message: string;
          visitor_message: string;
          evaluation: {
            综合得分: number;
            总体评价: string;
            建议: string;
            跳步判断: {
              是否跳步: boolean;
              跳步类型: string;
              督导建议: string;
            };
            natural_language_feedback?: string;
          };
          competency_scores?: {
            Professionalism?: number;
            Relational?: number;
            Science?: number;
            Application?: number;
            Education?: number;
            Systems?: number;
          };
          created_at?: string;
        };
        Update: {
          id?: string;
          session_id?: string;
          turn_number?: number;
          score?: number;
          counselor_message?: string;
          visitor_message?: string;
          evaluation?: {
            综合得分: number;
            总体评价: string;
            建议: string;
            跳步判断: {
              是否跳步: boolean;
              跳步类型: string;
              督导建议: string;
            };
            natural_language_feedback?: string;
          };
          competency_scores?: {
            Professionalism?: number;
            Relational?: number;
            Science?: number;
            Application?: number;
            Education?: number;
            Systems?: number;
          };
          created_at?: string;
        };
      };
    };
  };
}
