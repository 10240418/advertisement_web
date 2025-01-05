<!-- src/renderer/src/views/PdfPreview.vue -->
<template>
  <div class="flex w-full h-full overflow-y-auto">
    <PDFThumbnails 
      v-if="!isNoticeMode"
      :pdf-url="pdfSource" 
      @page-selected="handlePageSelected"
      @page-change="handlePageChange"
      @total-pages="handleTotalPages"
      class="w-[200px] border-r border-gray-200 px-6"
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
import { ref, onBeforeMount, computed, onMounted, onBeforeUnmount } from 'vue'
import PDFViewer from '@renderer/components/PDF/PDFViewer.vue'
import PDFThumbnails from '@renderer/components/PDF/PDFThumbnails.vue'
import { useRouter } from 'vue-router'
import { useFlowStore } from '@renderer/stores/flow_store'

const router = useRouter()
const flowStore = useFlowStore()
const pdfSource = ref('')
const currentPage = ref(1)

// 初始化PDF源和页码
onBeforeMount(() => {
  pdfSource.value = router.currentRoute.value.query.pdfSource as string
  const initialPage = parseInt(router.currentRoute.value.query.currentPage as string) || 1
  currentPage.value = initialPage
  flowStore.currentNoticePage = initialPage
})

// 监听用户交互
onMounted(() => {
  const container = document.querySelector('.pdf-container')
  if (container) {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart']
    events.forEach(event => {
      container.addEventListener(event, flowStore.handleUserActivity)
    })
  }
})

// 清理事件监听器
onBeforeUnmount(() => {
  const container = document.querySelector('.pdf-container')
  if (container) {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart']
    events.forEach(event => {
      container.removeEventListener(event, flowStore.handleUserActivity)
    })
  }
})

const emit = defineEmits<{
  (e: 'page-change', page: number): void
}>()

// 处理页面变化
const handlePageChange = (page: number) => {
  currentPage.value = page
  flowStore.currentNoticePage = page
  emit('page-change', page)
}

// 处理缩略图选择
const handlePageSelected = (page: number) => {
  flowStore.handleUserActivity()
  handlePageChange(page)
}

// 处理总页数
const handleTotalPages = (total: number) => {
  if (total > 0) {
    flowStore.totalNoticePages = total
  }
}

// 判断是否为通知模式
const isNoticeMode = computed(() => {
  return router.currentRoute.value.query.noticeId !== undefined
})
</script>
