<!-- src/renderer/src/components/PDFViewer.vue -->
<template>
  <div class="w-full h-full">
    <PDF
      ref="pdfRef"
      :src="pdfUrl"
      :page="currentPage"
      :pdf-width="pdfWidth"
      :show-progress="true"
      :show-page-tooltip="true"
      :show-back-to-top-btn="true"
      :scroll-threshold="0"
      :row-gap="0"
      :use-system-fonts="false"
      :disable-stream="true"
      :disable-auto-fetch="true"
      class="pdf-container"
      @on-page-change="handlePageChange"
      @on-pdf-init="handlePdfInit"
    />
  </div>
</template>

<script setup lang="ts">
import { defineProps, defineEmits, watch, ref, computed, onBeforeUnmount } from 'vue'
import PDF from 'pdf-vue3'
import type { PDFDocumentProxy } from 'pdf-vue3'

const props = defineProps<{
  pdfUrl: string
  currentPage: number
  containerSize: {
    width: number
    height: number
  }
}>()

const emit = defineEmits<{
  (e: 'page-change', page: number): void
}>()

const pdfRef = ref<any>(null)
let pdfInstance: PDFDocumentProxy | null = null
const pdfWidth = ref('1000px')

// 处理 PDF 初始化
const handlePdfInit = async (pdf: PDFDocumentProxy) => {
  pdfInstance = pdf
  await updatePdfSize()
}

// 更新 PDF 尺寸
const updatePdfSize = async () => {
  if (!pdfInstance || !props.containerSize.height) return

  try {
    const page = await pdfInstance.getPage(1)
    const viewport = page.getViewport({ scale: 1.0 })
    const aspectRatio = viewport.width / viewport.height
    
    // 计算基于容器高度的宽度
    const containerHeight = props.containerSize.height*1.010362  
    const targetWidth = Math.floor(containerHeight * aspectRatio)
    
    pdfWidth.value = `${targetWidth}px`
  } catch (error) {
    console.error('更新 PDF 尺寸时出错:', error)
  }
}

// 监听容器尺寸变化
watch(() => props.containerSize, async () => {
  await updatePdfSize()
}, { deep: true })

// 组件卸载前进行清理
onBeforeUnmount(async () => {
  if (pdfInstance) {
    try {
      await pdfInstance.cleanup()
      await pdfInstance.destroy()
      pdfInstance = null
    } catch (error) {
      console.error('清理 PDF 实例时出错:', error)
    }
  }
})

const handlePageChange = (page: number) => {
  emit('page-change', page)
}

// 监听currentPage的变化
watch(() => props.currentPage, (newPage) => {
  if (newPage && pdfRef.value) {
    pdfRef.value.currentPage = newPage
  }
}, { immediate: true })
</script>

<style scoped>
.pdf-container {
  @apply h-full;
}

.pdf-container :deep(.pdf-vue3) {
  @apply h-full;
}

.pdf-container :deep(.pdf-vue3-page-container) {
  @apply min-h-full;
}

.pdf-container :deep(.pdf-vue3-scroller) {
  @apply h-full overflow-y-auto overflow-x-hidden;
}

.pdf-container :deep(.pdf-vue3-scroller::-webkit-scrollbar) {
  @apply w-2;
}

.pdf-container :deep(.pdf-vue3-scroller::-webkit-scrollbar-track) {
  @apply bg-gray-200 rounded;
}

.pdf-container :deep(.pdf-vue3-scroller::-webkit-scrollbar-thumb) {
  @apply bg-gray-400 rounded border border-gray-100 hover:bg-gray-500;
}
</style>
