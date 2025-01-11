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
    <div class="w-full h-[15%] shadow-inner bg-white shrink-0">
      <CombinedFooter class="w-full h-full" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount } from 'vue';
import api from '@renderer/apis';

import AdvertisementTop from '@renderer/components/ADTop/AdvertisementTop.vue';
import CombinedFooter from '@renderer/components/footer/CombinedFooter.vue';
import NavBar from '@renderer/components/NavBar/NavBar.vue';

let healthCheckInterval: number | undefined;

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
  startHealthCheck();
});

// 组件销毁前清理定时器
onBeforeUnmount(() => {
  if (healthCheckInterval) {
    clearInterval(healthCheckInterval);
    healthCheckInterval = undefined;
  }
});
</script>
