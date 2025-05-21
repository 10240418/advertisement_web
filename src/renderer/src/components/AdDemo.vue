<template>
  <div class="ad-demo-container">
    <div class="panel p-4 rounded shadow-md bg-white">
      <h2 class="text-lg font-bold mb-4">广告下载演示</h2>

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

      <div class="flex space-x-3 mb-4">
        <button
          @click="testDownloadSample"
          class="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition"
          :disabled="isProcessing"
        >
          <span v-if="!isProcessing">下载示例广告</span>
          <span v-else>处理中...</span>
        </button>

        <button
          @click="showLogModal = true"
          class="bg-gray-600 text-white py-2 px-4 rounded hover:bg-gray-700 transition"
          :disabled="isProcessing"
        >
          查看数据
        </button>
      </div>

      <div v-if="isProcessing" class="mb-4">
        <div class="w-full bg-gray-200 rounded-full h-2.5">
          <div
            class="bg-blue-600 h-2.5 rounded-full"
            :style="{ width: `${progress}%` }"
          ></div>
        </div>
        <div class="text-sm text-center mt-1 text-gray-600">
          处理进度: {{ progress }}%
        </div>
      </div>

      <div v-if="downloadedAds.length > 0" class="mt-6">
        <h3 class="font-semibold mb-2">
          已下载广告 ({{ downloadedAds.length }})
        </h3>
        <div class="border rounded p-4">
          <div
            v-for="ad in downloadedAds"
            :key="ad.id"
            class="mb-3 last:mb-0 border-b pb-3 last:border-0"
          >
            <div class="flex justify-between">
              <span class="font-medium">广告 ID: {{ ad.id }}</span>
              <span
                :class="{
                  'bg-blue-100 text-blue-700': ad.type === 'video',
                  'bg-green-100 text-green-700': ad.type === 'image',
                }"
                class="px-2 py-0.5 rounded-full text-xs"
              >
                {{ ad.type === "video" ? "视频" : "图片" }}
              </span>
            </div>
            <div class="text-xs mt-1 text-gray-600 truncate">
              本地路径: {{ ad.localPath }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 数据查看模态框 -->
    <div
      v-if="showLogModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    >
      <div
        class="bg-white rounded-lg p-4 max-w-2xl w-full max-h-[80vh] overflow-auto"
      >
        <div class="flex justify-between mb-4">
          <h3 class="font-bold">广告数据</h3>
          <button
            @click="showLogModal = false"
            class="text-gray-700 hover:text-black"
          >
            ✕
          </button>
        </div>
        <pre class="bg-gray-100 p-4 rounded text-xs overflow-auto">{{
          JSON.stringify(
            {
              sampleResponse,
              downloadedAds,
            },
            null,
            2,
          )
        }}</pre>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useNotificationStore } from "@renderer/stores/noticefication_store";
import adManager, {
  DownloadedAd,
  loadDownloadedAdsFromStorage,
} from "@renderer/utils/adDownloadManager";

// 定义状态消息类型
interface StatusMessage {
  type: "success" | "error" | "warning" | "info";
  message: string;
}

// 状态
const isProcessing = ref(false);
const progress = ref(0);
const status = ref<StatusMessage | null>(null);
const downloadedAds = ref<DownloadedAd[]>([]);
const showLogModal = ref(false);

// 通知系统
const notificationStore = useNotificationStore();

// 示例广告API响应
const sampleResponse = ref({
  data: [
    {
      id: 19,
      createdAt: "2025-04-23T11:25:51.232Z",
      updatedAt: "2025-05-14T12:24:28.016Z",
      deletedAt: null,
      title: "20250423_335x175",
      description: "335*175",
      type: "video",
      status: "active",
      duration: 30,
      priority: 0,
      startTime: "2025-04-23T11:24:48Z",
      endTime: "2025-05-31T11:24:48Z",
      display: "top",
      fileId: 73,
      file: {
        id: 73,
        createdAt: "2025-04-23T11:25:51.145Z",
        updatedAt: "2025-04-23T11:25:51.145Z",
        deletedAt: null,
        size: 12685657,
        md5: "U/nBDVGeBBDDlAEiVGZ6Ow==",
        path: "http://idreamsky.oss-cn-beijing.aliyuncs.com/2025-04-23/57a1301f-0e5f-45f8-aa6d-77049487939d.mp4",
        mimeType: "video/mp4",
        oss: "aws",
        uploader: "admin@example.com",
        uploaderId: 1,
        uploaderType: "superAdmin",
      },
      isPublic: true,
    },
  ],
  message: "Get advertisements success",
});

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

// 测试下载示例广告
const testDownloadSample = async () => {
  try {
    isProcessing.value = true;
    progress.value = 0;

    showStatus("开始下载示例广告...", "info");

    // 模拟进度增长
    const progressInterval = setInterval(() => {
      if (progress.value < 90) {
        progress.value += 10;
      }
    }, 500);

    // 处理示例响应并下载广告
    const results = await adManager.processAndDownloadAds(sampleResponse.value);

    // 清除进度计时器
    clearInterval(progressInterval);
    progress.value = 100;

    // 更新状态
    if (results.length > 0) {
      showStatus(
        `成功下载 ${results.length} 个广告文件到 static 目录`,
        "success",
      );
      notificationStore.addNotification("广告下载成功", "success");
      downloadedAds.value = results;
    } else {
      showStatus("下载广告失败，没有广告被下载", "warning");
    }
  } catch (error: any) {
    showStatus(`下载出错: ${error.message}`, "error");
    notificationStore.addNotification("广告下载失败", "error");
  } finally {
    isProcessing.value = false;
  }
};

// 初始化
onMounted(async () => {
  // 尝试加载已下载的广告记录
  const saved = loadDownloadedAdsFromStorage();
  if (saved.length > 0) {
    downloadedAds.value = saved;
    showStatus(`已加载 ${saved.length} 个广告记录`, "info");
  }
});
</script>

<style scoped>
.ad-demo-container {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
}
</style>
