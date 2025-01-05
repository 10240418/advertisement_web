<!-- src/renderer/src/components/PDFViewer.vue -->
<template>
  <div class="w-full h-full">
    <PDF
      ref="pdfRef"
      :src="pdfUrl"
      :page="currentPage"
      :pdf-width="'100%'"
      :show-progress="true"
      :show-page-number="true"
      :show-page-tooltip="true"
      :show-back-to-top-btn="true"
      :scroll-threshold="0"
      :row-gap="10"
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
import { defineProps, defineEmits, watch, ref, onBeforeUnmount } from 'vue'
import PDF from 'pdf-vue3'
import type { PDFDocumentProxy } from 'pdf-vue3'

const props = defineProps<{
  pdfUrl: string
  currentPage: number
}>()

const emit = defineEmits<{
  (e: 'page-change', page: number): void
}>()

// 添加 ref 来存储 PDF 实例
const pdfRef = ref<any>(null)
let pdfInstance: PDFDocumentProxy | null = null

// 在 PDF 初始化时保存实例
const handlePdfInit = (pdf: PDFDocumentProxy) => {
  pdfInstance = pdf
}

// 组件卸载前进行清理
onBeforeUnmount(async () => {
  console.log('onBeforeUnmount---------', pdfInstance)
  if (pdfInstance) {
    try {
      console.log('清理 PDF 实例')
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
  if (newPage) {
    // 强制更新PDF组件的页码
    const pdfElement = document.querySelector('.pdf-vue3') as any
    if (pdfElement && pdfElement.__vue__) {
      pdfElement.__vue__.currentPage = newPage
    }
  }
}, { immediate: true })
</script>

<style scoped>
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
