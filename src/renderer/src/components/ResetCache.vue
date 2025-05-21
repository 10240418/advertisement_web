<template>
  <div class="reset-cache-container">
    <div class="panel p-4 rounded shadow-md bg-white">
      <h2 class="text-lg font-bold mb-4">资源管理</h2>

      <div class="status-info mb-4" v-if="status">
        <div
          :class="{
            'bg-green-100 text-green-700 border-green-300':
              status.type === 'success',
            'bg-red-100 text-red-700 border-red-300': status.type === 'error',
            'bg-yellow-100 text-yellow-700 border-yellow-300':
              status.type === 'warning',
            'bg-blue-100 text-blue-700 border-blue-300': status.type === 'info',
          }"
          class="p-3 rounded border mb-2"
        >
          {{ status.message }}
        </div>
      </div>

      <div class="operations space-y-4">
        <div class="border-b pb-4">
          <h3 class="font-semibold mb-2">缓存管理</h3>
          <div class="flex flex-wrap gap-2">
            <button
              @click="clearAllCache"
              class="bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700 transition"
              :disabled="isProcessing"
            >
              清除所有缓存
            </button>
            <button
              @click="clearAdsCache"
              class="bg-amber-600 text-white py-2 px-4 rounded hover:bg-amber-700 transition"
              :disabled="isProcessing"
            >
              清除广告缓存
            </button>
            <button
              @click="clearPDFCache"
              class="bg-orange-600 text-white py-2 px-4 rounded hover:bg-orange-700 transition"
              :disabled="isProcessing"
            >
              清除PDF缓存
            </button>
          </div>
        </div>

        <div class="border-b pb-4">
          <h3 class="font-semibold mb-2">资源下载</h3>
          <div class="flex flex-wrap gap-2">
            <button
              @click="downloadAll"
              class="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition"
              :disabled="isProcessing"
            >
              重新下载所有资源
            </button>
            <button
              @click="downloadAds"
              class="bg-indigo-600 text-white py-2 px-4 rounded hover:bg-indigo-700 transition"
              :disabled="isProcessing"
            >
              下载广告
            </button>
            <button
              @click="downloadPDFs"
              class="bg-violet-600 text-white py-2 px-4 rounded hover:bg-violet-700 transition"
              :disabled="isProcessing"
            >
              下载PDF通知
            </button>
          </div>
        </div>

        <div class="space-y-2">
          <h3 class="font-semibold">当前状态</h3>
          <div class="grid grid-cols-2 gap-2 text-sm">
            <div class="border rounded p-2">
              <div class="font-medium">广告文件</div>
              <div class="text-xs text-gray-600">
                {{ resourceState.ads || "未知" }}
              </div>
            </div>
            <div class="border rounded p-2">
              <div class="font-medium">PDF文件</div>
              <div class="text-xs text-gray-600">
                {{ resourceState.pdfs || "未知" }}
              </div>
            </div>
          </div>

          <div class="mt-4">
            <button
              @click="checkResources"
              class="bg-gray-200 py-1 px-3 rounded text-sm hover:bg-gray-300 transition"
              :disabled="isProcessing"
            >
              刷新状态
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useNotificationStore } from "@renderer/stores/noticefication_store";
import { useTaskStore } from "@renderer/stores/task_store";
import { downloadAllAds } from "@renderer/utils/time-task";

// 状态
const isProcessing = ref(false);
const status = ref<{
  type: "success" | "error" | "warning" | "info";
  message: string;
} | null>(null);

// 资源状态
const resourceState = ref({
  ads: "正在检查...",
  pdfs: "正在检查...",
});

// 通知和任务存储
const notificationStore = useNotificationStore();
const taskStore = useTaskStore();

// 显示状态消息
const showStatus = (
  message: string,
  type: "success" | "error" | "warning" | "info" = "info",
) => {
  status.value = { message, type };

  // 5秒后自动清除成功和信息消息
  if (type === "success" || type === "info") {
    setTimeout(() => {
      if (status.value?.message === message) {
        status.value = null;
      }
    }, 5000);
  }
};

// 清除所有缓存
const clearAllCache = async () => {
  try {
    isProcessing.value = true;
    showStatus("正在清除所有缓存...", "info");

    const result = await window.api.clearCache();

    if (result.success) {
      showStatus(`缓存清理成功! 已清除广告文件和PDF文件。`, "success");
      notificationStore.addNotification("缓存已成功清除", "success");
    } else {
      showStatus(`清除缓存失败: ${result.error || "未知错误"}`, "error");
      notificationStore.addNotification("清除缓存失败", "error");
    }

    await checkResources();
  } catch (error) {
    showStatus(`发生错误: ${error}`, "error");
  } finally {
    isProcessing.value = false;
  }
};

// 清除广告缓存
const clearAdsCache = async () => {
  try {
    isProcessing.value = true;
    showStatus("正在清除广告缓存...", "info");

    const result = await window.api.clearCache(["ads"]);

    if (result.success) {
      showStatus(`广告缓存清理成功!`, "success");
      notificationStore.addNotification("广告缓存已成功清除", "success");
    } else {
      showStatus(`清除广告缓存失败: ${result.error || "未知错误"}`, "error");
      notificationStore.addNotification("清除广告缓存失败", "error");
    }

    await checkResources();
  } catch (error) {
    showStatus(`发生错误: ${error}`, "error");
  } finally {
    isProcessing.value = false;
  }
};

// 清除PDF缓存
const clearPDFCache = async () => {
  try {
    isProcessing.value = true;
    showStatus("正在清除PDF缓存...", "info");

    const result = await window.api.clearCache(["pdfs"]);

    if (result.success) {
      showStatus(`PDF缓存清理成功!`, "success");
      notificationStore.addNotification("PDF缓存已成功清除", "success");
    } else {
      showStatus(`清除PDF缓存失败: ${result.error || "未知错误"}`, "error");
      notificationStore.addNotification("清除PDF缓存失败", "error");
    }

    await checkResources();
  } catch (error) {
    showStatus(`发生错误: ${error}`, "error");
  } finally {
    isProcessing.value = false;
  }
};

// 下载所有资源
const downloadAll = async () => {
  try {
    isProcessing.value = true;
    showStatus("开始下载所有资源...", "info");

    // 执行PDF和广告下载任务
    await taskStore.executeTask("pdf");
    await taskStore.executeTask("ads");

    showStatus("所有资源下载任务已触发，请稍候...", "success");
    await checkResources();
  } catch (error) {
    showStatus(`下载失败: ${error}`, "error");
  } finally {
    isProcessing.value = false;
  }
};

// 仅下载广告
const downloadAds = async () => {
  try {
    isProcessing.value = true;
    showStatus("正在下载广告资源...", "info");

    await taskStore.executeTask("ads");

    // 直接调用下载函数确保立即执行
    try {
      await downloadAllAds();
      showStatus("广告下载完成!", "success");
    } catch (error) {
      showStatus(`广告下载执行过程中出错: ${error}`, "error");
    }

    await checkResources();
  } catch (error) {
    showStatus(`操作失败: ${error}`, "error");
  } finally {
    isProcessing.value = false;
  }
};

// 仅下载PDF
const downloadPDFs = async () => {
  try {
    isProcessing.value = true;
    showStatus("正在下载PDF资源...", "info");

    await taskStore.executeTask("pdf");

    showStatus("PDF下载任务已触发，请稍候...", "success");
    await checkResources();
  } catch (error) {
    showStatus(`操作失败: ${error}`, "error");
  } finally {
    isProcessing.value = false;
  }
};

// 检查资源状态
const checkResources = async () => {
  try {
    // 检查广告目录
    resourceState.value.ads = "正在检查...";
    resourceState.value.pdfs = "正在检查...";

    try {
      const imgResult = await window.api.checkPath("img");
      const videoResult = await window.api.checkPath("video");

      if (imgResult.exists || videoResult.exists) {
        resourceState.value.ads = "目录存在，状态未知";
      } else {
        resourceState.value.ads = "未找到广告目录";
      }
    } catch (error) {
      resourceState.value.ads = "检查失败";
    }

    // 检查PDF目录
    try {
      const commonResult = await window.api.checkPath("notice/common");
      const advResult = await window.api.checkPath("notice/adv");
      const normalResult = await window.api.checkPath("notice/normal");

      if (commonResult.exists || advResult.exists || normalResult.exists) {
        resourceState.value.pdfs = "目录存在，状态未知";
      } else {
        resourceState.value.pdfs = "未找到PDF目录";
      }
    } catch (error) {
      resourceState.value.pdfs = "检查失败";
    }
  } catch (error) {
    console.error("检查资源状态失败:", error);
  }
};

// 组件加载时检查资源
onMounted(async () => {
  await checkResources();
});
</script>

<style scoped>
.reset-cache-container {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
}

.panel {
  border: 1px solid #e2e8f0;
}
</style>
