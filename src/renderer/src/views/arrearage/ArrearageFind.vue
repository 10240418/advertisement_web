<template>
  <div class="flex h-full w-full relative bg-[#ffffff] px-4">
    <div class="w-full">
      <template v-if="arrearageStore.hasData">
        <!-- 1. 选择器容器 -->
        <div class="bg-white rounded-xl border border-grey p-4 shadow-[0_2px_8px_rgba(0,0,0,0.06)] mb-6">
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

        <!-- 2. 查询按钮 -->
        <div class="flex justify-center mb-6">
          <button
            @click="handleQuery"
            class="px-10 py-3 bg-primary text-white font-medium rounded-lg shadow-md hover:bg-primary/90 transition-colors duration-200 text-lg"
            :disabled="!selectedBuilding || !selectedFloor"
          >
            查詢繳費記錄
          </button>
        </div>

        <!-- 3. 信息部分 (查询结果) -->
        <div class="bg-white rounded-xl border border-grey p-4 shadow-[0_2px_8px_rgba(0,0,0,0.06)]" v-if="showResults">
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
const showResults = ref(false); // 控制是否显示查询结果

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

// 查询处理方法
const handleQuery = () => {
  if (selectedBuilding.value && selectedFloor.value) {
    // 直接使用当前选择的楼号和户号来获取数据
    // 不需要调用fetchArrearage，因为setSelectedBuilding和setSelectedFloor已经设置了查询参数
    // store会通过getCurrentArrearage getter自动获取对应的欠费数据
    recordPage.value = 1;
    showResults.value = true;
  }
};

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

// 选择处理方法 - 现在只更新选择状态，不触发查询
const handleBuildingSelect = (building: string) => {
  floorPage.value = 1;
  arrearageStore.setSelectedBuilding(building);
  showResults.value = false; // 重置查询结果显示
};

const handleFloorSelect = (floor: string) => {
  arrearageStore.setSelectedFloor(floor);
  showResults.value = false; // 重置查询结果显示
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

