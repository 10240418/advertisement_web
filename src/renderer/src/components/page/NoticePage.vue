<template>
  <div class="h-full w-full flex flex-col p-4 absolute">
    <!-- 导航区域 -->
    <nav class="flex justify-between items-center mb-8">
      <div class="flex items-center gap-2 p-6 bg-white rounded-xl border border-gray-200 shadow-sm w-[calc(100%)]">
        <!-- 标题部分 -->
        <div class="flex flex-col w-52">
          <span class="text-2xl font-bold text-primary tracking-wider">{{ title }}</span>
          <span class="text-sm font-medium text-neutral tracking-widest uppercase">{{ titleEn }}</span>
        </div>

        <!-- 分隔符 -->
        <div class="h-12 w-px bg-gray-200 mx-4"></div>

        <!-- 导航按钮组 -->
        <div class="flex-1">
          <div class="flex items-center gap-2">
            <button
              v-for="nav in navigation"
              :key="nav.route"
              :class="[
                'px-6 py-3 rounded-lg text-lg font-medium transition-colors',
                'focus:outline-none focus:ring-2 focus:ring-blue-500',
                currentRoute === nav.route
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-600 hover:bg-gray-50'
              ]"
              @click="goTo(nav.route)"
              @keydown.enter="goTo(nav.route)"
              tabindex="0"
              :aria-label="`切換到${nav.label}`"
            >
              {{ nav.label }}
            </button>
          </div>
        </div>
      </div>
    </nav>

    <!-- 通知列表区域，添加 pb-16 为分页腾出空间 -->
    <div class="flex-1 overflow-y-auto space-y-4 pb-16">
      <div
        v-for="(notice, index) in paginatedNotices"
        :key="index"
        class="bg-white rounded-xl border border-gray-200 p-6 shadow-[0_2px_8px_rgba(0,0,0,0.06)] 
               hover:shadow-lg transition-shadow cursor-pointer"
        @click="viewPdf(notice)"
        @keydown.enter="viewPdf(notice)"
        tabindex="0"
        :aria-label="`查看${notice.title}的詳情`"
      >
        <div class="flex justify-between items-center">
          <div class="space-y-2">
            <h3 class="text-xl font-semibold text-gray-900">{{ notice.title }}</h3>
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

 
    </div>

    <!-- 分页控制按钮，使用固定定位 -->
    <div class="relative bottom-0 left-0 right-0 border-t border-gray-200 p-4">
      <div class="flex justify-center items-center gap-4">
        <button
          class="flex items-center justify-center px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50
                 bg-white text-primary border border-gray-200 hover:bg-gray-50 disabled:hover:bg-white
                 focus:outline-none focus:ring-2 focus:ring-blue-500"
          @click="handlePreviousPage"
          @keydown.enter="handlePreviousPage"
          :disabled="currentPage === 1"
          tabindex="0"
          aria-label="上一頁"
        >
          <i class="fas fa-chevron-left mr-2"></i>
          <span>上一頁</span>
        </button>

        <span class="text-center text-gray-600">
          第 {{ currentPage }} 頁，共 {{ totalPages }} 頁
        </span>

        <button
          class="flex items-center justify-center px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50
                 bg-white text-primary border border-gray-200 hover:bg-gray-50 disabled:hover:bg-white
                 focus:outline-none focus:ring-2 focus:ring-blue-500"
          @click="handleNextPage"
          @keydown.enter="handleNextPage"
          :disabled="currentPage === totalPages"
          tabindex="0"
          aria-label="下一頁"
        >
          <span>下一頁</span>
          <i class="fas fa-chevron-right ml-2"></i>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useRouterStore } from '@renderer/stores/nav_store'
import { routerState } from '@renderer/stores/nav_store'
import { useNoticeStore } from '@renderer/stores/notice_store'
import { computed, ref } from 'vue'

interface Notice {
  id: number
  title: string
  type: string
  file: {
    path: string
  }
  created_at?: string
  description?: string
}

const props = defineProps<{
  title: string
  titleEn: string
  pdfSource: Notice[]
  currentRoute: string
}>()

const router = useRouter()

const navigation = [
  { label: '全體通告', route: '/allNotice', titleEn: 'All Notices' },
  { label: '緊急通告', route: '/urgentNotice', titleEn: 'Urgent Notices' },
  { label: '一般通告', route: '/generalNotice', titleEn: 'General Notices' },
  { label: '法團通告', route: '/corporateNotice', titleEn: 'Corporate Notices' },
  { label: '政府通告', route: '/governmentNotice', titleEn: 'Government Notices' }
]

const getNoticeTypeName = (type: string): string => {
  const types: Record<string, string> = {
    urgent: '緊急通告',
    building: '法團通告',
    government: '政府通告',
    normal: '一般通告'
  }
  return types[type] || '其他'
}

const viewPdf = (notice: Notice) => {
  const noticeStore = useNoticeStore()
  const downloadedNotice = noticeStore.getDownloadedNotices.find(
    item => item.notice.id === notice.id
  )
  
  if (downloadedNotice?.downloadPath) {
    router.push({ 
      path: '/pdfPreview', 
      query: { pdfSource: downloadedNotice.downloadPath } 
    })
  } else {
    router.push({ 
      path: '/pdfPreview', 
      query: { pdfSource: notice.file.path } 
    })
  }
}

const goTo = (route: string) => {
  useRouterStore().setCurrentRouter(route as routerState)
  router.push(route)
}

// 格式化日期
const formatDate = (dateStr?: string) => {
  if (!dateStr) return '無時間'
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-HK', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 按时间排序的通知列表
const sortedPdfSource = computed(() => {
  return [...props.pdfSource].sort((a, b) => {
    const dateA = a.created_at ? new Date(a.created_at).getTime() : 0
    const dateB = b.created_at ? new Date(b.created_at).getTime() : 0
    return dateB - dateA
  })
})

// 添加分页相关的状态
const currentPage = ref(1)
const itemsPerPage = 7

// 计算总页数和当前页的数据
const totalPages = computed(() => {
  const total = Math.ceil(sortedPdfSource.value.length / itemsPerPage)
  return Math.max(1, total) // 确保至少有1页
})

const paginatedNotices = computed(() => {
  if (sortedPdfSource.value.length === 0) return []
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return sortedPdfSource.value.slice(start, end)
})

// 页控制函数
const handlePreviousPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--
  }
}

const handleNextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
  }
}


</script>
