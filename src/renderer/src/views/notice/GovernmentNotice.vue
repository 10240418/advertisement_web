<!-- src/renderer/src/views/notice/GovernmentNotice.vue -->
<template>
  <NoticePage 
    title="政府通告" 
    titleEn="Government Notices"
    :pdf-source="pdfSources" 
    current-route="/governmentNotice" 
  />
</template>

<script setup lang="ts">
import NoticePage from '@renderer/components/Page/NoticePage.vue'
import { useNoticeStore } from '@renderer/stores/notice_store'
import { onMounted, ref, watch } from 'vue'

const pdfSources = ref<any[]>([])
const noticeStore = useNoticeStore()

const updateSources = () => {
  const notices = noticeStore.governmentNotices.map(notice => ({
    id: notice.id,
    title: notice.title,
    type: notice.type,
    file: notice.file,
    created_at: notice.createdAt || new Date().toISOString(),
    description: notice.description
  }))

  const uniqueNotices = new Map()
  notices.forEach(notice => {
    const existing = uniqueNotices.get(notice.id)
    if (!existing || (notice.created_at && (!existing.created_at || new Date(notice.created_at) > new Date(existing.created_at)))) {
      uniqueNotices.set(notice.id, notice)
    }
  })

  pdfSources.value = Array.from(uniqueNotices.values())
}

watch(
  () => noticeStore.governmentNotices,
  () => {
    updateSources()
  },
  { immediate: true }
)

onMounted(() => {
  updateSources()
})
</script>
