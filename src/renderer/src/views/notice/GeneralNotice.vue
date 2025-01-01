<!-- src/renderer/src/views/notice/GeneralNotice.vue -->
<template>
  <NoticePage 
    title="一般通告" 
    titleEn="General Notices"
    :pdf-source="pdfSources" 
    current-route="/generalNotice" 
  />
</template>

<script setup lang="ts">
import NoticePage from '@renderer/components/Page/NoticePage.vue'
import { useNoticeStore } from '@renderer/stores/notice_store'
import { onMounted, ref, watch } from 'vue'

const pdfSources = ref<any[]>([])
const noticeStore = useNoticeStore()

const updateSources = () => {
  // 只获取一般通知
  const notices = noticeStore.commonNotices.map(notice => ({
    id: notice.id,
    title: notice.title,
    type: notice.type,
    file: notice.file,
    created_at: notice.createdAt || new Date().toISOString(),
    description: notice.description
  }))

  // 使用 Map 去重，以 id 为键，保留最新的记录
  const uniqueNotices = new Map()
  notices.forEach(notice => {
    const existing = uniqueNotices.get(notice.id)
    if (!existing || (notice.created_at && (!existing.created_at || new Date(notice.created_at) > new Date(existing.created_at)))) {
      uniqueNotices.set(notice.id, notice)
    }
  })

  pdfSources.value = Array.from(uniqueNotices.values())
}

// 监听 store 变化
watch(
  () => noticeStore.commonNotices,
  () => {
    updateSources()
  },
  { immediate: true }
)

onMounted(() => {
  updateSources()
})
</script>
