<!-- src/renderer/src/views/setting/setting.vue -->
<template>
  <div class="p-8 flex items-center justify-center">
    <div class="w-full max-w-2xl bg-white rounded-xl border border-gray-200 shadow-[0_2px_8px_rgba(0,0,0,0.06)] p-8">
      <!-- Login Form -->
      <div class="space-y-8">
        <h1 class="text-4xl font-bold text-center tracking-wider text-gray-900">
          账户绑定
        </h1>
        
        <div class="space-y-6">
          <div class="relative">
            <label 
              for="username"
              class="block text-lg font-semibold text-gray-700 mb-2"
            >
              用户名
            </label>
            <input
              id="username"
              v-model="loginData.ismartId"
              type="text"
              class="w-full h-14 px-4 text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-lg"
              required
            />
          </div>

          <div class="relative">
            <label 
              for="password"
              class="block text-lg font-semibold text-gray-700 mb-2"
            >
              密码
            </label>
            <input
              id="password"
              v-model="loginData.password"
              type="password"
              class="w-full h-14 px-4 text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-lg"
              required
            />
          </div>

          <button 
            class="w-full h-14 bg-[#007AFF] hover:bg-blue-600 text-white font-bold text-lg rounded-lg shadow-lg transition-colors duration-200 flex items-center justify-center tracking-wider"
            @click="handleLogin"
          >
            绑定
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

import { useRouter } from 'vue-router';

import type { LoginRequest } from '@renderer/apis';
import api from '@renderer/apis';
import { useAdsStore } from '@renderer/stores/ads_store';
import { useBuildingStore } from '@renderer/stores/building_store';
import { useNoticeStore } from '@renderer/stores/notice_store';
import { useNotificationStore } from '@renderer/stores/noticefication_store';
import { useArrearageStore } from '@renderer/stores/arrearage_store';
import { useTaskStore } from '@renderer/stores/task_store';

const router = useRouter();
const notificationStore = useNotificationStore();
const BuildingStore = useBuildingStore();
const AdsStore = useAdsStore();
const NoticeStore = useNoticeStore();
const ArrearageStore = useArrearageStore();

// Login form data
const loginData = ref<LoginRequest>({
  ismartId: '0314100',
  password: 'admin123'
});

const handleLogin = async () => {
  try {
    // 获取 taskStore 实例
    const taskStore = useTaskStore();
    
    // 调用登录接口
    const response = await api.login(loginData.value);
    const token = response.token;
    
    // 保存登录信息和token
    localStorage.setItem('ismartId', loginData.value.ismartId);
    localStorage.setItem('password', loginData.value.password);
    localStorage.setItem('token', token);
    
    // 设置大楼信息
    BuildingStore.setBuilding(response.data);
    
    // 获取广告列表
    const adsResponse = await api.getAdvertisements(token);
    AdsStore.setAds(adsResponse.data);
    
    // 获取通知列表
    const noticesResponse = await api.getNotices(token);
    NoticeStore.setNotices(noticesResponse.data);
    
    // 立即执行一次所有任务的下载
    await taskStore.executeTask('ads');
    await taskStore.executeTask('pdf');
    await taskStore.executeTask('arrearage');
    
    // 启动定时任务（HomeLayout 会处理这个）
    taskStore.startAllTasks();
    
    // 显示成功提示
    notificationStore.addNotification('绑定成功', 'success');
    
    // 跳转到详情页
    router.push('/buildingDetail');
  } catch (error) {
    console.error('API error:', error);
    notificationStore.addNotification('绑定失败，请检查账号密码', 'error');
  }
}
</script>