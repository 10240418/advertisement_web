<template>
  <NoticePage 
    title="所有通告" 
    titleEn="All Notices"
    :pdf-source="pdfSources" 
    current-route="/allNotice" 
  />
</template>

<script setup lang="ts">
import NoticePage from '@renderer/components/Page/NoticePage.vue'
import { useNoticeStore } from '@renderer/stores/notice_store'
import { onMounted, ref, watch } from 'vue'

const pdfSources = ref<any[]>([])
const noticeStore = useNoticeStore()

const updateSources = () => {
  // 合并所有类型的通知
  const allNotices = noticeStore.downloadedNotices.map(item => item.notice).map(notice => ({
    id: notice.id,
    title: notice.title,
    type: notice.type,
    file: notice.file,
    created_at: notice.createdAt || new Date().toISOString(),
    description: notice.description
  }))

  // 使用 Map 去重，以 id 为键，保留最新的记录

  pdfSources.value = allNotices
}

// 监听 store 变化
watch(
  [
    () => noticeStore.notices,
  ],
  () => {
    updateSources()
  },
  { immediate: true }
)

onMounted(() => {
  updateSources()
})
</script> 