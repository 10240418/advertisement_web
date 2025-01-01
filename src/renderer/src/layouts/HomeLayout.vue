<template>
  <div class="flex flex-col min-h-screen bg-white">
    <!-- 顶部广告区域 -->
    <div class="w-full h-[25rem] shadow-md">
      <AdvertisementTop class="w-full h-full" />
    </div>

    <!-- 导航栏区域 -->
    <div class="w-full h-[5rem] shadow-sm bg-white sticky top-0 z-50">
      <NavBar class="w-full h-full" />
    </div>

    <!-- 主内容区域 -->
    <div class="flex-1 h-[calc(100%-30rem-15vh)] py-4  w-full relative">
      <RouterView />
    </div>

    <!-- 底部天气区域 -->
    <div class="w-full h-[15vh] shadow-inner">
      <WeatherFooter class="w-full h-full" />
    </div>
  </div>
</template>

<script setup>
import { onBeforeMount } from 'vue';

import AdvertisementTop from '@renderer/components/ADTop/AdvertisementTop.vue';
import WeatherFooter from '@renderer/components/footer/WeatherFooter.vue';
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
