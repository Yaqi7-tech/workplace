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

const getApiConfig = () => {
  const npcUrl = import.meta.env.VITE_NPC_API_URL || 'https://api.dify.ai/v1';
  const npcKey = import.meta.env.VITE_NPC_API_KEY || '';

  return {
    npc: { url: npcUrl, key: npcKey }
  };
};

export class WorkplaceApiService {
  private conversationId: string | null = null;

  private async callDifyAPI(
    message: string,
    retries = 2,
    timeoutMs = 120000
  ): Promise<DifyResponse> {
    const config = getApiConfig().npc;

    const difyPayload: ChatMessage = {
      inputs: {},
      query: message,
      response_mode: 'blocking',
      conversation_id: this.conversationId || '',
      user: 'workplace_user'
    };

    // 使用代理方式（开发环境用 Vite 代理，生产环境用 Vercel 代理）
    const requestUrl = '/api/dify';
    const fetchBody = {
      apiUrl: config.url,
      apiKey: config.key,
      payload: difyPayload
    };

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

        console.log(`API调用 (尝试 ${attempt + 1}/${retries + 1}):`, {
          targetUrl: config.url,
          message: message.substring(0, 50) + '...'
        });

        const response = await fetch(requestUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          signal: controller.signal,
          body: JSON.stringify(fetchBody)
        });

        clearTimeout(timeoutId);

        console.log(`API响应状态 (尝试 ${attempt + 1}):`, response.status);

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`API错误响应 (尝试 ${attempt + 1}):`, errorText);
          throw new Error(`API请求失败: ${response.status} ${errorText}`);
        }

        const data = await response.json();
        console.log(`API调用成功 (尝试 ${attempt + 1})`);

        // 保存会话ID
        if (data.conversation_id) {
          this.conversationId = data.conversation_id;
        }

        return data;
      } catch (error) {
        console.warn(`API调用失败 (尝试 ${attempt + 1}/${retries + 1}):`, error);

        if (attempt === retries) {
          throw new Error(`API调用失败: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }

        await new Promise(resolve => setTimeout(resolve, 2000 * (attempt + 1)));
      }
    }

    throw new Error('Unexpected error');
  }

  async callNPC(message: string): Promise<string> {
    const response = await this.callDifyAPI(message);
    return response.answer;
  }

  resetConversation() {
    this.conversationId = null;
  }

  getConversationId(): string | null {
    return this.conversationId;
  }
}

export const workplaceApiService = new WorkplaceApiService();
