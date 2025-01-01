<!-- src/renderer/src/views/PdfPreview.vue -->
<template>
  <div class="flex w-full h-[calc(60vh-100px)] overflow-y-auto">
    <PDFThumbnails 
      :pdf-url="pdfSource" 
      @page-selected="handlePageSelected"
      @page-change="handlePageChange"
      @total-pages="handleTotalPages"
      :class="[
        'border-r border-gray-200 px-6 transition-all duration-300',
        isNoticeMode ? 'w-0 opacity-0 overflow-hidden' : 'w-[200px]'
      ]"
    />
    
    <div class="flex-1 flex flex-col bg-gray-300">
      <div class="flex-1 px-8 pb-10 overflow-hidden">
        <PDFViewer 
          :pdf-url="pdfSource" 
          :current-page="currentPage" 
          class="h-full overflow-y-auto"
          @page-change="handlePageChange"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onBeforeMount, computed, onMounted, onBeforeUnmount } from 'vue'
import PDFViewer from '@renderer/components/PDF/PDFViewer.vue'
import PDFThumbnails from '@renderer/components/PDF/PDFThumbnails.vue'
import { useRouter } from 'vue-router'
import { useFlowStore } from '@renderer/stores/flow_store'

const router = useRouter()
const flowStore = useFlowStore()
const pdfSource = ref('')
const currentPage = ref(1)
const totalPages = ref(1)
let autoPlayTimer: NodeJS.Timeout | null = null

// 清理定时器
const clearAutoPlayTimer = () => {
  if (autoPlayTimer) {
    clearTimeout(autoPlayTimer)
    autoPlayTimer = null
  }
}

// 自动播放下一页
const playNextPage = () => {
  clearAutoPlayTimer()
  
  if (currentPage.value < totalPages.value) {
    // 还有下一页，继续显示当前PDF的下一页
    currentPage.value++
    handlePageChange(currentPage.value)
    
    // 设置下一页的定时器
    autoPlayTimer = setTimeout(playNextPage, flowStore.timeoutConfig.pdfPage)
  } else {
    // 当前PDF已播放完毕，通知父组件
    flowStore.currentNoticePage = 1
    emit('page-change', currentPage.value)
  }
}

// 开始自动播放
const startAutoPlay = () => {
  clearAutoPlayTimer()
  autoPlayTimer = setTimeout(playNextPage, flowStore.timeoutConfig.pdfPage)
}

onBeforeMount(() => {
  pdfSource.value = router.currentRoute.value.query.pdfSource as string
  const initialPage = parseInt(router.currentRoute.value.query.currentPage as string) || 1
  currentPage.value = initialPage
})

onMounted(() => {
  if (isNoticeMode.value) {
    startAutoPlay()
  }
})

onBeforeUnmount(() => {
  clearAutoPlayTimer()
})

const emit = defineEmits<{
  (e: 'page-change', page: number): void
}>()

// 统一处理页码变化
const handlePageChange = (page: number) => {
  currentPage.value = page
  flowStore.currentNoticePage = page
  emit('page-change', page)
}

// 处理缩略图选择
const handlePageSelected = (page: number) => {
  clearAutoPlayTimer() // 用户手动选择页面时清除自动播放
  currentPage.value = page
  flowStore.currentNoticePage = page
  emit('page-change', page)
  
  if (isNoticeMode.value) {
    startAutoPlay() // 重新开始自动播放
  }
}

// 处理总页数
const handleTotalPages = (total: number) => {
  console.log('[PdfPreview] PDF总页数:', total)
  if (total > 0) {
    totalPages.value = total
    flowStore.totalNoticePages = total
  }
}

const isNoticeMode = computed(() => {
  return router.currentRoute.value.query.noticeId !== undefined
})
</script>
