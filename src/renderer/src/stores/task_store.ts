import { defineStore } from 'pinia';
import { timeTask } from '@renderer/utils/time-task';
import { useNotificationStore } from './noticefication_store';
import type { DeviceSettings } from './building_store';

export const useTaskStore = defineStore('task', {
  state: () => ({
    isRunning: false as boolean,
    retryCount: 0 as number,
    maxRetries: 3 as number,
    // 修改为秒为单位
    intervals: {
      arrearage: 300,  // 5分钟 = 300秒
      pdf: 600,        // 10分钟 = 600秒
      ads: 900         // 15分钟 = 900秒
    },
    // 存储各个定时器ID
    scheduledTaskIds: {
      arrearage: null as number | null,
      pdf: null as number | null,
      ads: null as number | null
    }
  }),

  getters: {
    canRetry(state): boolean {
      return state.retryCount < state.maxRetries;
    },
    // 添加获取间隔时间的 getter
    getInterval: (state) => (type: keyof typeof state.intervals) => {
      return state.intervals[type];
    }
  },

  actions: {
    // 修改从设备设置更新间隔时间的方法
    updateIntervalsFromSettings(settings: DeviceSettings) {
      // 后端返回的就是秒，直接使用
      this.intervals = {
        arrearage: settings.arrearageUpdateDuration,
        pdf: settings.noticeUpdateDuration,
        ads: settings.advertisementUpdateDuration
      };
      
      // 重启所有定时任务以应用新的间隔时间
      this.stopAllTasks();
      this.startAllTasks();
    },

    // 修改设置间隔的方法
    setInterval(type: keyof typeof this.intervals, seconds: number) {
      this.intervals[type] = Math.max(1, seconds);
      // 重启对应的定时任务
      this.stopTask(type);
      this.startTask(type);
    },

    // 开始所有定时任务
    startAllTasks() {
      console.log('startAllTasks')
      Object.keys(this.intervals).forEach(type => {
        this.startTask(type as keyof typeof this.intervals);
      });
    },

    // 开始单个定时任务
    startTask(type: keyof typeof this.intervals) {
      // 先清除现有的定时器
      this.stopTask(type);
      
      // 设置新的定时器，直接使用秒数 * 1000
      this.scheduledTaskIds[type] = window.setInterval(() => {
        this.executeTask(type);
      }, this.intervals[type] * 1000);

      // 立即执行一次
      this.executeTask(type);
    },

    // 停止单个定时任务
    stopTask(type: keyof typeof this.intervals) {
      if (this.scheduledTaskIds[type] !== null) {
        clearInterval(this.scheduledTaskIds[type]!);
        this.scheduledTaskIds[type] = null;
      }
    },

    // 停止所有定时任务
    stopAllTasks() {
      Object.keys(this.scheduledTaskIds).forEach(type => {
        this.stopTask(type as keyof typeof this.intervals);
      });
    },

    async executeTask(type: keyof typeof this.intervals) {
      console.log('executeTask', type, this.isRunning)
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
      const isLoggedIn = localStorage.getItem('token') && localStorage.getItem('ismartId');
      if (isLoggedIn) {
        this.startAllTasks();
      }
    }
  },

});
