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
    />
  </div>
</template>

<script setup lang="ts">
import { defineProps, defineEmits, watch } from 'vue'
import PDF from 'pdf-vue3'

const props = defineProps<{
  pdfUrl: string
  currentPage: number
}>()

const emit = defineEmits<{
  (e: 'page-change', page: number): void
}>()

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
