<template>
  <div class="w-full h-full p-4 flex flex-col">
    <div class="flex justify-between items-center mb-4">
      <h1 class="text-2xl font-bold text-primary">智能问答助手</h1>
      <div class="text-sm text-gray-500">基于Ollama本地大语言模型</div>
    </div>

    <div class="flex-1 rounded-lg border overflow-hidden bg-white shadow-md">
      <OllamaChat />
    </div>

    <div class="mt-4 text-xs text-gray-500">
      <p>
        使用说明：此功能需要本地安装Ollama，详情请参考
        <a
          href="docs/ollama-integration.md"
          class="text-blue-500 hover:underline"
          target="_blank"
          >Ollama接入指南</a
        >
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import OllamaChat from "@renderer/components/OllamaChat.vue";
</script>

<style scoped>
/* 确保文字渲染清晰 */
:deep(.ollama-chat) {
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
</style>
