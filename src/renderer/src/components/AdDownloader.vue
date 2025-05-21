<template>
  <div class="ad-downloader-container">
    <div class="panel p-4 rounded shadow-md bg-white">
      <h2 class="text-lg font-bold mb-4">广告下载管理</h2>

      <div class="status-info mb-4" v-if="statusMessage">
        <div
          :class="{
            'bg-green-100 text-green-700 border-green-300':
              statusType === 'success',
            'bg-red-100 text-red-700 border-red-300': statusType === 'error',
            'bg-yellow-100 text-yellow-700 border-yellow-300':
              statusType === 'warning',
            'bg-blue-100 text-blue-700 border-blue-300': statusType === 'info',
          }"
          class="p-3 rounded border mb-2"
        >
          {{ statusMessage }}
        </div>
      </div>

      <div class="mb-4">
        <h3 class="font-semibold mb-2">API配置</h3>
        <div class="flex flex-col space-y-3">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1"
              >API地址</label
            >
            <input
              v-model="apiUrl"
              type="text"
              class="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="输入广告API地址"
            />
          </div>

          <div class="flex space-x-2">
            <button
              @click="fetchAndDownloadAds"
              class="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition flex-1"
              :disabled="isProcessing"
            >
              <span v-if="!isProcessing">获取并下载广告</span>
              <span v-else>处理中...</span>
            </button>
            <button
              @click="clearDownloadedAds"
              class="bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700 transition"
              :disabled="isProcessing"
            >
              清除记录
            </button>
          </div>
        </div>
      </div>

      <div v-if="isProcessing" class="mb-4">
        <div class="w-full bg-gray-200 rounded-full h-2.5">
          <div
            class="bg-blue-600 h-2.5 rounded-full"
            :style="{ width: `${downloadState.progress}%` }"
          ></div>
        </div>
        <div class="text-sm text-center mt-1 text-gray-600">
          下载进度: {{ downloadState.progress }}%
        </div>
      </div>

      <div v-if="downloadedAds.length > 0" class="mt-6">
        <h3 class="font-semibold mb-2">
          已下载广告 ({{ downloadedAds.length }})
        </h3>
        <div class="overflow-auto max-h-60">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th
                  class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  ID
                </th>
                <th
                  class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  类型
                </th>
                <th
                  class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  本地路径
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200 text-sm">
              <tr v-for="ad in downloadedAds" :key="ad.id">
                <td class="px-3 py-2 whitespace-nowrap">{{ ad.id }}</td>
                <td class="px-3 py-2 whitespace-nowrap">
                  <span
                    :class="{
                      'bg-blue-100 text-blue-700': ad.type === 'video',
                      'bg-green-100 text-green-700': ad.type === 'image',
                    }"
                    class="px-2 py-0.5 rounded-full text-xs"
                  >
                    {{ ad.type === "video" ? "视频" : "图片" }}
                  </span>
                </td>
                <td class="px-3 py-2 text-xs text-gray-500 truncate max-w-xs">
                  {{ ad.localPath }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- 用于显示API响应的调试模态框 -->
    <div
      v-if="showResponseModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    >
      <div
        class="bg-white rounded-lg p-4 max-w-2xl w-full max-h-[80vh] overflow-auto"
      >
        <div class="flex justify-between mb-4">
          <h3 class="font-bold">API 响应数据</h3>
          <button
            @click="showResponseModal = false"
            class="text-gray-700 hover:text-black"
          >
            ✕
          </button>
        </div>
        <pre class="bg-gray-100 p-4 rounded text-xs overflow-auto">{{
          JSON.stringify(apiResponse, null, 2)
        }}</pre>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import adManager, {
  DownloadedAd,
  getDownloadState,
} from "@renderer/utils/adDownloadManager";
import { useNotificationStore } from "@renderer/stores/noticefication_store";

// 通知系统
const notificationStore = useNotificationStore();

// 状态变量
const apiUrl = ref("https://api.example.com/advertisements"); // 默认API地址
const isProcessing = ref(false);
const statusMessage = ref("");
const statusType = ref<"success" | "error" | "warning" | "info">("info");
const apiResponse = ref<any>(null);
const showResponseModal = ref(false);

// 计算属性
const downloadState = computed(() => getDownloadState());
const downloadedAds = computed(() => adManager.downloadedAds.value);

// 显示状态消息
const showStatus = (
  message: string,
  type: "success" | "error" | "warning" | "info" = "info",
) => {
  statusMessage.value = message;
  statusType.value = type;

  // 5秒后自动清除成功和信息消息
  if (type === "success" || type === "info") {
    setTimeout(() => {
      if (statusMessage.value === message) {
        statusMessage.value = "";
      }
    }, 5000);
  }
};

// 从API获取并下载广告
const fetchAndDownloadAds = async () => {
  if (!apiUrl.value) {
    showStatus("请输入有效的API地址", "error");
    return;
  }

  try {
    isProcessing.value = true;
    showStatus("正在从API获取广告数据...", "info");

    // 从API获取广告数据
    const response = await fetch(apiUrl.value);
    if (!response.ok) {
      throw new Error(`API请求失败: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    apiResponse.value = data;
    showStatus("已获取API数据，正在下载广告文件...", "info");

    // 处理API响应并下载广告
    const results = await adManager.processAndDownloadAds(data);

    if (results.length === 0) {
      showStatus("未下载任何广告文件，请检查API响应格式", "warning");
    } else {
      showStatus(`成功下载 ${results.length} 个广告文件`, "success");
      notificationStore.addNotification(
        `成功下载 ${results.length} 个广告文件`,
        "success",
      );
    }
  } catch (error: any) {
    showStatus(`获取或下载广告失败: ${error.message}`, "error");
    notificationStore.addNotification("广告下载失败", "error");
  } finally {
    isProcessing.value = false;
  }
};

// 清除已下载广告记录
const clearDownloadedAds = () => {
  // 只清除记录，不删除文件
  localStorage.removeItem("downloadedAds");
  adManager.downloadedAds.value = [];
  showStatus("已清除广告下载记录", "info");
};

// 模拟广告数据
const simulateApiData = () => {
  const sampleData = {
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
  };

  apiResponse.value = sampleData;
  showResponseModal.value = true;
};

// 组件挂载时加载已有记录
onMounted(() => {
  // 示例数据
  const sampleApiUrl = "https://your-api-endpoint/advertisements";
  if (!apiUrl.value) {
    apiUrl.value = sampleApiUrl;
  }
});
</script>

<style scoped>
.ad-downloader-container {
  max-width: 700px;
  margin: 0 auto;
  padding: 20px;
}
</style>
