<template>
  <div class="w-full h-full flex flex-col ollama-chat">
    <!-- 聊天记录区域 -->
    <div class="flex-1 overflow-y-auto bg-gray-50 p-3" ref="messagesContainer">
      <div
        v-if="!ollamaAvailable"
        class="p-4 bg-yellow-50 text-yellow-700 rounded-lg mb-4"
      >
        Ollama服务未启动或不可用。请确保已安装并启动Ollama服务。
      </div>

      <!-- 消息列表 -->
      <div class="space-y-3">
        <div
          v-for="(message, index) in messages"
          :key="index"
          :class="[
            'p-3 rounded-lg max-w-[85%]',
            message.role === 'user'
              ? 'bg-blue-500 text-white ml-auto'
              : 'bg-white border border-gray-200 mr-auto',
          ]"
        >
          <div class="whitespace-pre-wrap text-sm md:text-base leading-relaxed">
            {{ message.content }}
          </div>
        </div>
      </div>

      <!-- 加载指示器 -->
      <div
        v-if="isLoading"
        class="p-3 rounded-lg bg-gray-100 max-w-[85%] mr-auto animate-pulse"
      >
        思考中...
      </div>
    </div>

    <!-- 输入区域 -->
    <div class="p-3 bg-white border-t">
      <div class="flex items-center gap-2">
        <!-- 模型选择下拉框 -->
        <select
          v-model="selectedModel"
          class="text-xs p-2 border rounded text-gray-800 bg-white min-w-[120px]"
          :disabled="isLoading || !ollamaAvailable"
        >
          <option disabled value="">选择模型</option>
          <option v-for="model in availableModels" :key="model" :value="model">
            {{ model }}
          </option>
        </select>

        <!-- 消息输入框 -->
        <input
          v-model="userInput"
          type="text"
          placeholder="输入消息..."
          class="flex-1 p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-300 text-gray-800"
          :disabled="isLoading || !ollamaAvailable"
          @keyup.enter="sendMessage"
        />

        <!-- 发送按钮 -->
        <button
          @click="sendMessage"
          class="bg-blue-500 text-white p-2 rounded hover:bg-blue-600 disabled:bg-blue-300 border border-blue-600"
          :disabled="isLoading || !userInput.trim() || !ollamaAvailable"
          title="发送消息"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
            />
          </svg>
        </button>

        <!-- 清空记录按钮 (现在放在发送按钮右侧) -->
        <button
          @click="clearConversation"
          class="p-2 text-red-500 hover:text-red-700 rounded hover:bg-gray-100 border border-gray-300"
          :disabled="isLoading || messages.length <= 1"
          title="清空历史记录"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        </button>
      </div>

      <div class="flex justify-end mt-2">
        <span class="text-xs text-gray-500">{{ saveStatus }}</span>
      </div>

      <!-- 错误提示 -->
      <div v-if="error" class="mt-2 text-sm text-red-500">
        {{ error }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, nextTick } from "vue";
import ollamaApi from "@renderer/utils/ollama";

// 类型定义
interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface ConversationHistory {
  id: string;
  model: string;
  messages: ChatMessage[];
  timestamp: number;
}

// 状态变量
const userInput = ref("");
const messages = ref<ChatMessage[]>([]);
const isLoading = ref(false);
const error = ref("");
const ollamaAvailable = ref(false);
const availableModels = ref<string[]>([]);
const selectedModel = ref("llama3.2:1b"); // 默认使用轻量模型
const messagesContainer = ref<HTMLDivElement | null>(null);
const conversationId = ref(`chat-${Date.now()}`);
const saveStatus = ref("");

// 保存对话历史
const saveConversation = () => {
  try {
    // 不保存空对话
    if (messages.value.length <= 1) return;

    const conversations = getConversationHistory();

    // 查找当前对话是否已存在
    const existingIndex = conversations.findIndex(
      (conv) => conv.id === conversationId.value,
    );

    const currentConversation: ConversationHistory = {
      id: conversationId.value,
      model: selectedModel.value,
      messages: messages.value,
      timestamp: Date.now(),
    };

    // 更新或添加当前对话
    if (existingIndex !== -1) {
      conversations[existingIndex] = currentConversation;
    } else {
      conversations.push(currentConversation);
    }

    // 只保留最近的10个对话
    const recentConversations = conversations
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 10);

    localStorage.setItem(
      "ollama-conversations",
      JSON.stringify(recentConversations),
    );
    saveStatus.value = "已保存";

    // 2秒后清除状态提示
    setTimeout(() => {
      saveStatus.value = "";
    }, 2000);
  } catch (err) {
    console.error("保存对话历史失败:", err);
    error.value = "保存对话历史失败";
  }
};

// 获取对话历史
const getConversationHistory = (): ConversationHistory[] => {
  try {
    const historyJson = localStorage.getItem("ollama-conversations");
    return historyJson ? JSON.parse(historyJson) : [];
  } catch (err) {
    console.error("读取对话历史失败:", err);
    return [];
  }
};

// 加载最近的对话
const loadRecentConversation = () => {
  try {
    const conversations = getConversationHistory();
    if (conversations.length > 0) {
      // 获取最近的对话
      const mostRecent = conversations.sort(
        (a, b) => b.timestamp - a.timestamp,
      )[0];
      conversationId.value = mostRecent.id;
      messages.value = mostRecent.messages;
      selectedModel.value = mostRecent.model || "llama3.2:1b";
      return true;
    }
    return false;
  } catch (err) {
    console.error("加载最近对话失败:", err);
    return false;
  }
};

// 清空当前对话
const clearConversation = () => {
  if (isLoading.value) return;

  // 保留初始欢迎消息
  messages.value = [
    {
      role: "assistant",
      content: "你好！我是集成了Ollama的AI助手。请问有什么我可以帮助你的？",
    },
  ];

  // 生成新的对话ID
  conversationId.value = `chat-${Date.now()}`;
  saveConversation();
};

// 初始化
onMounted(async () => {
  await checkOllamaAvailability();

  // 尝试加载历史对话，如果没有则添加欢迎消息
  const hasHistory = loadRecentConversation();
  if (!hasHistory) {
    messages.value.push({
      role: "assistant",
      content: "你好！我是集成了Ollama的AI助手。请问有什么我可以帮助你的？",
    });
  }
});

// 检测Ollama可用性并自动选择最佳模型
const checkOllamaAvailability = async () => {
  try {
    ollamaAvailable.value = await ollamaApi.checkAvailability();

    if (ollamaAvailable.value) {
      // 获取可用模型
      const models = await ollamaApi.getAvailableModels();
      availableModels.value = models;

      // 自动选择最佳模型
      // 如果从历史记录中加载了对话，则使用历史对话中的模型
      // 否则，优先选择中文模型，然后是较大模型，最后是任何可用模型
      if (messages.value.length <= 1 || !selectedModel.value) {
        // 优先级顺序：中文模型 > 大模型 > 小模型
        const modelPreference = [
          // 中文模型优先
          "qwen:7b",
          "chinese-llama-2:7b",
          "chinese-alpaca-2:7b",
          // 然后是大模型
          "llama3:70b",
          "llama3:8b",
          "llama3:7b",
          // 新版Llama模型
          "llama3.2:1b",
          "llama3.2:3b",
          "llama3.2:8b",
          "llama3.2:70b",
          // 最后是中小型模型
          "llama3:1b",
          "mistral:7b",
          "phi:latest",
        ];

        // 自动选择最合适的模型
        for (const preferredModel of modelPreference) {
          if (models.includes(preferredModel)) {
            selectedModel.value = preferredModel;
            console.log(`自动选择模型: ${preferredModel}`);
            break;
          }
        }

        // 如果没有匹配的首选模型，但有可用模型，则选择第一个
        if (!selectedModel.value && models.length > 0) {
          selectedModel.value = models[0];
          console.log(`没有首选模型，使用: ${models[0]}`);
        }
      }
    }
  } catch (err) {
    console.error("检测Ollama可用性时出错:", err);
    ollamaAvailable.value = false;
    error.value = "无法连接到Ollama服务，请确保已安装并启动。";
  }
};

// 发送消息
const sendMessage = async () => {
  if (isLoading.value || !userInput.value.trim() || !ollamaAvailable.value)
    return;

  const userMessage = userInput.value.trim();
  userInput.value = "";
  error.value = "";

  try {
    // 添加用户消息
    messages.value.push({ role: "user", content: userMessage });
    isLoading.value = true;

    // 滚动到底部
    await scrollToBottom();

    // 调用API获取响应
    const chatHistory = messages.value.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    const response = await ollamaApi.sendChatRequest({
      model: selectedModel.value,
      messages: chatHistory,
      stream: false,
      options: {
        temperature: 0.7,
      },
    });

    // 添加助手响应
    messages.value.push({
      role: "assistant",
      content: response.message.content,
    });

    // 保存对话历史
    saveConversation();

    // 再次滚动到底部
    await scrollToBottom();
  } catch (err: any) {
    console.error("发送消息失败:", err);
    error.value = `请求失败: ${err.message || "未知错误"}`;
  } finally {
    isLoading.value = false;
  }
};

// 滚动到底部
const scrollToBottom = async () => {
  await nextTick();
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
  }
};

// 监听消息变化，自动滚动并保存
watch(
  messages,
  (newMessages) => {
    nextTick(() => scrollToBottom());

    // 当消息更新时自动保存（非初始消息）
    if (newMessages.length > 1) {
      saveConversation();
    }
  },
  { deep: true },
);
</script>

<style scoped>
.ollama-chat {
  font-family: "PingFang SC", "Microsoft YaHei", sans-serif;
}

/* 增强文字可读性 */
.ollama-chat .whitespace-pre-wrap {
  color: inherit;
  word-break: break-word;
  font-size: 14px;
  line-height: 1.5;
}

/* 确保AI回复文本清晰可见 */
.ollama-chat .bg-white.border {
  color: #333;
  background-color: #f9f9f9;
}

/* 提升用户消息的对比度 */
.ollama-chat .bg-blue-500 {
  background-color: #2563eb;
}

/* 确保输入框文字可见 */
input[type="text"],
select {
  color: #000 !important;
  background-color: white !important;
}

/* 输入框文字颜色 */
::placeholder {
  color: #9ca3af;
  opacity: 1;
}
</style>
