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
  // NPC API 可能返回的情绪数据
  session_emotion_timeline?: Array<{ label: string; turn: number }>;
  stress_curve?: Array<{ turn: number; value: number }>;
  emotion_curve?: Array<{ label: string; turn: number } | { turn: number; value: number }>;
}

// NPC API 返回类型（包含消息和情绪数据）
export interface NPCResponse {
  message: string;
  emotionData?: StructuredData;
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
  hintData?: HintData;
  suggestions?: string[];
}

// 结构化 Hint 数据类型
export interface HintData {
  diagnosis: string;
  theory_base: string;
  guidance: string;
  example_reply: string;
}

// 督导反馈结构化类型
export interface SupervisorFeedback {
  risk_assessment: string;
  risk_zone: string;
  safe_alternative: string;
}

const getApiConfig = () => {
  const npcUrl = import.meta.env.VITE_NPC_API_URL || 'https://api.dify.ai/v1';
  const npcKey = import.meta.env.VITE_NPC_API_KEY || 'app-R4FHtuNaBdtN9LzCgECSMUqS';
  const hintUrl = import.meta.env.VITE_HINT_API_URL || 'https://api.dify.ai/v1';
  const hintKey = import.meta.env.VITE_HINT_API_KEY || 'app-8XBYq3cFNVIHX4HqJNXqp28A';
  const supervisorUrl = import.meta.env.VITE_SUPERVISOR_API_URL || 'https://api.dify.ai/v1';
  const supervisorKey = import.meta.env.VITE_SUPERVISOR_API_KEY || 'app-yQp1aS5YSKGlUEmlMpqY7rwG';

  console.log('API配置:', { npcUrl, npcKey, hintUrl, hintKey, supervisorUrl, supervisorKey });

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
    // 构建payload，只在有conversationId时才添加该字段
    const difyPayload: ChatMessage = {
      inputs,
      query,
      response_mode: 'blocking',
      user: 'workplace_user'
    };

    // 只在有conversationId时才添加该字段（Dify首次调用不传此字段）
    if (conversationId) {
      difyPayload.conversation_id = conversationId;
    }

    const requestUrl = '/api/dify';
    const fetchBody = {
      apiUrl,
      apiKey,
      payload: difyPayload
    };

    console.log('API调用参数:', { apiUrl, inputs, query: query.substring(0, 100) });
    console.log('完整payload:', JSON.stringify(difyPayload, null, 2));

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
          console.error('API错误:', errorText);
          throw new Error(`API请求失败: ${response.status} ${errorText}`);
        }

        const data = await response.json();
        console.log('API响应:', data);
        return data;
      } catch (error) {
        console.error(`API调用失败 (尝试 ${attempt + 1}/${retries + 1}):`, error);
        if (attempt === retries) {
          throw new Error(`API调用失败: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
        await new Promise(resolve => setTimeout(resolve, 2000 * (attempt + 1)));
      }
    }

    throw new Error('Unexpected error');
  }

  // 调用 NPC API（带教老师）
  async callNPC(message: string, personaTitle: string, scenarioTitle?: string): Promise<NPCResponse> {
    const config = getApiConfig().npc;

    console.log('使用NPC人设:', personaTitle);
    if (scenarioTitle) {
      console.log('使用场景:', scenarioTitle);
    }

    // 只在第一次创建会话时传入人设和场景参数
    // 后续调用通过 conversation_id 继续对话，不需要再传这些参数
    const inputs: Record<string, any> = {};

    // 每次调用都传入人设和场景参数（Dify工作流需要这些参数）
    inputs.npc_persona = personaTitle;
    if (scenarioTitle) {
      inputs.scenario = scenarioTitle;
    }

    if (!this.conversationId) {
      console.log('首次调用，发送人设和场景参数');
    } else {
      console.log('继续对话，仍发送人设和场景参数');
    }

    console.log('发送给NPC API的inputs:', JSON.stringify(inputs, null, 2));

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

    // 调试：打印Dify返回的完整响应
    console.log('Dify完整响应:', JSON.stringify(response, null, 2));

    // 提取情绪数据（如果存在）
    const emotionData: StructuredData = {};

    // Dify把情绪数据放在answer文本中，需要解析出来
    // 尝试从answer中提取JSON格式的情绪数据
    // 使用更宽松的正则表达式来匹配包含嵌套大括号的JSON
    const emotionDataMatch = response.answer.match(/\{\s*"session_emotion_timeline"[\s\S]*?"stress_curve"[\s\S]*?"emotion_curve"[\s\S]*?\n?\}/);
    if (emotionDataMatch) {
      try {
        let jsonString = emotionDataMatch[0];
        console.log('提取到的JSON字符串:', jsonString);

        // 替换Unicode转义序列
        jsonString = jsonString.replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));

        const parsedEmotionData = JSON.parse(jsonString);

        if (parsedEmotionData.session_emotion_timeline) {
          emotionData.session_emotion_timeline = parsedEmotionData.session_emotion_timeline;
        }
        if (parsedEmotionData.stress_curve) {
          emotionData.stress_curve = parsedEmotionData.stress_curve;
        }
        if (parsedEmotionData.emotion_curve) {
          emotionData.emotion_curve = parsedEmotionData.emotion_curve;
        }

        console.log('从answer中解析出的情绪数据:', emotionData);
      } catch (e) {
        console.warn('解析answer中的情绪数据失败:', e);
      }
    } else {
      console.warn('未能从answer中匹配到情绪数据JSON');
    }

    // 同时检查响应中的独立字段（如果有）
    if (response.session_emotion_timeline) {
      emotionData.session_emotion_timeline = response.session_emotion_timeline;
    }
    if (response.stress_curve) {
      emotionData.stress_curve = response.stress_curve;
    }
    if (response.emotion_curve) {
      // 处理 emotion_curve - 可能包含 label 或 value
      emotionData.emotion_curve = response.emotion_curve.map(item => {
        if ('label' in item) {
          // 如果有 label 字段，将其转换为 value
          // 这里需要根据实际的情绪标签来映射数值
          const emotionValueMap: Record<string, number> = {
            '愤怒': 80,
            '焦虑': 70,
            '紧张': 60,
            '轻视': 30,
            '困惑': 20,
            '失望': 10,
            '平静': 0,
            '放松': -20,
            '满意': -30,
            '期待': -40
          };
          return {
            turn: item.turn,
            value: emotionValueMap[item.label] || 0
          };
        } else {
          // 已经有 value 字段，直接返回
          return item as { turn: number; value: number };
        }
      });
    }

    // 清理NPC返回的消息，移除JSON数据和场景描述
    let cleanAnswer = response.answer;

    // 移除场景描述和人设描述（以特定关键词开头的内容）
    const removePatterns = [
      /特征：[\s\S]*?(?=背景情境：|具体事件：|$)/g,
      /背景情境：[\s\S]*?(?=具体事件：|口头禅：|特征：|$)/g,
      /具体事件：[\s\S]*?(?=口头禅：|行为红线：|特征：|$)/g,
      /口头禅：[\s\S]*?(?=行为红线：|特征：|背景情境：|$)/g,
      /行为红线：[\s\S]*?(?=特征：|背景情境：|具体事件：|$)/g
    ];

    removePatterns.forEach(pattern => {
      cleanAnswer = cleanAnswer.replace(pattern, '');
    });

    // 移除JSON数据块（包括各种格式）
    // 1. 移除完整的JSON对象（包括session_emotion_timeline等）
    cleanAnswer = cleanAnswer.replace(/\{[\s\S]*?(session_emotion_timeline|stress_curve|emotion_curve)[\s\S]*?\n?\}/g, '');
    // 2. 移除不完整的JSON片段和残留符号
    cleanAnswer = cleanAnswer.replace(/\],\s*"[a-z_]+":\s*\[[\s\S]*?\}/g, '');
    cleanAnswer = cleanAnswer.replace(/\[[\s\S]*?"turn":\s*\d+[\s\S]*?\}/g, '');
    cleanAnswer = cleanAnswer.replace(/\],\s*\}/g, '');
    cleanAnswer = cleanAnswer.replace(/\{\s*/g, '');
    cleanAnswer = cleanAnswer.replace(/\}\s*/g, '');
    cleanAnswer = cleanAnswer.replace(/\]\s*/g, '');
    cleanAnswer = cleanAnswer.replace(/"\s*/g, '');

    // 清理多余的空行
    cleanAnswer = cleanAnswer.replace(/\n{3,}/g, '\n\n').trim();

    return {
      message: cleanAnswer,
      emotionData: Object.keys(emotionData).length > 0 ? emotionData : undefined
    };
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
${structuredDataText}`;

    console.log('调用Hint API');

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

      const answer = response.answer;
      console.log('Hint API响应:', answer);

      return { hint: answer };
    } catch (error) {
      console.error('Hint API调用失败:', error);
      return { hint: '请根据当前情境，思考如何回应带教老师。注意保持礼貌和专业。' };
    }
  }

  // 解析督导反馈
  private parseSupervisorFeedback(text: string): SupervisorFeedback {
    const feedback: SupervisorFeedback = {
      risk_assessment: '',
      risk_zone: '',
      safe_alternative: ''
    };

    console.log('解析督导反馈原文:', text);

    // 提取【风险判定】
    const riskMatch = text.match(/【风险判定】\s*([\s\S]*?)(?=【雷区定位】|$)/);
    if (riskMatch) {
      feedback.risk_assessment = cleanSupervisorText(riskMatch[1]);
    }

    // 提取【雷区定位】
    const zoneMatch = text.match(/【雷区定位】\s*([\s\S]*?)(?=【安全替换】|$)/);
    if (zoneMatch) {
      feedback.risk_zone = cleanSupervisorText(zoneMatch[1]);
    }

    // 提取【安全替换】
    const altMatch = text.match(/【安全替换】\s*([\s\S]*?)$/);
    if (altMatch) {
      feedback.safe_alternative = cleanSupervisorText(altMatch[1]);
    }

    // 如果没有匹配到，尝试从JSON中解析
    if (!feedback.risk_assessment && !feedback.risk_zone && !feedback.safe_alternative) {
      const jsonMatch = text.match(/\{[\s\S]*?\}/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          if (parsed.risk_test && typeof parsed.risk_test === 'string') {
            const riskTest = parsed.risk_test;
            const r1 = riskTest.match(/【风险判定】([\s\S]*?)(?=【雷区定位】|$)/);
            const r2 = riskTest.match(/【雷区定位】([\s\S]*?)(?=【安全替换】|$)/);
            const r3 = riskTest.match(/【安全替换】([\s\S]*?)$/);
            if (r1) feedback.risk_assessment = cleanSupervisorText(r1[1]);
            if (r2) feedback.risk_zone = cleanSupervisorText(r2[1]);
            if (r3) feedback.safe_alternative = cleanSupervisorText(r3[1]);
          }
        } catch {
          // JSON解析失败
        }
      }
    }

    console.log('解析后的督导反馈:', feedback);

    return feedback;
  }

  // 调用 Supervisor API（社交督导）
  async callSupervisorAPI(
    scenario: string,
    persona: string,
    chatHistory: ChatMessageItem[],
    userReply: string,
    structuredData: StructuredData
  ): Promise<SupervisorFeedback> {
    const config = getApiConfig().supervisor;

    console.log('调用Supervisor API，配置:', config);

    // 构建对话历史字符串
    const historyText = chatHistory.map(msg => {
      const role = msg.role === 'user' ? '职场新人' : '带教老师';
      return `${role}: ${msg.content}`;
    }).join('\n');

    // 构建结构化数据字符串 - 只有在有数据时才包含
    let structuredDataSection = '';
    if (structuredData && (
      structuredData.session_emotion_timeline?.length > 0 ||
      structuredData.stress_curve?.length > 0 ||
      structuredData.emotion_curve?.length > 0
    )) {
      const structuredDataText = JSON.stringify(structuredData, null, 2);
      structuredDataSection = `\n【结构化数据】\n${structuredDataText}`;
    }

    const query = `【对话场景】
${scenario}

【NPC人设】
${persona}

【对话历史】
${historyText}

【用户本轮回复】
${userReply}
${structuredDataSection}

请对职场新人的本轮回复进行评价和反馈，严格按照以下格式输出：
【风险判定】...
【雷区定位】...
【安全替换】...`;

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
      console.log('Supervisor API原始响应:', answer);

      // 解析三个模块
      const feedback = this.parseSupervisorFeedback(answer);

      return feedback;
    } catch (error) {
      console.error('Supervisor API调用失败:', error);
      return {
        risk_assessment: '暂时无法获取督导评价',
        risk_zone: '',
        safe_alternative: ''
      };
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

// 清理督导反馈文本的辅助函数
function cleanSupervisorText(text: string): string {
  return text
    .trim()
    .replace(/\n+$/g, '')                    // 移除末尾的换行
    .replace(/["'}\]]+\s*\}\s*["']*\s*$/g, '')  // 移除末尾的引号、大括号、中括号（包括可能的JSON标记）
    .replace(/^[{"'\[]+\s*/g, '')            // 移除开头的引号、大括号、中括号
    .replace(/\s*```[\s\S]*?```/g, '')       // 移除代码块标记
    .trim();
}

export const workplaceApiService = new WorkplaceApiService();
