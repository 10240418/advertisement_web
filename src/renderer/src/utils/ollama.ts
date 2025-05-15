import axios from "axios";

const OLLAMA_API_URL = "http://localhost:11434/api";

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

interface ChatRequest {
  model: string;
  messages: ChatMessage[];
  stream?: boolean;
  options?: {
    temperature?: number;
  };
  tools?: any[];
}

interface ChatResponse {
  message: {
    role: string;
    content: string;
  };
  done: boolean;
  model: string;
  created_at: string;
}

interface ModelInfo {
  name: string;
  size: string;
  modified_at: string;
  digest: string;
}

interface ModelsResponse {
  models: ModelInfo[];
}

export const ollamaApi = {
  /**
   * 发送聊天请求到Ollama
   */
  sendChatRequest: async (request: ChatRequest): Promise<ChatResponse> => {
    try {
      const response = await axios.post<ChatResponse>(
        `${OLLAMA_API_URL}/chat`,
        request,
      );
      return response.data;
    } catch (error) {
      console.error("Ollama API 请求失败:", error);
      throw error;
    }
  },

  /**
   * 检查Ollama服务是否可用
   */
  checkAvailability: async (): Promise<boolean> => {
    try {
      await axios.get(`${OLLAMA_API_URL}/version`);
      return true;
    } catch (error) {
      console.error("Ollama服务不可用:", error);
      return false;
    }
  },

  /**
   * 获取可用模型列表
   */
  getAvailableModels: async (): Promise<string[]> => {
    try {
      const response = await axios.get<ModelsResponse>(
        `${OLLAMA_API_URL}/tags`,
      );
      return response.data.models.map((model) => model.name);
    } catch (error) {
      console.error("获取模型列表失败:", error);
      return [];
    }
  },

  /**
   * 使用工具调用进行天气查询（示例）
   */
  getWeatherInfo: async (
    location: string,
    model = "llama3:7b",
  ): Promise<string> => {
    try {
      const toolRequest = {
        model,
        messages: [
          {
            role: "user",
            content: `获取${location}的天气情况`,
          },
        ],
        stream: false,
        tools: [
          {
            type: "function",
            function: {
              name: "get_weather",
              description: "获取指定城市的天气信息",
              parameters: {
                type: "object",
                properties: {
                  location: {
                    type: "string",
                    description: "城市名称",
                  },
                },
                required: ["location"],
              },
            },
          },
        ],
      };

      const response = await axios.post<ChatResponse>(
        `${OLLAMA_API_URL}/chat`,
        toolRequest,
      );
      return response.data.message.content;
    } catch (error) {
      console.error("天气查询失败:", error);
      return "无法获取天气信息，请稍后再试";
    }
  },

  /**
   * 创建简单的问答对话
   */
  createSimpleChat: async (
    question: string,
    model = "llama3:7b",
  ): Promise<string> => {
    try {
      const response = await axios.post<ChatResponse>(
        `${OLLAMA_API_URL}/chat`,
        {
          model,
          messages: [
            {
              role: "user",
              content: question,
            },
          ],
          stream: false,
          options: {
            temperature: 0.7,
          },
        },
      );

      return response.data.message.content;
    } catch (error) {
      console.error("聊天请求失败:", error);
      return "抱歉，我现在无法回答您的问题。";
    }
  },
};

export default ollamaApi;
