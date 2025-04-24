import { defineStore } from 'pinia';

import type { Notice } from '@renderer/apis';
import { useNotificationStore } from './noticefication_store';

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
      state.notices.filter(notice => notice.type === 'normal'),

    // 获取政府通知
    governmentNotices: (state) => 
      state.notices.filter(notice => notice.type === 'government'),

    // 获取系统通知
    systemNotices: (state) => 
      state.notices.filter(notice => notice.type === 'building'),

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
      // 清理不在新数据中的已下载通知
      console.log('setNotices', this.notices, notices, this.downloadedNotices)
      this.cleanupDownloadedNotices();
    },

    // 添加新的清理方法，并删除磁盘上的过期文件
    async cleanupDownloadedNotices() {
      const newNoticeIds = new Set(this.notices.map(notice => notice.id));
      const expiredNotices = this.downloadedNotices.filter(
        downloadedNotice => !newNoticeIds.has(downloadedNotice.notice.id)
      );
      
      // 从存储中移除过期通知
      this.downloadedNotices = this.downloadedNotices.filter(
        downloadedNotice => newNoticeIds.has(downloadedNotice.notice.id)
      );
      
      // 删除磁盘上的过期文件
      for (const expiredNotice of expiredNotices) {
        try {
          console.log(`[通知清理] 正在删除过期通知文件: ${expiredNotice.downloadPath}`);
          // 使用类型断言，确保TypeScript不会报错
          await (window.api as any).deleteFile(expiredNotice.downloadPath);
        } catch (error) {
          console.error(`[通知清理] 删除文件失败:`, error);
        }
      }
      
      if (expiredNotices.length > 0) {
        console.log(`[通知清理] 已清理 ${expiredNotices.length} 个过期通知文件`);
      }
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
      console.log('清空通知',this.notices,this.downloadedNotices);
    }
  },

  persist: true
});
