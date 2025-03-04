<template>
  <div class="h-[calc(100%-1rem)] absolute w-full">
    <div class="flex w-full h-full relative bg-[#ffffff] px-4">
      <!-- 左侧导航菜单区域 -->
      <div class="w-[25%] min-w-[300px] flex flex-col mr-6 h-min-full relative">
        <!-- 欠费查询卡片 -->
        <button
          @click="handleMenuClick('fees')"
          @keydown.enter="handleMenuClick('fees')"
          class="h-1/3 bg-white rounded-xl border border-grey p-4 shadow-[0_2px_8px_rgba(0,0,0,0.06)] hover:shadow-md hover:border-primary/20 transition-all duration-200 flex flex-col items-center justify-center mb-4"
          tabindex="0"
          aria-label="欠費查詢"
        >
          <div class="flex flex-col items-center">
            <span class="text-3xl font-bold text-primary tracking-wider mb-3"
              >欠費查詢</span
            >
            <span class="text-sm font-medium text-[#8E8E93] tracking-widest"
              >Payment Query</span
            >
          </div>
          <p class="text-sm text-neutral/70 mt-6 text-center">
            查詢管理費、集資費等費用訊息
          </p>
        </button>

        <!-- 失物招领卡片 -->
        <button
          @click="handleMenuClick('lost-found')"
          @keydown.enter="handleMenuClick('lost-found')"
          class="h-1/3 bg-white rounded-xl border border-grey p-4 shadow-[0_2px_8px_rgba(0,0,0,0.06)] hover:shadow-md hover:border-primary/20 transition-all duration-200 flex flex-col items-center justify-center mb-4"
          tabindex="0"
          aria-label="物業繳費"
        >
          <div class="flex flex-col items-center">
            <span class="text-3xl font-bold text-primary tracking-wider mb-3"
              >電子繳費</span
            >
            <span class="text-sm font-medium text-[#8E8E93] tracking-widest"
              >Payment</span
            >
          </div>
          <p class="text-sm text-neutral/70 mt-6 text-center">以電子支付繳費</p>
        </button>

        <!-- 社区活动卡片 -->
        <button
          @click="handleMenuClick('activities')"
          @keydown.enter="handleMenuClick('activities')"
          class="h-1/3 bg-white rounded-xl border border-grey p-4 shadow-[0_2px_8px_rgba(0,0,0,0.06)] hover:shadow-md hover:border-primary/20 transition-all duration-200 flex flex-col items-center justify-center"
          tabindex="0"
          aria-label="社區活動"
        >
          <div class="flex flex-col items-center">
            <span class="text-3xl font-bold text-primary tracking-wider mb-3"
              >大廈動向</span
            >
            <span class="text-sm font-medium text-[#8E8E93] tracking-widest"
              >Latest Events</span
            >
          </div>
          <p class="text-sm text-neutral/70 mt-6 text-center">
            了解大廈最新動向資訊
          </p>
        </button>
      </div>

      <!-- 右侧公告区域 -->
      <div
        class="flex-1 min-w-0 bg-white rounded-xl border border-grey shadow-[0_2px_8px_rgba(0,0,0,0.06)] p-4 overflow-y-auto hover:shadow-md hover:border-primary/20 transition-all duration-200 cursor-pointer"
        @click="handleNoticeHeaderClick"
        @keydown.enter="handleNoticeHeaderClick"
        tabindex="0"
        aria-label="社區公告區域"
      >
        <div class="flex flex-col mb-6">
          <span class="text-3xl font-bold text-primary tracking-wider mb-3"
            >社區公告</span>
          <span class="text-sm font-medium text-[#8E8E93] tracking-widest"
            >Community Notice</span
          >
        </div>

        <div class="flex flex-col gap-4">
          <div
            v-for="notice in notices"
            :key="notice.id"
            class="bg-neutral/5 rounded-lg p-5 transition-all duration-200 hover:shadow-md border border-neutral/10 hover:border-primary/20 cursor-pointer"
            @click.stop="handleNoticeClick(notice)"
            @keydown.enter="handleNoticeClick(notice)"
            tabindex="0"
            :aria-label="notice.title"
          >
            <div class="flex justify-between items-center mb-3">
              <div class="flex items-center gap-3">
                <h2 class="text-base font-semibold text-primary">
                  {{ notice.title }}
                </h2>
                <div
                  v-if="notice.type === 'urgent'"
                  class="px-3 py-1 rounded-full text-xs text-white bg-[#F44336] flex items-center gap-2"
                >
                  <span
                    class="w-2 h-2 rounded-full bg-white animate-pulse"
                  ></span>
                  紧急通知
                </div>
              </div>
              <span class="text-sm text-neutral/70">{{
                notice.formattedDate
              }}</span>
            </div>
            <p class="text-sm text-neutral/80 leading-relaxed">
              {{ notice.description }}
            </p>
          </div>

          <!-- 当没有通知时显示的提示 -->
          <div
            v-if="notices.length === 0"
            class="text-center py-8 text-neutral/60"
          >
            暫無通知
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from "vue";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import { useNoticeStore } from "@renderer/stores/notice_store";
import type { Notice } from "@renderer/apis";

interface NoticeWithFormattedDate extends Notice {
  formattedDate: string;
}

const router = useRouter();

// 修改notices的类型和初始数据
const notices = ref<NoticeWithFormattedDate[]>([]);
const noticeStore = useNoticeStore();

// 修改获取通知数据的方法
const loadNotices = () => {
  const allNotices = noticeStore.downloadedNotices.map((item) => item.notice);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "無時間";
    const date = new Date(dateStr);
    return date.toLocaleDateString("zh-HK", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  notices.value = allNotices
    .sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    })
    .map((notice) => ({
      id: notice.id,
      title: notice.title,
      type: notice.type,
      description: notice.description,
      createdAt: notice.createdAt,
      updatedAt: notice.updatedAt,
      deletedAt: notice.deletedAt,
      isPublic: notice.isPublic,
      fileId: notice.fileId,
      file: notice.file,
      fileType: notice.fileType,
      formattedDate: formatDate(notice.createdAt),
    }));
};

// 添加自动刷新功能
watch(
  [
    () => noticeStore.urgentNotices,
    () => noticeStore.commonNotices,
    () => noticeStore.governmentNotices,
    () => noticeStore.systemNotices,
  ],
  () => {
    loadNotices();
  },
  { immediate: true },
);

const handleMenuClick = (route: string) => {
  if (route === "fees") {
    router.push("/arrearage-find");
    return;
  }

  ElMessage({
    message: "該功能正在開發中，敬請期待",
    type: "info",
    duration: 2000,
    center: true,
  });
};

// 添加点击公告标题的处理函数
const handleNoticeHeaderClick = () => {
  router.push("/allNotice");
};

// 修改通知点击处理函数
const handleNoticeClick = (notice: Notice) => {
  if (notice.file?.path) {
    const downloadedNotice = noticeStore.getDownloadedNotices.find(
      (item) => item.notice.id === notice.id,
    );

    router.push({
      path: "/pdfPreview",
      query: {
        pdfSource: downloadedNotice?.downloadPath || notice.file.path,
      },
    });
  } else {
    ElMessage({
      message: "該通知暫無詳細文件",
      type: "info",
      duration: 2000,
      center: true,
    });
  }
};

onMounted(() => {
  loadNotices();
});
</script>

<style scoped>
/* 优化动条样式 */
::-webkit-scrollbar {
  width: 6px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: #8e8e93;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: #007aff;
}
</style>
