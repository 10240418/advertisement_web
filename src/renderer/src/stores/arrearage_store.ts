import { defineStore } from 'pinia';

export interface ArrearageRecord {
  單位: string;
  [key: string]: string | number;
}

interface ArrearageState {
  records: ArrearageRecord[];
  lastUpdated: number | null;
  selectedBuilding: string | null;
  selectedFloor: string | null;
}

export const useArrearageStore = defineStore('arrearage', {
  state: (): ArrearageState => ({
    records: [],
    lastUpdated: null,
    selectedBuilding: null,
    selectedFloor: null
  }),

  getters: {
    // 获取所有楼层
    getBuildings(): string[] {
      const buildings = new Set<string>();
      this.records.forEach(record => {
        const unit = record.單位;
        const building = unit.split('樓')[0].trim();
        buildings.add(building);
      });
      return Array.from(buildings).sort();
    },

    // 获取指定楼层的所有户号
    getFloors: (state) => (building: string): string[] => {
      const floors = new Set<string>();
      state.records.forEach(record => {
        const unit = record.單位;
        if (unit.startsWith(`${building}樓`)) {
          const floor = unit.split('樓')[1].trim();
          floors.add(floor);
        }
      });
      return Array.from(floors).sort();
    },

    // 获取指定单位的欠款记录
    getArrearageByUnit: (state) => (building: string, floor: string): Record<string, string | number> | null => {
      const unit = `${building}樓  ${floor}`;
      const record = state.records.find(r => r.單位 === unit);
      if (!record) return null;
      
      const { 單位, ...arrearageData } = record;
      return arrearageData;
    },

    // 获取当前选中单位的欠款记录
    getCurrentArrearage(state): Record<string, string | number> | null {
      if (!state.selectedBuilding || !state.selectedFloor) return null;
      return this.getArrearageByUnit(state.selectedBuilding, state.selectedFloor);
    },

    // 判断是否有数据
    hasData(state): boolean {
      return state.records.length > 0;
    }
  },

  actions: {
    setArrearage(records: ArrearageRecord[]) {
      this.records = records;
      this.lastUpdated = Date.now();
      
      // 如果有数据但没有选中的楼号，自动选择第一个
      if (this.records.length > 0 && !this.selectedBuilding) {
        const firstBuilding = this.getBuildings[0];
        this.setSelectedBuilding(firstBuilding);
      }
    },

    setSelectedBuilding(building: string) {
      this.selectedBuilding = building;
      // 重置户号选择
      this.selectedFloor = null;
      // 自动选择第一个户号
      const floors = this.getFloors(building);
      if (floors.length > 0) {
        this.selectedFloor = floors[0];
      }
    },

    setSelectedFloor(floor: string) {
      this.selectedFloor = floor;
    },

    clearArrearage() {
      this.records = [];
      this.lastUpdated = null;
      this.selectedBuilding = null;
      this.selectedFloor = null;
    }
  },
  persist: true
});
