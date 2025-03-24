import axios from 'axios';

const BASE_URL = 'http://39.108.49.167:10031'

// 类型定义
interface LoginRequest {
  deviceId: string
}

interface ArrearageRecord {
  單位: string;  // 单位名称
  [key: string]: string | number;  // 动态的时间-欠款键值对
}

interface BuildingInfo {
  id: number
  createdAt: string
  updatedAt: string
  deletedAt: null | string
  name: string
  ismartId: string
  remark: string
  devices: null | any[]
  notices: null | any[]
  advertisements: null | any[]
}

interface DeviceSettings {
  arrearageUpdateDuration: number
  noticeUpdateDuration: number
  advertisementUpdateDuration: number
  advertisementPlayDuration: number
  noticePlayDuration: number
  spareDuration: number
  noticeStayDuration: number
}

interface LoginResponse {
  data: {
    id: number
    createdAt: string
    updatedAt: string
    deletedAt: null | string
    deviceId: string
    building: BuildingInfo
    buildingId: number
    settings: DeviceSettings
  }
  message: string
  token: string
}

interface FileInfo {
  id: number
  createdAt: string
  updatedAt: string
  deletedAt: null | string
  size: number
  md5: string
  path: string
  mimeType: string
  oss: 'local' | 'aws' | string
  uploader: string
  uploaderId: number
  uploaderType: string
}

interface Advertisement {
  id: number
  createdAt: string
  updatedAt: string
  deletedAt: null | string
  title: string
  description: string
  type: 'video' | 'image'
  status: string
  duration: number
  startTime: number
  display: 'full' | 'top' | 'topfull'
  fileId: number
  file: FileInfo
  isPublic: boolean
  endTime:string
}

interface Notice {
  id: number
  createdAt: string
  updatedAt: string
  deletedAt: null | string
  title: string
  description: string
  type: 'urgent' | 'building' | 'government' | 'normal'
  isPublic: boolean
  fileId: number | null
  file: FileInfo
  fileType: string
  endTime:string
}

interface ApiResponse<T> {
  data: T;
  message?: string;
  status?: number;
}

// 在已有的接口定义后添加心跳包响应接口
interface HealthCheckResponse {
  status: number;
  message: string;
}

// API 实现
const api = {
  /**
   * 登录接口
   * @param credentials 登录凭证
   */
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    const response = await axios.post<LoginResponse>(
      `${BASE_URL}/api/device/login`,
      credentials
    )
    return response.data
  },

  /**
   * 获取广告列表
   * @param token Bearer token (可选，如果不传则从localStorage获取)
   */
  getAdvertisements: async (token?: string): Promise<ApiResponse<Advertisement[]>> => {
    const authToken = token || getStoredToken();
    if (!authToken) {
      throw new Error('No token available');
    }

    const response = await axios.get<ApiResponse<Advertisement[]>>(
      `${BASE_URL}/api/device/client/advertisements`,
      {
        headers: {
          Authorization: `Bearer ${authToken}`
        }
      }
    )
    
    // 过滤掉已过期的广告
    if (response.data && response.data.data) {
      const currentTime = new Date().getTime();
      response.data.data = response.data.data.filter(ad => {
        const endTime = new Date(ad.endTime).getTime();
        return endTime > currentTime;
      });
    }
    
    return response.data
  },

  /**
   * 获取通知列表
   * @param token Bearer token (可选，如果不传则从localStorage获取)
   */
  getNotices: async (token?: string): Promise<ApiResponse<Notice[]>> => {
    const authToken = token || getStoredToken();
    if (!authToken) {
      throw new Error('No token available');
    }

    const response = await axios.get<ApiResponse<Notice[]>>(
      `${BASE_URL}/api/device/client/notices`,
      {
        headers: {
          Authorization: `Bearer ${authToken}`
        }
      }
    )
    
    // 过滤掉已过期的通知
    if (response.data && response.data.data) {
      const currentTime = new Date().getTime();
      response.data.data = response.data.data.filter(notice => {
        const endTime = new Date(notice.endTime).getTime();
        return endTime > currentTime;
      });
    }
    
    return response.data
  },

  getArrearage: async (buildingId: string): Promise<ApiResponse<ArrearageRecord[]>> => {
    const response = await fetch(
      'https://uqf0jqfm77.execute-api.ap-east-1.amazonaws.com/prod/v1/building_board/building-mf-table',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          blg_id: buildingId,
          ptype: 'mf'
        })
      }
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch arrearage data');
    }
    
    const data = await response.json();
    console.log(data,response.status,response)
    return { data, status: response.status };
  },

  /**
   * 发送心跳包请求
   * @param token Bearer token (可选，如果不传则从localStorage获取)
   */
  sendHealthCheck: async (token?: string): Promise<ApiResponse<HealthCheckResponse>> => {
    const authToken = token || getStoredToken();
    if (!authToken) {
      throw new Error('No token available');
    }

    const response = await axios.post<ApiResponse<HealthCheckResponse>>(
      `${BASE_URL}/api/device/client/health_test`,
      {},  // 空对象作为请求体
      {
        headers: {
          Authorization: `Bearer ${authToken}`
        }
      }
    );
    return response.data;
  }
}

// 创建axios实例
const instance = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 添加请求拦截器
instance.interceptors.request.use(
  (config) => {
    // 如果是访问AWS S3，添加必要的认证头
    if (config.url?.includes('s3.amazonaws.com')) {
      config.headers['Authorization'] = `Bearer ${getStoredToken()}`;
      // 可能还需要添加其他AWS认证相关的头部
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 修改响应拦截器
instance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 403) {
      console.error('访问被拒绝 (403 Forbidden):', {
        url: error.config?.url,
        message: error.message
      });
    }
    return Promise.reject(error);
  }
);

// 在现有代码的合适位置添加
const getStoredToken = (): string | null => {
  return localStorage.getItem('token');
}

// 导出getStoredToken函数以便其他地方使用
export { getStoredToken };

export default api
export type {
  Advertisement,
  ApiResponse,
  FileInfo,
  LoginRequest,
  LoginResponse,
  Notice,
  HealthCheckResponse,
  BuildingInfo,
  DeviceSettings,
};
