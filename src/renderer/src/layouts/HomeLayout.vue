<template>
  <div class="flex flex-col h-screen overflow-hidden bg-white">
    <!-- 顶部广告区域 -->
    <div class="w-full aspect-video shadow-md shrink-0">
      <AdvertisementTop class="w-full h-full" />
    </div>

    <!-- 导航栏区域 -->
    <div class="w-full h-[5rem] shadow-sm bg-white sticky top-0 mb-4 z-50 shrink-0">
      <NavBar class="w-full h-full" />
    </div>

    <!-- 主内容区域 -->
    <div class="flex-1 w-full relative overflow-auto"> 
      <RouterView />
    </div>

    <!-- 底部区域 - 固定在底部 -->
    <div class="w-full h-[15rem]  shadow-inner bg-white shrink-0">
      <CombinedFooter class="w-full h-full" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';
import api from '@renderer/apis';

import AdvertisementTop from '@renderer/components/ADTop/AdvertisementTop.vue';
import CombinedFooter from '@renderer/components/footer/CombinedFooter.vue';
import NavBar from '@renderer/components/NavBar/NavBar.vue';

import { useAdsStore } from '@renderer/stores/ads_store';
import { useBuildingStore } from '@renderer/stores/building_store';
import { useNoticeStore } from '@renderer/stores/notice_store';
import { useNotificationStore } from '@renderer/stores/noticefication_store';
import { useTaskStore } from '@renderer/stores/task_store';
import { useFlowStore } from '@renderer/stores/flow_store';
import { getDeviceId } from '@renderer/utils/device';

const router = useRouter();
const notificationStore = useNotificationStore();
const BuildingStore = useBuildingStore();
const AdsStore = useAdsStore();
const NoticeStore = useNoticeStore();
const FlowStore = useFlowStore();
const taskStore = useTaskStore();

let healthCheckInterval: number | undefined;
let autoLoginInterval: number | undefined;

// 修改自动登录函数，移除下载任务相关的代码
const handleAutoLogin = async () => {
  try {
    const deviceId = await getDeviceId();
    const loginData = {
      deviceId
    };
    
    const response = await api.login(loginData);
    const token = response.token;
    
    localStorage.setItem('deviceId', loginData.deviceId);
    localStorage.setItem('token', token);

    // 只更新大厦信息和配置
    FlowStore.updateConfigFromSettings(response.data.settings);
    BuildingStore.setBuilding(response.data);
    taskStore.updateIntervalsFromSettings(response.data.settings);
    
    console.log('自动登录成功，已更新大厦信息:', new Date().toLocaleString());
  } catch (error) {
    console.error('自动登录失败:', error);
    notificationStore.addNotification('自动登录失败', 'error');
    router.push('/setting');
  }
};

// 新增：启动自动登录定时器
const startAutoLogin = () => {
  // 立即执行一次完整的初始登录（包含下载任务）
  handleInitialLogin();
  
  // 设置每分钟执行一次的自动登录（只更新大厦信息）
  autoLoginInterval = window.setInterval(() => {
    void handleAutoLogin();
  }, 60 * 1000);
};

// 新增：处理初始登录
const handleInitialLogin = async () => {
  try {
    await handleAutoLogin();
    
    // 只在初始登录时执行这些操作
    const token = localStorage.getItem('token');
    if (!token) return;
    
    // 获取广告和通知列表
    const adsResponse = await api.getAdvertisements(token);
    AdsStore.setAds(adsResponse.data);
    
    const noticesResponse = await api.getNotices(token);
    NoticeStore.setNotices(noticesResponse.data);
    
    // 获取 taskStore 实例
    const taskStore = useTaskStore();
    
    // 执行初始任务下载
    await taskStore.executeTask('ads');
    await taskStore.executeTask('pdf');
    await taskStore.executeTask('arrearage');
    
    // 启动定时任务
    taskStore.startAllTasks();
    
    notificationStore.addNotification('初始登录成功', 'success');
  } catch (error) {
    console.error('初始登录失败:', error);
    notificationStore.addNotification('初始登录失败', 'error');
    router.push('/setting');
  }
};

// 心跳检测函数
const sendHealthCheck = async () => {
  try {
    await api.sendHealthCheck();
    console.log('心跳检测成功:', new Date().toLocaleString());
  } catch (error) {
    console.error('心跳检测失败:', error);
  }
};

// 启动心跳检测
const startHealthCheck = () => {
  // 立即执行一次
  void sendHealthCheck();
  
  // 设置5分钟定时器
  healthCheckInterval = window.setInterval(() => {
    void sendHealthCheck();
  }, 5 * 60 * 1000);
};

onMounted(() => {
  // 启动自动登录
  startAutoLogin();
  // 启动心跳检测
  startHealthCheck();
});

// 组件销毁前清理所有定时器
onBeforeUnmount(() => {
  if (healthCheckInterval) {
    clearInterval(healthCheckInterval);
    healthCheckInterval = undefined;
  }
  if (autoLoginInterval) {
    clearInterval(autoLoginInterval);
    autoLoginInterval = undefined;
  }
});
</script>
