import { ipcRenderer } from 'electron';

let cachedDeviceId: string | null = null;

export const getDeviceId = async (): Promise<string> => {
  try {
    // 如果已经有缓存的设备ID，直接返回
    if (cachedDeviceId) {
      return cachedDeviceId;
    }

    // 从本地存储中检查
    const storedDeviceId = localStorage.getItem('permanent_device_id');
    if (storedDeviceId) {
      cachedDeviceId = storedDeviceId;
      return storedDeviceId;
    }

    // 通过预加载脚本暴露的 API 获取设备 ID
    const deviceId = await window.api.getDeviceId();
    
    // 存储到本地存储和缓存中
    localStorage.setItem('permanent_device_id', deviceId);
    cachedDeviceId = deviceId;
    
    return deviceId;
  } catch (error) {
    console.error('获取设备ID失败:', error);
    return 'DEVICE_UNKNOWN';
  }
}; 