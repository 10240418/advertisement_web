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

      <!-- 右侧公告区域 - 整合 NoticePage 功能 -->
      <div class="flex-1 min-w-0 bg-white rounded-xl border border-grey shadow-[0_2px_8px_rgba(0,0,0,0.06)] p-4 overflow-y-auto hover:shadow-md hover:border-primary/20 transition-all duration-200">
        <!-- 通知页面标题和导航 -->
        <div class="flex justify-between items-center mb-6">
          <div class="flex flex-col">
            <span class="text-3xl font-bold text-primary tracking-wider mb-3">{{ noticeTitle }}</span>
            <span class="text-sm font-medium text-[#8E8E93] tracking-widest">{{ noticeTitleEn }}</span>
          </div>
          
          <!-- 导航按钮组 -->
          <div class="flex items-center gap-2">
            <button
              v-for="nav in navigation"
              :key="nav.type"
              :class="[
                'px-4 py-2 rounded-lg text-base font-medium transition-colors',
                'focus:outline-none focus:ring-2 focus:ring-blue-500',
                pageStore.currentNoticeType === nav.type
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-600 hover:bg-gray-50'
              ]"
              @click="handleTypeChange(nav.type)"
              tabindex="0"
              :aria-label="`切換到${nav.label}`"
            >
              {{ nav.label }}
            </button>
          </div>
        </div>

        <!-- 通知列表区域 -->
        <div class="flex-1 overflow-y-auto space-y-4 mb-6">
          <div
            v-for="(notice, index) in paginatedNotices"
            :key="index"
            class="bg-white rounded-xl border border-gray-200 p-4 shadow-[0_2px_8px_rgba(0,0,0,0.06)] 
                   hover:shadow-lg transition-shadow cursor-pointer"
            @click="handleNoticeClick(notice)"
            @keydown.enter="handleNoticeClick(notice)"
            tabindex="0"
            :aria-label="`查看${notice.title}的詳情`"
          >
            <div class="flex justify-between items-center">
              <div class="space-y-2">
                <h3 class="text-lg font-semibold text-gray-900">{{ notice.title }}</h3>
                <div class="flex items-center gap-4">
                  <span class="text-sm text-gray-500">
                    類型: {{ getNoticeTypeName(notice.type) }}
                  </span>
                  <span v-if="notice.created_at" class="text-sm text-gray-500">
                    發布時間: {{ formatDate(notice.created_at) }}
                  </span>
                </div>
                <p v-if="notice.description" class="text-sm text-gray-600">
                  {{ notice.description }}
                </p>
              </div>
              <div class="flex items-center gap-2">
                <span class="text-blue-600 hover:text-blue-700">
                  查看詳情
                  <i class="fas fa-chevron-right ml-2"></i>
                </span>
              </div>
            </div>
          </div>

          <!-- 当没有通知时显示的提示 -->
          <div
            v-if="paginatedNotices.length === 0"
            class="text-center py-8 text-neutral/60"
          >
            暫無通知
          </div>
        </div>

        <!-- 分页控制按钮 -->
        <div class="border-t border-gray-200 pt-4 mt-auto">
          <div class="flex justify-center items-center gap-4">
            <button
              class="flex items-center justify-center px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50
                    bg-white text-primary border border-gray-200 hover:bg-gray-50 disabled:hover:bg-white
                    focus:outline-none focus:ring-2 focus:ring-blue-500"
              @click="handlePreviousPage"
              :disabled="pageStore.currentPage === 1"
              tabindex="0"
              aria-label="上一頁"
            >
              <i class="fas fa-chevron-left mr-2"></i>
              <span>上一頁</span>
            </button>

            <span class="text-center text-gray-600">
              第 {{ pageStore.currentPage }} 頁，共 {{ totalPages }} 頁
            </span>

            <button
              class="flex items-center justify-center px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50
                    bg-white text-primary border border-gray-200 hover:bg-gray-50 disabled:hover:bg-white
                    focus:outline-none focus:ring-2 focus:ring-blue-500"
              @click="handleNextPage"
              :disabled="pageStore.currentPage === totalPages"
              tabindex="0"
              aria-label="下一頁"
            >
              <span>下一頁</span>
              <i class="fas fa-chevron-right ml-2"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import { useNoticeStore } from "@renderer/stores/notice_store";
import { usePageStore, type NoticePageType } from "@renderer/stores/page_store";
import type { Notice } from "@renderer/apis";

// 定义带有格式化日期的通知类型
interface NoticeWithFormattedDate extends Omit<Notice, 'description' | 'file'> {
  formattedDate: string;
  // 为了兼容 NoticePage.vue 的字段
  created_at?: string;
  description: string; // 确保与Notice接口一致
  file?: {
    id: number;
    createdAt: string;
    updatedAt: string;
    deletedAt: null | string;
    size: number;
    md5: string;
    path: string;
    mimeType: string;
    oss: 'local' | 'aws' | string;
    uploader: string;
    uploaderId: number;
    uploaderType: string;
  };
  type: 'urgent' | 'building' | 'government' | 'normal';
}

const router = useRouter();
const noticeStore = useNoticeStore();
const pageStore = usePageStore();

// 导航项定义
const navigation = [
  { label: '全體通告', type: 'all' as NoticePageType, titleEn: 'All Notices' },
  { label: '緊急通告', type: 'urgent' as NoticePageType, titleEn: 'Urgent Notices' },
  { label: '一般通告', type: 'general' as NoticePageType, titleEn: 'General Notices' },
  { label: '法團通告', type: 'corporate' as NoticePageType, titleEn: 'Corporate Notices' },
  { label: '政府通告', type: 'government' as NoticePageType, titleEn: 'Government Notices' }
];

// 获取通知类型名称
const getNoticeTypeName = (type: string): string => {
  const types: Record<string, string> = {
    urgent: '緊急通告',
    building: '法團通告',
    government: '政府通告',
    normal: '一般通告'
  };
  return types[type] || '其他';
};

// 格式化日期
const formatDate = (dateStr?: string) => {
  if (!dateStr) return '無時間';
  const date = new Date(dateStr);
  return date.toLocaleDateString('zh-HK', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// 所有通知列表
const allNotices = ref<NoticeWithFormattedDate[]>([]);

// 加载通知数据
const loadNotices = () => {
  const notices: NoticeWithFormattedDate[] = [];
  
  // 合并所有类型的通知
  noticeStore.downloadedNotices.forEach(item => {
    const notice = item.notice;
    notices.push({
      id: notice.id,
      title: notice.title,
      type: notice.type,
      file: notice.file,
      created_at: notice.createdAt,
      description: notice.description,
      createdAt: notice.createdAt,
      updatedAt: notice.updatedAt,
      deletedAt: notice.deletedAt,
      isPublic: notice.isPublic,
      fileId: notice.fileId,
      fileType: notice.fileType,
      formattedDate: formatDate(notice.createdAt),
      endTime:notice.endTime
    });
  });

  // 按时间排序
  allNotices.value = notices.sort((a, b) => {
    const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return dateB - dateA;
  });
};

// 通知标题
const noticeTitle = computed(() => {
  const nav = navigation.find(n => n.type === pageStore.currentNoticeType);
  return nav ? nav.label : '所有通告';
});

// 通知英文标题
const noticeTitleEn = computed(() => {
  const nav = navigation.find(n => n.type === pageStore.currentNoticeType);
  return nav ? nav.titleEn : 'All Notices';
});

// 过滤当前类型的通知
const currentTypeNotices = computed(() => {
  if (pageStore.currentNoticeType === 'all') {
    return allNotices.value;
  }
  
  const typeMapping: Record<string, string> = {
    'urgent': 'urgent',
    'general': 'normal',
    'corporate': 'building',
    'government': 'government'
  };
  
  const targetType = typeMapping[pageStore.currentNoticeType];
  return allNotices.value.filter(notice => notice.type === targetType);
});

// 分页后的通知
const paginatedNotices = computed(() => {
  const start = (pageStore.currentPage - 1) * pageStore.itemsPerPage;
  const end = start + pageStore.itemsPerPage;
  return currentTypeNotices.value.slice(start, end);
});

// 总页数
const totalPages = computed(() => {
  return Math.max(1, Math.ceil(currentTypeNotices.value.length / pageStore.itemsPerPage));
});

// 处理导航类型切换
const handleTypeChange = (type: NoticePageType) => {
  pageStore.setCurrentNoticeType(type);
};

// 分页控制函数
const handlePreviousPage = () => {
  pageStore.prevPage();
};

const handleNextPage = () => {
  if (pageStore.currentPage < totalPages.value) {
    pageStore.nextPage();
  }
};

// 处理菜单项点击
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

// 处理通知点击
const handleNoticeClick = (notice: any) => {
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

// 监听 store 变化
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
  { immediate: true }
);

// 监控当前页面是否超出了总页数
watch(
  [() => pageStore.currentPage, () => totalPages.value, () => pageStore.currentNoticeType],
  ([currentPage, totalPagesValue]) => {
    if (currentPage > totalPagesValue && totalPagesValue > 0) {
      pageStore.setCurrentPage(totalPagesValue);
    }
  }
);
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
