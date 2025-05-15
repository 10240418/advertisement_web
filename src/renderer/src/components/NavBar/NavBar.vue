<template>
  <nav class="w-full h-full px-4 bg-white">
    <div class="flex justify-between items-center h-full">
      <!-- 左侧返回/设置按钮 -->
      <button
        v-if="showButton"
        @click="handleNavigation"
        class="h-[32px] px-3 flex justify-center items-center gap-1 rounded-md bg-[#007AFF] text-white text-sm tracking-wider shadow-sm hover:bg-[#0066CC] transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-300 active:transform active:scale-95"
        :aria-label="buttonText"
        tabindex="0"
      >
        <img
          :src="getButtonIcon"
          :alt="buttonText + '图标'"
          class="w-3.5 h-3.5 filter brightness-0 invert"
        />
        <span class="font-medium">{{ buttonText }}</span>
      </button>

      <!-- 隐藏的点击区域 -->
      <div
        v-if="!showButton && isHomePage"
        @click="handleSecretClick"
        class="h-[32px] w-[32px] cursor-default"
        aria-hidden="true"
      ></div>

      <!-- 中间的欠费表按钮 -->
      <!-- <button 
        @click="handleArrearageTable"
        class="h-[52px] px-6 flex justify-center items-center gap-2 rounded-lg
               bg-[#28CD41] text-white text-xl tracking-wider
               shadow-sm hover:bg-[#22B939] 
               transition-all duration-200 ease-in-out
               focus:outline-none focus:ring-2 focus:ring-green-300
               active:transform active:scale-95"
        aria-label="查看欠費表"
        tabindex="0"
      >
        <span class="font-medium">欠費表</span>
      </button> -->

      <!-- 右侧可选的其他导航元素 -->
      <slot name="right"></slot>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();
const clickCount = ref(0);
const showButton = computed(() => {
  const path = router.currentRoute.value.path;
  return path !== "/";
});
// handleArrearageTable
const handleArrearageTable = () => {
  router.push("/arrearage-table");
};

const isHomePage = computed(() => {
  return router.currentRoute.value.path === "/";
});

// 处理秘密点击
const handleSecretClick = () => {
  clickCount.value++;
  if (clickCount.value >= 5) {
    clickCount.value = 0;
    const token = localStorage.getItem("token");
    if (token) {
      router.push("/setting");
    } else {
      router.push("/setting");
    }
  }
};

// 根据当前路由计算按钮文本
const buttonText = computed(() => {
  const path = router.currentRoute.value.path;
  if (path === "/") return "设置";
  if (path === "/setting") return "回到首頁";
  if (path === "/buildingDetail") return "回到首頁";
  if (path === "/arrearage-table") return "回到首頁";
  return "回到首頁";
});

// 获取按钮图标
const getButtonIcon = computed(() => {
  return new URL("@renderer/assets/button/button-left.svg", import.meta.url)
    .href;
});

// 处理导航逻辑
const handleNavigation = () => {
  const path = router.currentRoute.value.path;
  const token = localStorage.getItem("token");

  if (path === "/") {
    // 从首页点击设置按钮时，根据token决定跳转目标
    if (token) {
      router.push("/buildingDetail");
    } else {
      router.push("/setting");
    }
  } else if (path === "/setting") {
    router.push("/");
  } else if (path === "/buildingDetail") {
    router.push("/");
  } else if (path === "/arrearage-table") {
    router.push("/");
  } else {
    router.push("/");
  }
};
</script>
