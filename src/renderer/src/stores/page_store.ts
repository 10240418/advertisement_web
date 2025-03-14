import { defineStore } from 'pinia'
import { ref } from 'vue'

export type NoticePageType = 'all' | 'urgent' | 'general' | 'corporate' | 'government'

export const usePageStore = defineStore('page', () => {
  // 当前选中的通知类型
  const currentNoticeType = ref<NoticePageType>('all')

  // 当前页码
  const currentPage = ref(1)
  
  // 每页显示的项目数
  const itemsPerPage = ref(7)

  // 设置当前通知类型
  const setCurrentNoticeType = (type: NoticePageType) => {
    currentNoticeType.value = type
    // 重置页码
    currentPage.value = 1
  }

  // 设置当前页码
  const setCurrentPage = (page: number) => {
    currentPage.value = page
  }

  // 下一页
  const nextPage = () => {
    currentPage.value++
  }

  // 上一页
  const prevPage = () => {
    if (currentPage.value > 1) {
      currentPage.value--
    }
  }

  return {
    currentNoticeType,
    currentPage,
    itemsPerPage,
    setCurrentNoticeType,
    setCurrentPage,
    nextPage,
    prevPage
  }
})
