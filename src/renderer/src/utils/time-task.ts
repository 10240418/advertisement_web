/*
 * 下载图片和视频的工具函数
 * 主要功能包括:
 * 1. 下载并存储广告图片
 * 2. 下载并存储广告视频
 * 3. 下载并存储PDF通知文件
 * 4. 定时任务执行函数
 */

import  api  from '@renderer/apis';
import { useAdsStore } from '@renderer/stores/ads_store';
import { useNoticeStore } from '@renderer/stores/notice_store';
import { useNotificationStore } from '@renderer/stores/noticefication_store';
import { useArrearageStore } from '@renderer/stores/arrearage_store';


/**
 * 下载单个广告图片
 * @param ad - 广告对象
 * @param PathName - 存储路径名称
 * @returns {Promise<{success: boolean, path?: string, error?: any}>} 
 */
export const downloadImage = async (ad, PathName) => {
  const adsStore = useAdsStore();
  
  try {
    // 使用file.path作为图片URL
    const imageUrl = ad.file?.path;
    if (!imageUrl) {
      throw new Error('No image URL available');
    }

    // 使用electron API直接下载
    const filename = `${ad.id}.${ad.file.mimeType.split('/').pop()}`;
    const result = await window.api.downloadImage(PathName, imageUrl, filename);

    if (result.success && result.path) {
      adsStore.addDownloadedAd(ad, result.path);
      return { success: true, path: result.path };
    } else {
      console.error(`download image failed: ${result.error}`);
      return { success: false, error: result.error };
    }
  } catch (error) {
    console.error(`download image ${ad.title} failed:`, error);
    useNotificationStore().addNotification(`下載圖片失敗: ${ad.title}`, 'error');
    return { success: false, error: error };
  }
}

/**
 * 下载所有未下载的广告
 * 包括图片和视频广告
 */
export const downloadAllAds = async () => {
  const adsStore = useAdsStore();
  
  // 深拷贝所有广告数据
  const allAds = JSON.parse(JSON.stringify(adsStore.getAllAds));
  // 获取已下载广告的ID列表
  const downloadedAds = adsStore.getDownloadedAds.map(item => item.advertisement.id);

  // 过滤出未下载的广告
  const adsToDownload = allAds.filter(ad => !downloadedAds.includes(ad.id));
  console.log('adsToDownload',adsStore.getDownloadedAds ,adsToDownload)

  // 创建下载任务数组
  const downloadTasks = adsToDownload.map(async (ad) => {
    // 确保ad对象存在且有正确的结构
    if (!ad || !ad.id) {
      console.error('Invalid advertisement object:', ad);
      return { adId: null, status: 'error', error: 'Invalid advertisement data' };
    }

    const adId = ad.id; // 直接使用ad.id而不是ad.advertisement_id

    try {
      let result: any = null;
      let status = 'noskip';

      // 根据广告类型和状态决定下载方式
      if (ad.type === 'image') { // 修改这里，直接使用ad.type
        result = await downloadImage(ad, 'img');
      } else if (ad.type === 'video') {
        result = await downloadVideo(ad, 'video');
      } else {
        status = 'skip';
      }

      // 处理下载结果
      if (status === 'noskip') {
        if (result && result.success) {
          return { adId, status: 'success' };
        } else {
          console.log(`download ad ID=${adId} failed: ${result ? result.error : 'unknown error'}`);
          return { adId, status: 'failed', error: result ? result.error : 'unknown error' };
        }
      }

      return { adId, status: 'skipped' };
    } catch (error: any) {
      console.error(`download ad ID=${adId} failed:`, error);
      return { adId, status: 'error', error: error?.message || 'unknown error' };
    }
  });

  // 并行执行所有下载任务
  const results = await Promise.allSettled(downloadTasks)

  // 处理每个任务的结果
  results.forEach((result) => {
    if (result.status === 'fulfilled') {
      const { adId, status, error } = result.value
      if (status === 'failed') {
        console.warn(`download ad ID=${adId} failed: ${error}`)
      }
    } else {
      console.error('download ad task error:', result.reason)
    }
  })
}

/**
 * 下载单个视频广告
 * @param ad - 广告对象
 * @param PathName - 存储路径名称
 * @returns {Promise<{success: boolean, path?: string, error?: any}>}
 */
export const downloadVideo = async (ad, PathName) => {
  const adsStore = useAdsStore();
  
  try {
    // 使用file.path作为视频URL
    const videoUrl = ad.file?.path;
    if (!videoUrl) {
      throw new Error('No video URL available');
    }

    // 使用electron API直接下载
    const filename = `${ad.id}.${ad.file.mimeType.split('/').pop()}`;
    const result = await window.api.downloadVideo(PathName, videoUrl, filename);

    if (result.success && result.path) {
      adsStore.addDownloadedAd(ad, result.path);
      return { success: true, path: result.path };
    } else {
      console.error(`download video failed: ${result.error}`);
      return { success: false, error: result.error };
    }
  } catch (error) {
    console.error(`download video ${ad.title} failed:`, error);
    useNotificationStore().addNotification(`下載視頻失敗: ${ad.title}`, 'error');
    return { success: false, error: error };
  }
}

/**
 * 下载单个PDF文件
 * @param notice - 通知对象
 * @param PathName - 存储路径名称 ('common' 或 'adv')
 */
export const downloadAndStorePDF = async (notice, PathName) => {
  const noticeStore = useNoticeStore();
  const notificationStore = useNotificationStore();
  
  console.log(`[通知下载] 开始下载通知: ${notice.title}`)
  console.log(`[通知下载] 通知ID: ${notice.id}`)
  console.log(`[通知下载] 通知类型: ${PathName}`)
  
  try {
    const pdfUrl = notice.file.path;
    const filename = `${notice.id}.pdf`;
    
    console.log(`[通知下载] PDF URL: ${pdfUrl}`)
    console.log(`[通知下载] 文件名: ${filename}`)
    
    const result = await window.api.downloadPDF(PathName, pdfUrl, filename);

    if (result.success && result.path) {
      console.log(`[通知下载] 下载成功，保存路径: ${result.path}`)
      noticeStore.addDownloadedNotice(notice, result.path);
      console.log('[通知下载] 已更新通知存储状态')
    } else {
      const errorMessage = `下載PDF "${notice.title}" 失敗: ${result.error}`;
      console.error(`[通知下载] ${errorMessage}`);
      notificationStore.addNotification(errorMessage, 'error');
    }
  } catch (error: any) {
    console.error(`[通知下载] 发生错误:`, error);
    // 特别处理403错误
    if (error.response?.status === 403) {
      const errorMessage = `下載PDF "${notice.title}" 失敗: 無訪問權限 (403 Forbidden)`;
      console.error(`[通知下载] ${errorMessage}`);
      notificationStore.addNotification(errorMessage, 'error');
    } else {
      const errorMessage = `下載PDF "${notice.title}" 失敗: ${error.message || '未知錯誤'}`;
      console.error(`[通知下载] ${errorMessage}`);
      notificationStore.addNotification(errorMessage, 'error');
    }
  }
}

/**
 * 下载所有PDF文件
 */
export const downloadAllPDFs = async () => {
  const noticeStore = useNoticeStore();
  const notificationStore = useNotificationStore();
  
  console.log('[批量下载] 开始批量下载PDF通知')
  
  // 取所有通知
  const allNotices = [
    ...noticeStore.commonNotices,
    ...noticeStore.governmentNotices,
    ...noticeStore.systemNotices,
    ...noticeStore.urgentNotices
  ];

  console.log(`[批量下载] 总通知数量: ${allNotices.length}`)
  let downloadCount = 0;
  let errorCount = 0;
  let skipCount = 0;

  // 下载所有通知的PDF
  for (const notice of allNotices) {
    try {
      // 检查是否已下载
      if (noticeStore.isNoticeDownloaded(notice.id)) {
        console.log(`[批量下载] 跳过已下载通知: ${notice.title}`)
        skipCount++;
        continue;
      }
      
      // 确保notice有file对象且有path
      if (notice.fileId && notice.file && notice.file.path) {
        console.log(`[批量下载] 开始下载通知: ${notice.title}`)
        await downloadAndStorePDF(notice, notice.type);
        downloadCount++;
      } else {
        console.log(`[批量下载] 通知缺少文件信息: ${notice.title}`)
        skipCount++;
      }
    } catch (error: any) {
      errorCount++;
      console.error(`[批量下载] 下載通知 ${notice.title} 的PDF失敗:`, error);
      continue;
    }
  }

  console.log(`[批量下载] 下载完成统计:`)
  console.log(`- 成功下载: ${downloadCount}`)
  console.log(`- 跳过数量: ${skipCount}`)
  console.log(`- 失败数量: ${errorCount}`)

  // 如果有错误，显示汇总通知
  if (errorCount > 0) {
    notificationStore.addNotification(
      `共有 ${errorCount} 個PDF文件下載失敗，請檢查網絡連接或訪問權限`,
      'warning',
      5000
    );
  }
}

/**
 * 处理欠费数据更新
 */
const handleArrearageUpdate = async () => {
  const arrearageStore = useArrearageStore();
  const buildingId = localStorage.getItem('ismartId'); // 从localStorage获取当前大厦ID
  
  if (!buildingId) {
    throw new Error('Building ID not found');
  }

  const response = await api.getArrearage(buildingId);
  arrearageStore.setArrearage(response.data);
  return response;
};

/**
 * 处理PDF数据更新和下载
 */
const handlePDFUpdate = async () => {
  const noticeStore = useNoticeStore();
  
  // 1. 更新通知数据
  const noticesResponse = await api.getNotices();
  noticeStore.setNotices(noticesResponse.data);

  // 2. 下载新的通知文件
  await downloadAllPDFs();
  
  return noticesResponse;
};

/**
 * 处理广告数据更新和下载
 */
const handleAdsUpdate = async () => {
  const adsStore = useAdsStore();
  
  // 1. 更新广告数据
  const adsResponse = await api.getAdvertisements();
  adsStore.setAds(adsResponse.data);
  
  // 2. 下载新的广告资源
  await downloadAllAds();
  
  return adsResponse;
};

/**
 * 定时任务主函数
 * @param type - 任务类型：'arrearage' | 'pdf' | 'ads'
 */
export const timeTask = async (type: 'arrearage' | 'pdf' | 'ads') => {
  const notificationStore = useNotificationStore();

  // 验证登录状态
  const user_name = localStorage.getItem('ismartId');
  const password = localStorage.getItem('password');

  if (!user_name || !password) {
    notificationStore.addNotification('請先登錄', 'error');
    throw new Error('未登录状态');
  }

  try {
    let response;
    
    // 根据类型执行相应的更新任务
    switch (type) {
      case 'arrearage':
        response = await handleArrearageUpdate();
        break;
      case 'pdf':
        response = await handlePDFUpdate();
        break;
      case 'ads':
        response = await handleAdsUpdate();
        break;
    }

    if (response?.data) {
      notificationStore.addNotification(`${type}更新成功`, 'success');
    }
  } catch (error) {
    console.error(`${type}資源更新失敗:`, error);
    notificationStore.addNotification(`${type}資源更新失敗，請檢查網絡連接`, 'error');
    throw error;
  }
};
