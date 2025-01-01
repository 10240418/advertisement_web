import { defineStore } from 'pinia';
import { timeTask } from '@renderer/utils/time-task';
import { useNotificationStore } from './noticefication_store';

export const useTaskStore = defineStore('task', {
  state: () => ({
    isRunning: false as boolean,
    retryCount: 0 as number,
    maxRetries: 3 as number,
    // 添加三种不同数据的更新间隔(分钟)
    arrearageInterval: 5 as number,  // 欠费数据更新间隔
    pdfInterval: 10 as number,       // PDF数据更新间隔
    adsInterval: 15 as number,       // 广告数据更新间隔
    // 存储各个定时器ID
    scheduledTaskIds: {
      arrearage: null as number | null,
      pdf: null as number | null,
      ads: null as number | null
    },
    updateIntervals: {
      arrearage: 5,  // 欠费数据更新间隔(分钟)
      pdf: 10,       // PDF数据更新间隔(分钟)
      ads: 15        // 广告数据更新间隔(分钟)
    }
  }),

  getters: {
    canRetry(state): boolean {
      return state.retryCount < state.maxRetries;
    }
  },

  actions: {
    // 设置各类数据的更新间隔
    setInterval(type: 'arrearage' | 'pdf' | 'ads', minutes: number) {
      const intervalMap = {
        arrearage: 'arrearageInterval',
        pdf: 'pdfInterval',
        ads: 'adsInterval'
      };
      this[intervalMap[type]] = Math.max(1, minutes);
    },

    // 开始所有定时任务
    startAllTasks() {
      this.startTask('arrearage');
      this.startTask('pdf');
      this.startTask('ads');
    },

    // 开始单个定时任务
    startTask(type: 'arrearage' | 'pdf' | 'ads') {
      // 先清除现有的定时器
      this.stopTask(type);
      
      const intervalMap = {
        arrearage: this.arrearageInterval,
        pdf: this.pdfInterval,
        ads: this.adsInterval
      };

      // 设置新的定时器
      this.scheduledTaskIds[type] = window.setInterval(() => {
        this.executeTask(type);
      }, intervalMap[type] * 60 * 1000);

      // 立即执行一次
      this.executeTask(type);
    },

    // 停止单个定时任务
    stopTask(type: 'arrearage' | 'pdf' | 'ads') {
      if (this.scheduledTaskIds[type] !== null) {
        clearInterval(this.scheduledTaskIds[type]!);
        this.scheduledTaskIds[type] = null;
      }
    },

    // 停止所有定时任务
    stopAllTasks() {
      Object.keys(this.scheduledTaskIds).forEach(type => {
        this.stopTask(type as keyof typeof this.scheduledTaskIds);
      });
    },

    async executeTask(type: 'arrearage' | 'pdf' | 'ads') {
      if (this.isRunning) return;

      try {
        this.isRunning = true;
        await timeTask(type);
        this.retryCount = 0;
      } catch (error) {
        console.error(`Task execution failed (${type}):`, error);
        const notificationStore = useNotificationStore();
        
        if (this.canRetry) {
          this.retryCount++;
          notificationStore.addNotification(
            `${type}任務執行失敗，正在重試 (${this.retryCount}/${this.maxRetries})`,
            'warning'
          );
          // 5秒后重试
          setTimeout(() => this.executeTask(type), 5000);
        } else {
          notificationStore.addNotification(`${type}任務執行失敗，已達到最大重試次數`, 'error');
          this.retryCount = 0;
        }
      } finally {
        this.isRunning = false;
      }
    },

    // 初始化任务
    initialize() {
      const isLoggedIn = localStorage.getItem('ismartId') && localStorage.getItem('password');
      if (isLoggedIn) {
        this.startAllTasks();
      }
    },

    setUpdateInterval(type: 'arrearage' | 'pdf' | 'ads', minutes: number) {
      this.updateIntervals[type] = Math.max(1, minutes);
      // 重启对应的定时任务
      this.stopTask(type);
      this.startTask(type);
    }
  }
});
