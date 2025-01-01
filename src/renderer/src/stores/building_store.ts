import { defineStore } from 'pinia';

// 类型定义
interface Building {
  id: number;
  ismartId: string;
  name: string;
  remark: string;
}

interface BuildingState {
  building: Building | null;
  isAuthenticated: boolean;
  error: string | null;
}

export const useBuildingStore = defineStore('building', {
  state: (): BuildingState => ({
    building: null,
    isAuthenticated: false,
    error: null
  }),

  getters: {
    // 获取建筑信息
    getBuilding: (state): Building | null => state.building,
    
    // 获取建筑ID
    getBuildingId: (state): number | null => state.building?.id ?? null,
    
    // 获取建筑名称
    getBuildingName: (state): string => state.building?.name ?? '',
    
    // 获取ismartId
    getIsmartId: (state): string => state.building?.ismartId ?? '',
    
    // 检查是否已认证
    isLoggedIn: (state): boolean => state.isAuthenticated,
    
    // 获取错误信息
    getError: (state): string | null => state.error
  },

  actions: {
    // 设置建筑信息
    setBuilding(building: Building) {
      try {
        this.building = building;
        this.isAuthenticated = true;
        this.error = null;
      } catch (error) {
        this.error = error instanceof Error ? error.message : '设置建筑信息失败';
        console.error('Failed to set building:', error);
      }
    },

    // 清除建筑信息
    clearBuilding() {
      this.building = null;
      this.isAuthenticated = false;
      this.error = null;
    },

    // 更新建筑信息
    updateBuilding(updates: Partial<Building>) {
      try {
        if (!this.building) {
          throw new Error('No building data to update');
        }
        
        this.building = {
          ...this.building,
          ...updates
        };
        this.error = null;
      } catch (error) {
        this.error = error instanceof Error ? error.message : '更新建筑信息失败';
        console.error('Failed to update building:', error);
      }
    },

    // 设置错误信息
    setError(error: string) {
      this.error = error;
    }
  },

  persist: true
});

// 导出类型
export type { Building, BuildingState };
