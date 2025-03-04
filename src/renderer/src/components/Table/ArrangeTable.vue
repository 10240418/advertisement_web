<template>
  <div class="bg-white rounded-xl  mx-4 border border-grey p-4 shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
    <div class="overflow-x-auto" ref="tableContainer">
      <table class="w-full">
        <!-- 动态表头 -->
        <thead>
          <tr class="bg-primary text-white">
            <th class="px-6 py-3 text-left text-sm font-medium tracking-wider rounded-tl-lg">
              單位
            </th>
            <!-- 动态生成表头 -->
            <th v-for="header in tableHeaders" 
                :key="header"
                class="px-6 py-3 text-left text-sm font-medium tracking-wider"
                :class="{ 'rounded-tr-lg': header === tableHeaders[tableHeaders.length - 1] }">
              {{ header }}
            </th>
          </tr>
        </thead>

        <!-- 表格内容 -->
        <tbody class="bg-white divide-y divide-gray-200">
          <tr v-if="!paginatedRecords?.length" class="text-center">
            <td :colspan="tableHeaders.length + 1" class="px-6 py-4 text-sm text-gray-500">
              暫無數據
            </td>
          </tr>
          <tr v-for="(record, index) in paginatedRecords" 
              :key="index"
              :class="index % 2 === 0 ? 'bg-gray-50' : 'bg-white'"
              class="hover:bg-gray-100 transition-colors duration-150 ease-in-out">
            <td class="px-6 py-4 whitespace-nowrap text-sm text-neutral">
              {{ record.單位 }}
            </td>
            <td v-for="header in tableHeaders" 
                :key="header"
                class="px-6 py-4 whitespace-nowrap">
              <span :class="getStatusClass(record[header])"
                    class="px-3 py-1 rounded-full text-sm font-medium">
                {{ getStatusText(record[header]) }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 分页控件 -->
    <div v-if="records?.length" class="flex justify-between items-center mt-4 px-6">
      <!-- <button
        @click="handlePrevPage"
        class="px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-200"
        :class="currentPage > 1 
          ? 'bg-primary text-white hover:bg-primary/90' 
          : 'bg-gray-100 text-gray-400 cursor-not-allowed'"
        :disabled="currentPage === 1"
      >
        上一頁
      </button> -->
      
      <span class="text-sm text-neutral">
        第 {{ currentPage }} 頁，共 {{ totalPages }} 頁
      </span>
<!--       
      <button
        @click="handleNextPage"
        class="px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-200"
        :class="currentPage < totalPages 
          ? 'bg-primary text-white hover:bg-primary/90' 
          : 'bg-gray-100 text-gray-400 cursor-not-allowed'"
        :disabled="currentPage === totalPages"
      >
        下一頁
      </button> -->
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, onActivated, onDeactivated } from 'vue';

import { useArrearageStore } from '@renderer/stores/arrearage_store';
import { useFlowStore } from '@renderer/stores/flow_store';

// 使用 stores
const arrearageStore = useArrearageStore();
const flowStore = useFlowStore();

// 获取动态表头
const tableHeaders = computed(() => {
  if (!arrearageStore.records.length) return [];
  
  // 获取第一条记录的所有键，排除 '單位' 字段
  const firstRecord = arrearageStore.records[0];
  return Object.keys(firstRecord).filter(key => key !== '單位');
});

// Props 接口
interface Props {
  itemsPerPage?: number;
  autoScroll?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  itemsPerPage: 13,
  autoScroll: false
});

// 使用 store 中的记录
const records = computed(() => arrearageStore.records);

// 分页数据
const paginatedRecords = computed(() => {
  if (!records.value?.length) return [];
  const start = (currentPage.value - 1) * props.itemsPerPage;
  const end = start + props.itemsPerPage;
  return records.value.slice(start, end);
});

// 状态样式处理函数
const getStatusClass = (value: string | number | undefined) => {
  if (value === undefined) return 'bg-gray-100 text-gray-800';
  if (value === '已付') return 'bg-green-100 text-green-800';
  if (typeof value === 'number' && value < 0) return 'bg-red-100 text-red-800';
  return 'bg-gray-100 text-gray-800';
};

const getStatusText = (value: string | number | undefined) => {
  if (value === undefined) return '-';
  return value.toString();
};

// 修改自动翻页相关逻辑
const pageInterval = ref<NodeJS.Timeout | null>(null);
const PAGE_CHANGE_INTERVAL = computed(() => flowStore.timeoutConfig.pdfPage);
const isFirstMount = ref(true);

// 初始化页码
const initializePage = () => {
  if (isFirstMount.value) {
    // 如果是第一次加载，检查是否有存储的页码
    currentPage.value = flowStore.lastArrearageTablePage;
    isFirstMount.value = false;
  }
};

const startAutoPageChange = () => {
  if (pageInterval.value) return;
  
  initializePage();
  
  pageInterval.value = setInterval(() => {
    if (currentPage.value < totalPages.value) {
      handleNextPage();
    } else {
      // 当到达最后一页时，添加与 display 时间相同的延迟后再重置
      setTimeout(() => {
        currentPage.value = 1;
        flowStore.setLastArrearageTablePage(1);
      }, flowStore.timeoutConfig.display / 3); // 使用展示时间的1/3作为过渡延迟
    }
  }, PAGE_CHANGE_INTERVAL.value);
};

const stopAutoPageChange = () => {
  if (pageInterval.value) {
    clearInterval(pageInterval.value);
    pageInterval.value = null;
  }
};

// 修改页码变化处理函数
const handlePrevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--;
    flowStore.setLastArrearageTablePage(currentPage.value);
  }
};

const handleNextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++;
    flowStore.setLastArrearageTablePage(currentPage.value);
  } else {
    // 添加过渡动画类
    const tableContainer = document.querySelector('.overflow-x-auto');
    if (tableContainer) {
      tableContainer.classList.add('table-transition');
      setTimeout(() => {
        currentPage.value = 1;
        flowStore.setLastArrearageTablePage(1);
        // 移除过渡动画类
        tableContainer.classList.remove('table-transition');
      }, 300); // 300ms 过渡动画
    } else {
      currentPage.value = 1;
      flowStore.setLastArrearageTablePage(1);
    }
  }
};

// 监听 flowStore 的屏幕状态
watch(() => flowStore.currentScreenState, (newState) => {
  if (newState === 'arrearage-table') {
    startAutoPageChange();
  } else {
    // 保存当前页码
    flowStore.setLastArrearageTablePage(currentPage.value);
    stopAutoPageChange();
  }
});

// 组件生命周期处理
onMounted(() => {
  if (flowStore.currentScreenState === 'arrearage-table') {
    startAutoPageChange();
  }
});

onUnmounted(() => {
  flowStore.setLastArrearageTablePage(currentPage.value);
  stopAutoPageChange();
});

onActivated(() => {
  if (flowStore.currentScreenState === 'arrearage-table') {
    startAutoPageChange();
  }
});

onDeactivated(() => {
  flowStore.setLastArrearageTablePage(currentPage.value);
  stopAutoPageChange();
});

// 分页逻辑
const currentPage = ref(1);
const totalPages = computed(() => {
  if (!records.value?.length) {
    console.log('⚠️ 没有数据记录')
    return 1
  }
  return Math.ceil(records.value.length / props.itemsPerPage)
});

// 添加一些日志来帮助调试
watch(() => records.value, (newRecords) => {
  console.log('📊 记录数据更新:', {
    总记录数: newRecords?.length || 0,
    当前页: currentPage.value,
    总页数: totalPages.value
  });
}, { immediate: true });
</script>

<style scoped>
.overflow-x-auto {
  scroll-behavior: smooth;
}

.table-transition {
  opacity: 0.5;
  transition: opacity 0.3s ease-in-out;
}

/* 添加淡入效果 */
.overflow-x-auto:not(.table-transition) {
  opacity: 1;
  transition: opacity 0.3s ease-in-out;
}
</style>
