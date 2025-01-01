import { defineStore } from 'pinia';

import type { Notice } from '@renderer/apis';

interface DownloadedNotice {
  notice: Notice;
  downloadPath: string;
}

export const useNoticeStore = defineStore('notice', {
  state: () => ({
    notices: [] as Notice[],
    downloadedNotices: [] as DownloadedNotice[],
  }),

  getters: {
    // 根据类型获取通知
    getNoticesByType: (state) => (type: Notice['type']) => 
      state.notices.filter(notice => notice.type === type),

    // 获取紧急通知
    urgentNotices: (state) => 
      state.notices.filter(notice => notice.type === 'urgent'),

    // 获取普通通知  
    commonNotices: (state) => 
      state.notices.filter(notice => notice.type === 'common'),

    // 获取政府通知
    governmentNotices: (state) => 
      state.notices.filter(notice => notice.type === 'government'),

    // 获取系统通知
    systemNotices: (state) => 
      state.notices.filter(notice => notice.type === 'system'),

    // 获取已下载的通知
    getDownloadedNotices: (state) => state.downloadedNotices,

    // 检查通知是否已下载
    isNoticeDownloaded: (state) => (noticeId: number) => 
      state.downloadedNotices.some(item => item.notice.id === noticeId)
  },

  actions: {
    // 设置所有通知
    setNotices(notices: Notice[]) {
      this.notices = notices;
    },

    // 添加已下载的通知
    addDownloadedNotice(notice: Notice, downloadPath: string) {
      if (!this.isNoticeDownloaded(notice.id)) {
        this.downloadedNotices.push({
          notice,
          downloadPath
        });
      }
    },

    // 移除已下载的通知
    removeDownloadedNotice(noticeId: number) {
      this.downloadedNotices = this.downloadedNotices.filter(
        item => item.notice.id !== noticeId
      );
    },

    // 更新通知
    updateNotice(updatedNotice: Notice) {
      const index = this.notices.findIndex(
        notice => notice.id === updatedNotice.id
      );
      if (index !== -1) {
        this.notices[index] = updatedNotice;
      }
    },

    // 清空所有通知
    clearNotices() {
      this.notices = [];
      this.downloadedNotices = [];
    }
  },

  persist: true
});
