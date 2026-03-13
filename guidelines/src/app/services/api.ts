interface ChatMessage {
  inputs: Record<string, any>;
  query: string;
  response_mode: 'blocking' | 'streaming';
  conversation_id?: string;
  user: string;
}

interface DifyResponse {
  answer: string;
  conversation_id: string;
}

// 对话消息类型
export interface ChatMessageItem {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

// 结构化数据类型
export interface StructuredData {
  session_emotion_timeline?: Array<{ label: string; turn: number }>;
  stress_curve?: Array<{ turn: number; value: number }>;
  emotion_curve?: Array<{ turn: number; value: number }>;
}

// Hint API 响应类型
export interface HintResponse {
  hint: string;
  suggestions?: string[];
}

// Supervisor API 响应类型
export interface SupervisorResponse {
  feedback: string;
  score?: number;
  improvements?: string[];
}

const getApiConfig = () => {
  const npcUrl = import.meta.env.VITE_NPC_API_URL || 'https://api.dify.ai/v1';
  const npcKey = import.meta.env.VITE_NPC_API_KEY || 'app-R4FHtuNaBdtN9LzCgECSMUqS';
  const hintUrl = import.meta.env.VITE_HINT_API_URL || 'https://api.dify.ai/v1';
  const hintKey = import.meta.env.VITE_HINT_API_KEY || 'app-yQp1aS5YSKGlUEmlMpqY7rwG';
  const supervisorUrl = import.meta.env.VITE_SUPERVISOR_API_URL || 'https://api.dify.ai/v1';
  const supervisorKey = import.meta.env.VITE_SUPERVISOR_API_KEY || 'app-yQp1aS5YSKGlUEmlMpqY7rwG';

  return {
    npc: { url: npcUrl, key: npcKey },
    hint: { url: hintUrl, key: hintKey },
    supervisor: { url: supervisorUrl, key: supervisorKey }
  };
};

export class WorkplaceApiService {
  private conversationId: string | null = null;
  private hintConversationId: string | null = null;
  private supervisorConversationId: string | null = null;

  private async callDifyAPI(
    apiUrl: string,
    apiKey: string,
    query: string,
    inputs: Record<string, any> = {},
    conversationId: string | null = null,
    retries = 2,
    timeoutMs = 120000
  ): Promise<DifyResponse> {
    const difyPayload: ChatMessage = {
      inputs,
      query,
      response_mode: 'blocking',
      conversation_id: conversationId || '',
      user: 'workplace_user'
    };

    const requestUrl = '/api/dify';
    const fetchBody = {
      apiUrl,
      apiKey,
      payload: difyPayload
    };

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

        const response = await fetch(requestUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify(fetchBody)
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`API请求失败: ${response.status} ${errorText}`);
        }

        const data = await response.json();
        return data;
      } catch (error) {
        if (attempt === retries) {
          throw new Error(`API调用失败: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
        await new Promise(resolve => setTimeout(resolve, 2000 * (attempt + 1)));
      }
    }

    throw new Error('Unexpected error');
  }

  // 调用 NPC API（带教老师）
  async callNPC(message: string, systemPrompt?: string): Promise<string> {
    const config = getApiConfig().npc;
    const inputs = systemPrompt ? { system_prompt: systemPrompt } : {};

    const response = await this.callDifyAPI(
      config.url,
      config.key,
      message,
      inputs,
      this.conversationId
    );

    if (response.conversation_id) {
      this.conversationId = response.conversation_id;
    }

    return response.answer;
  }

  // 调用 Hint API（生成提示）
  async callHintAPI(
    scenario: string,
    persona: string,
    chatHistory: ChatMessageItem[],
    structuredData: StructuredData
  ): Promise<HintResponse> {
    const config = getApiConfig().hint;

    // 构建对话历史字符串
    const historyText = chatHistory.map(msg => {
      const role = msg.role === 'user' ? '职场新人' : '带教老师';
      const time = msg.timestamp.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
      return `[${time}] ${role}: ${msg.content}`;
    }).join('\n');

    // 构建结构化数据字符串
    const structuredDataText = JSON.stringify(structuredData, null, 2);

    const query = `【对话场景】
${scenario}

【NPC人设】
${persona}

【对话历史】
${historyText || '（暂无对话记录）'}

【结构化数据】
${structuredDataText}

请基于以上信息，为职场新人生成下一轮回复的提示建议。`;

    try {
      const response = await this.callDifyAPI(
        config.url,
        config.key,
        query,
        {},
        this.hintConversationId
      );

      if (response.conversation_id) {
        this.hintConversationId = response.conversation_id;
      }

      // 解析响应
      const answer = response.answer;

      // 尝试提取JSON格式的提示
      const jsonMatch = answer.match(/\{[\s\S]*?\}/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          return {
            hint: parsed.hint || answer,
            suggestions: parsed.suggestions || []
          };
        } catch {
          // JSON解析失败，返回原始响应
        }
      }

      return { hint: answer };
    } catch (error) {
      console.error('Hint API调用失败:', error);
      // 返回默认提示
      return { hint: '请根据当前情境，思考如何回应带教老师。注意保持礼貌和专业。' };
    }
  }

  // 调用 Supervisor API（社交督导）
  async callSupervisorAPI(
    scenario: string,
    persona: string,
    chatHistory: ChatMessageItem[],
    userReply: string,
    structuredData: StructuredData
  ): Promise<SupervisorResponse> {
    const config = getApiConfig().supervisor;

    // 构建对话历史字符串
    const historyText = chatHistory.map(msg => {
      const role = msg.role === 'user' ? '职场新人' : '带教老师';
      return `${role}: ${msg.content}`;
    }).join('\n');

    // 构建结构化数据字符串
    const structuredDataText = JSON.stringify(structuredData, null, 2);

    const query = `【对话场景】
${scenario}

【NPC人设】
${persona}

【对话历史】
${historyText}

【用户本轮回复】
${userReply}

【结构化数据】
${structuredDataText}

请对职场新人的本轮回复进行评价和反馈。`;

    try {
      const response = await this.callDifyAPI(
        config.url,
        config.key,
        query,
        {},
        this.supervisorConversationId
      );

      if (response.conversation_id) {
        this.supervisorConversationId = response.conversation_id;
      }

      const answer = response.answer;

      // 尝试提取结构化反馈
      const jsonMatch = answer.match(/\{[\s\S]*?\}/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          return {
            feedback: parsed.feedback || answer,
            score: parsed.score,
            improvements: parsed.improvements || []
          };
        } catch {
          // JSON解析失败
        }
      }

      return { feedback: answer };
    } catch (error) {
      console.error('Supervisor API调用失败:', error);
      return { feedback: '督导评价暂时无法获取，请稍后再试。' };
    }
  }

  resetConversation() {
    this.conversationId = null;
    this.hintConversationId = null;
    this.supervisorConversationId = null;
  }

  getConversationId(): string | null {
    return this.conversationId;
  }
}

export const workplaceApiService = new WorkplaceApiService();
