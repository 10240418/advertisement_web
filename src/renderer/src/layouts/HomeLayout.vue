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
    <div class="flex-1 w-full relative overflow-auto "> 
   
      <RouterView />
     
    </div>

    <!-- 底部区域 - 固定在底部 -->
    <div class="w-full h-[15%] shadow-inner bg-white shrink-0">
      <CombinedFooter class="w-full h-full" />
    </div>
  </div>
</template>

<script setup>
import { onBeforeMount } from 'vue';

import AdvertisementTop from '@renderer/components/ADTop/AdvertisementTop.vue';
import CombinedFooter from '@renderer/components/footer/CombinedFooter.vue';
import NavBar from '@renderer/components/NavBar/NavBar.vue';
import { useTaskStore } from '@renderer/stores/task_store';

const taskStore = useTaskStore()

onBeforeMount(() => {
  try {
    if (localStorage.getItem('updateInterval')) {
      taskStore.initialize()
    }
  } catch (error) {
    console.error('初始化任务存储时出错:', error)
  }
})
</script>
