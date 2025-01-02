import { defineStore } from 'pinia';

import type { Advertisement } from '@renderer/apis';

interface DownloadedAd {
  advertisement: Advertisement;
  downloadPath: string;
}

export const useAdsStore = defineStore('ads', {
  state: () => ({
    advertisements: [] as Advertisement[],
    downloadedAds: [] as DownloadedAd[],
  }),

  getters: {
    // 获取所有广告
    getAllAds: (state) => state.advertisements,

    // 获取已下载的广告
    getDownloadedAds: (state) => state.downloadedAds,

    // 根据显示位置获取广告
    getAdsByDisplay: (state) => (display: Advertisement['display']) =>
      state.advertisements.filter(ad => ad.display === display),

    // 获取激活的广告
    getActiveAds: (state) =>
      state.advertisements.filter(ad => ad.status === 'active'),

    // 检查广告是否已下载
    isAdDownloaded: (state) => (adId: number) =>
      state.downloadedAds.some(item => item.advertisement.id === adId),

    // 根据类型获取广告
    getAdsByType: (state) => (type: Advertisement['type']) =>
      state.advertisements.filter(ad => ad.type === type),
  },

  actions: {
    // 设置广告列表
    setAds(ads: Advertisement[]) {
      this.advertisements = ads;
      // 清理不在新数据中的已下载广告
      this.cleanupDownloadedAds();
    },

    // 添加新的清理方法
    cleanupDownloadedAds() {
      const newAdIds = new Set(this.advertisements.map(ad => ad.id));
      this.downloadedAds = this.downloadedAds.filter(
        downloadedAd => newAdIds.has(downloadedAd.advertisement.id)
      );
    },

    // 添加已下载的广告
    addDownloadedAd(ad: Advertisement, downloadPath: string) {
      if (!this.isAdDownloaded(ad.id)) {
        this.downloadedAds.push({
          advertisement: ad,
          downloadPath
        });
      }
    },

    // 移除已下载的广告
    removeDownloadedAd(adId: number) {
      this.downloadedAds = this.downloadedAds.filter(
        item => item.advertisement.id !== adId
      );
    },

    // 更新广告
    updateAd(updatedAd: Advertisement) {
      const index = this.advertisements.findIndex(
        ad => ad.id === updatedAd.id
      );
      if (index !== -1) {
        this.advertisements[index] = updatedAd;
      }
    },

    // 清空所有广告
    clearAds() {
      this.advertisements = [];
      this.downloadedAds = [];
    }
  },

  persist: true
});
