<template>
  <div class="flex h-full w-full relative bg-[#ffffff] px-4">
    <div class="w-full">
      <!-- 信息卡片 -->
      <div class="bg-white rounded-xl border border-grey p-6 shadow-[0_2px_8px_rgba(0,0,0,0.06)] mb-6">
        <div class="flex items-center justify-between">
          <!-- 标题部分 -->
          <div class="flex flex-col">
            <span class="text-2xl font-bold text-primary tracking-wider mb-1">欠費查詢</span>
            <span class="text-sm font-medium text-neutral tracking-widest uppercase">Payment Query</span>
          </div>
          
          <!-- 信息部分 -->
          <div v-if="arrearageStore.hasData" class="flex items-center gap-8">
            <!-- 楼号信息 -->
            <div class="flex flex-col border-r border-gray-200 pr-8">
              <span class="text-sm text-neutral mb-1">樓號</span>
              <span class="text-xl font-medium text-primary">{{ selectedBuilding }}樓</span>
            </div>
            
            <!-- 户号信息 -->
            <div class="flex flex-col">
              <span class="text-sm text-neutral mb-1">單位</span>
              <span class="text-xl font-medium text-primary">{{ selectedFloor }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 欠费记录表格 -->
      <template v-if="arrearageStore.hasData">
        <div class="bg-white rounded-xl border border-grey p-4 shadow-[0_2px_8px_rgba(0,0,0,0.06)] mb-6">
          <div class="flex justify-between items-center mt-6">
            <!-- 上一页按钮 -->
            <button
              @click="handlePrevRecordPage"
              class="px-6 py-2 rounded-lg text-sm font-medium transition-colors duration-200 min-w-[100px]"
              :class="recordPage > 1 ? 'bg-primary text-white hover:bg-primary/90' : 'bg-gray-100 text-gray-400 cursor-not-allowed'"
              :disabled="recordPage === 1"
            >
              上一頁
            </button>

            <!-- 记录展示区域 -->
            <div class="grid grid-cols-4 gap-4 text-center flex-1 mx-6">
              <template v-for="item in paginatedRecords" :key="item.key">
                <div class="flex flex-col p-3 bg-white rounded-xl border border-grey shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
                  <span class="text-sm text-neutral mb-2">{{ item.key }}</span>
                  <span class="font-medium" :class="getStatusClass(item.value)">
                    {{ item.value }}
                  </span>
                </div>
              </template>
            </div>

            <!-- 下一页按钮 -->
            <button
              @click="handleNextRecordPage"
              class="px-6 py-2 rounded-lg text-sm font-medium transition-colors duration-200 min-w-[100px]"
              :class="recordPage < totalRecordPages ? 'bg-primary text-white hover:bg-primary/90' : 'bg-gray-100 text-gray-400 cursor-not-allowed'"
              :disabled="recordPage === totalRecordPages"
            >
              下一頁
            </button>
          </div>
        </div>

        <!-- 选择器容器 -->
        <div class="bg-white rounded-xl border border-grey p-4 shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
          <!-- 楼号选择器 -->
          <div class="relative flex items-center justify-between mb-4">
            <!-- 上一页按钮 -->
            <button
              @click="handlePrevBuildingPage"
              class="px-6 py-2 rounded-lg text-sm font-medium transition-colors duration-200 min-w-[100px]"
              :class="buildingPage === 1 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                : 'bg-primary text-white hover:bg-primary/90'"
              :disabled="buildingPage === 1"
            >
              上一頁
            </button>

            <!-- 选择器 -->
            <div class="flex justify-center gap-2 overflow-hidden w-[80%]">
              <div class="flex gap-2 flex-wrap justify-center">
                <template v-for="building in paginatedBuildings" :key="building">
                  <button 
                    @click="handleBuildingSelect(building)"
                    class="px-6 py-3 rounded-lg text-base font-medium whitespace-nowrap transition-colors duration-200 min-w-[80px]"
                    :class="selectedBuilding === building 
                      ? 'bg-primary text-white shadow-lg scale-110' 
                      : 'bg-gray-100 text-neutral hover:bg-gray-200'"
                  >
                    {{ building }}樓
                  </button>
                </template>
              </div>
            </div>

            <!-- 下一页按钮 -->
            <button
              @click="handleNextBuildingPage"
              class="px-6 py-2 rounded-lg text-sm font-medium transition-colors duration-200 min-w-[100px]"
              :class="buildingPage === totalBuildingPages 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                : 'bg-primary text-white hover:bg-primary/90'"
              :disabled="buildingPage === totalBuildingPages"
            >
              下一頁
            </button>
          </div>

          <!-- 楼层选择器 -->
          <div class="relative flex items-center justify-between">
            <!-- 上一页按钮 -->
            <button
              @click="handlePrevFloorPage"
              class="px-6 py-2 rounded-lg text-sm font-medium transition-colors duration-200 min-w-[100px]"
              :class="floorPage === 1 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                : 'bg-primary text-white hover:bg-primary/90'"
              :disabled="floorPage === 1"
            >
              上一頁
            </button>

            <!-- 选择器 -->
            <div class="flex justify-center gap-2 overflow-hidden w-[80%]">
              <div class="flex gap-2 flex-wrap justify-center">
                <template v-for="floor in paginatedFloors" :key="floor">
                  <button 
                    @click="handleFloorSelect(floor)"
                    class="px-6 py-3 rounded-lg text-base font-medium whitespace-nowrap transition-colors duration-200 min-w-[80px]"
                    :class="selectedFloor === floor 
                      ? 'bg-primary text-white shadow-lg scale-110' 
                      : 'bg-gray-100 text-neutral hover:bg-gray-200'"
                  >
                    {{ floor }}
                  </button>
                </template>
              </div>
            </div>

            <!-- 下一页按钮 -->
            <button
              @click="handleNextFloorPage"
              class="px-6 py-2 rounded-lg text-sm font-medium transition-colors duration-200 min-w-[100px]"
              :class="floorPage === totalFloorPages 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                : 'bg-primary text-white hover:bg-primary/90'"
              :disabled="floorPage === totalFloorPages"
            >
              下一頁
            </button>
          </div>
        </div>
      </template>

      <!-- 无数据显示 -->
      <div v-else class="flex flex-col items-center justify-center py-12">
        <div class="text-neutral text-lg mb-2">暫無欠費數據</div>
        <div class="text-gray-400">請稍後再試或聯繫管理員</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useArrearageStore } from '@renderer/stores/arrearage_store';

const arrearageStore = useArrearageStore();

// 分页相关状态
const recordPage = ref(1);
const buildingPage = ref(1);
const floorPage = ref(1);
const itemsPerPage = 6;

// 获取数据
const buildings = computed(() => arrearageStore.getBuildings);
const floors = computed(() => {
  if (!selectedBuilding.value) return [];
  return arrearageStore.getFloors(selectedBuilding.value);
});

// 分页计算属性
const totalBuildingPages = computed(() => Math.ceil(buildings.value.length / itemsPerPage));
const totalFloorPages = computed(() => Math.ceil(floors.value.length / itemsPerPage));

const paginatedBuildings = computed(() => {
  const start = (buildingPage.value - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  return buildings.value.slice(start, end);
});

const paginatedFloors = computed(() => {
  const start = (floorPage.value - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  return floors.value.slice(start, end);
});

// 记录相关计算属性
const records = computed(() => {
  const record = arrearageStore.getCurrentArrearage;
  if (!record) return [];

  return Object.entries(record).map(([key, value]) => ({
    key,
    value
  }));
});

const totalRecordPages = computed(() => Math.ceil(records.value.length / itemsPerPage));

const paginatedRecords = computed(() => {
  const start = (recordPage.value - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  return records.value.slice(start, end);
});

// 分页控制方法
const handlePrevRecordPage = () => {
  if (recordPage.value > 1) recordPage.value--;
};

const handleNextRecordPage = () => {
  if (recordPage.value < totalRecordPages.value) recordPage.value++;
};

const handlePrevBuildingPage = () => {
  if (buildingPage.value > 1) buildingPage.value--;
};

const handleNextBuildingPage = () => {
  if (buildingPage.value < totalBuildingPages.value) buildingPage.value++;
};

const handlePrevFloorPage = () => {
  if (floorPage.value > 1) floorPage.value--;
};

const handleNextFloorPage = () => {
  if (floorPage.value < totalFloorPages.value) floorPage.value++;
};

// 选择处理方法
const handleBuildingSelect = (building: string) => {
  recordPage.value = 1;
  floorPage.value = 1;
  arrearageStore.setSelectedBuilding(building);
};

const handleFloorSelect = (floor: string) => {
  recordPage.value = 1;
  arrearageStore.setSelectedFloor(floor);
};

const getStatusClass = (status: string | number) => {
  if (status === '已付') {
    return 'text-green-500';
  }
  if (typeof status === 'number' && status < 0) {
    return 'text-red-500';
  }
  return 'text-neutral';
};

// 在 floors computed 属性之后添加
const selectedBuilding = computed({
  get: () => arrearageStore.selectedBuilding,
  set: (value: string | null) => {
    if (value) arrearageStore.setSelectedBuilding(value);
  }
});

const selectedFloor = computed({
  get: () => arrearageStore.selectedFloor,
  set: (value: string | null) => {
    if (value) arrearageStore.setSelectedFloor(value);
  }
});
</script>

