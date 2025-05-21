<template>
  <div class="resource-manager">
    <div class="tabs">
      <div
        class="tab"
        :class="{ active: activeTab === 'cache' }"
        @click="activeTab = 'cache'"
      >
        缓存管理
      </div>
      <div
        class="tab"
        :class="{ active: activeTab === 'ads' }"
        @click="activeTab = 'ads'"
      >
        广告管理
      </div>
      <div
        class="tab"
        :class="{ active: activeTab === 'demo' }"
        @click="activeTab = 'demo'"
      >
        快捷测试
      </div>
    </div>

    <div class="tab-content">
      <div v-if="activeTab === 'cache'" class="p-4">
        <ResetCache />
      </div>
      <div v-if="activeTab === 'ads'" class="p-4">
        <AdDownloader />
      </div>
      <div v-if="activeTab === 'demo'" class="p-4">
        <AdDemo />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import ResetCache from "@renderer/components/ResetCache.vue";
import AdDownloader from "@renderer/components/AdDownloader.vue";
import AdDemo from "@renderer/components/AdDemo.vue";

// 当前活动选项卡
const activeTab = ref("cache");
</script>

<style scoped>
.resource-manager {
  background-color: #f7f7f7;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.tabs {
  display: flex;
  background-color: #fff;
  border-bottom: 1px solid #e2e8f0;
}

.tab {
  padding: 0.75rem 1.25rem;
  font-weight: 500;
  color: #4a5568;
  cursor: pointer;
  transition: all 0.2s;
}

.tab:hover {
  color: #2d3748;
  background-color: #f1f5f9;
}

.tab.active {
  color: #2563eb;
  border-bottom: 2px solid #2563eb;
}

.tab-content {
  background-color: white;
  min-height: 400px;
}
</style>
