/*
 * 下载图片和视频的工具函数
 * 主要功能包括:
 * 1. 下载并存储广告图片
 * 2. 下载并存储广告视频
 * 3. 下载并存储PDF通知文件
 * 4. 定时任务执行函数
 */

import api from "@renderer/apis";
import { useAdsStore } from "@renderer/stores/ads_store";
import { useNoticeStore } from "@renderer/stores/notice_store";
import { useNotificationStore } from "@renderer/stores/noticefication_store";
import { useArrearageStore } from "@renderer/stores/arrearage_store";
import { useFlowStore } from "@renderer/stores/flow_store";

/**
 * 下载单个广告图片
 * @param ad - 广告对象
 * @param PathName - 存储路径名称
 * @returns {Promise<{success: boolean, path?: string, error?: any}>}
 */
export const downloadImage = async (ad, PathName) => {
  console.log(`开始下载图片: ${ad.title}, URL: ${ad.file?.path}`);
  const adsStore = useAdsStore();

  try {
    // 使用file.path作为图片URL
    const imageUrl = ad.file?.path;
    if (!imageUrl) {
      throw new Error("No image URL available");
    }

    // 使用electron API直接下载
    const filename = `${ad.id}.${ad.file.mimeType.split("/").pop()}`;
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
    useNotificationStore().addNotification(
      `下載圖片失敗: ${ad.title}`,
      "error",
    );
    return { success: false, error: error };
  }
};

/**
 * 下载所有未下载的广告
 * 包括图片和视频广告
 */
export const downloadAllAds = async () => {
  const adsStore = useAdsStore();
  const notificationStore = useNotificationStore();

  try {
    console.log("开始检查并下载所有广告...");

    // 检查是否可以访问静态目录
    try {
      // 检查必要的目录结构是否存在，不用window.api.checkPath("static")直接检查子目录
      const imgResult = await window.api.checkPath("img");
      const videoResult = await window.api.checkPath("video");

      console.log("静态资源目录检查结果:", {
        img: imgResult.exists ? "存在" : "已创建",
        video: videoResult.exists ? "存在" : "已创建",
      });
    } catch (error) {
      console.error("静态资源目录检查失败:", error);
      notificationStore.addNotification(
        "广告资源目录访问失败，请重启应用",
        "error",
      );
    }

    // 只处理当前存在于 advertisements 中的广告
    const currentAds = adsStore.getAllAds;
    if (!currentAds || currentAds.length === 0) {
      console.log("没有需要下载的广告");
      return;
    }

    const downloadedAds = adsStore.getDownloadedAds.map(
      (item) => item.advertisement.id,
    );

    // 过滤出未下载的广告
    const adsToDownload = currentAds.filter(
      (ad) => !downloadedAds.includes(ad.id),
    );

    if (adsToDownload.length === 0) {
      console.log("所有广告已下载，无需执行下载任务");
      return;
    }

    console.log(
      `检测到 ${adsToDownload.length} 个广告需要下载:`,
      adsToDownload.map((ad) => `${ad.id}: ${ad.title} (${ad.type})`),
    );

    // 创建下载任务数组
    const downloadTasks = adsToDownload.map(async (ad) => {
      // 确保ad对象存在且有正确的结构
      if (!ad || !ad.id) {
        console.error("Invalid advertisement object:", ad);
        return {
          adId: null,
          status: "error",
          error: "Invalid advertisement data",
        };
      }

      const adId = ad.id;

      try {
        let result: any = null;
        let status = "noskip";

        // 输出详细的广告信息
        console.log(
          `准备下载广告: ID=${adId}, 标题=${ad.title}, 类型=${ad.type}`,
        );

        if (!ad.file || !ad.file.path) {
          console.error(`广告(ID=${adId})没有文件信息或路径`);
          return {
            adId,
            status: "error",
            error: "No file information available",
          };
        }

        // 根据广告类型和状态决定下载方式
        if (ad.type === "image") {
          console.log(`下载图片广告: ${ad.title}`);
          result = await downloadImage(ad, "img");
        } else if (ad.type === "video") {
          console.log(`下载视频广告: ${ad.title}`);
          result = await downloadVideo(ad, "video");
        } else {
          status = "skip";
          console.log(`跳过未知类型广告: ${ad.title} (类型: ${ad.type})`);
        }

        // 处理下载结果
        if (status === "noskip") {
          if (result && result.success) {
            console.log(`广告(ID=${adId})下载成功: ${result.path}`);
            return { adId, status: "success", path: result.path };
          } else {
            console.warn(
              `广告(ID=${adId})下载失败: ${result ? result.error : "未知错误"}`,
            );
            return {
              adId,
              status: "failed",
              error: result ? result.error : "unknown error",
            };
          }
        }

        return { adId, status: "skipped" };
      } catch (error: any) {
        console.error(`广告(ID=${adId})下载失败:`, error);
        return {
          adId,
          status: "error",
          error: error?.message || "unknown error",
        };
      }
    });

    console.log(`开始执行 ${downloadTasks.length} 个广告下载任务...`);

    // 并行执行所有下载任务
    const results = await Promise.allSettled(downloadTasks);

    // 统计下载结果
    let successCount = 0;
    let failedCount = 0;
    let skippedCount = 0;

    // 处理每个任务的结果
    results.forEach((result) => {
      if (result.status === "fulfilled") {
        const { adId, status, error } = result.value;
        if (status === "success") {
          successCount++;
        } else if (status === "failed") {
          failedCount++;
          console.warn(`广告(ID=${adId})下载失败: ${error}`);
        } else if (status === "skipped") {
          skippedCount++;
        }
      } else {
        failedCount++;
        console.error("广告下载任务错误:", result.reason);
      }
    });

    // 显示下载统计结果
    console.log(
      `广告下载完成: 成功 ${successCount}, 失败 ${failedCount}, 跳过 ${skippedCount}`,
    );

    // 如果有下载失败的广告，显示通知
    if (failedCount > 0) {
      notificationStore.addNotification(
        `广告下载完成: 成功 ${successCount}，失败 ${failedCount}`,
        "warning",
      );
    } else if (successCount > 0) {
      notificationStore.addNotification(
        `成功下载 ${successCount} 个广告`,
        "success",
      );
    }
  } catch (error) {
    console.error("广告下载过程中发生错误:", error);
    notificationStore.addNotification("广告下载过程中发生错误", "error");
    throw error;
  }
};

/**
 * 下载单个视频广告
 * @param ad - 广告对象
 * @param PathName - 存储路径名称
 * @returns {Promise<{success: boolean, path?: string, error?: any}>}
 */
export const downloadVideo = async (ad, PathName) => {
  console.log(`开始下载视频: ${ad.title}, URL: ${ad.file?.path}`);
  console.log(`视频广告详情:`, {
    id: ad.id,
    title: ad.title,
    type: ad.type,
    fileInfo: ad.file
      ? {
          path: ad.file.path,
          mimeType: ad.file.mimeType,
          filename: ad.file.filename,
        }
      : "无文件信息",
  });

  const adsStore = useAdsStore();

  try {
    // 使用file.path作为视频URL
    const videoUrl = ad.file?.path;
    if (!videoUrl) {
      throw new Error("No video URL available");
    }

    // 确保广告有正确的MIME类型
    if (!ad.file.mimeType || !ad.file.mimeType.startsWith("video/")) {
      console.warn(`视频广告MIME类型可能不正确: ${ad.file.mimeType}`);
    }

    // 使用electron API直接下载
    const filename = `${ad.id}.${ad.file.mimeType.split("/").pop()}`;
    console.log(`准备下载视频: 文件名=${filename}, URL=${videoUrl}`);

    const result = await window.api.downloadVideo(PathName, videoUrl, filename);

    if (result.success && result.path) {
      console.log(`视频下载成功: ${result.path}`);
      adsStore.addDownloadedAd(ad, result.path);
      return { success: true, path: result.path };
    } else {
      console.error(`download video failed: ${result.error}`);
      return { success: false, error: result.error };
    }
  } catch (error) {
    console.error(`download video ${ad.title} failed:`, error);
    useNotificationStore().addNotification(
      `下載視頻失敗: ${ad.title}`,
      "error",
    );
    return { success: false, error: error };
  }
};

/**
 * 下载单个PDF文件
 * @param notice - 通知对象
 * @param PathName - 存储路径名称 ('common' 或 'adv')
 */
export const downloadAndStorePDF = async (notice, PathName) => {
  console.log(`开始下载PDF: ${notice.title}, URL: ${notice.file.path}`);
  const noticeStore = useNoticeStore();
  const notificationStore = useNotificationStore();

  console.log(`[通知下载] 开始下载通知: ${notice.title}`);
  console.log(`[通知下载] 通知ID: ${notice.id}`);
  console.log(`[通知下载] 通知类型: ${PathName}`);

  try {
    const pdfUrl = notice.file.path;
    const filename = `${notice.id}.pdf`;

    console.log(`[通知下载] PDF URL: ${pdfUrl}`);
    console.log(`[通知下载] 文件名: ${filename}`);

    const result = await window.api.downloadPDF(PathName, pdfUrl, filename);

    if (result.success && result.path) {
      console.log(`[通知下载] 下载成功，保存路径: ${result.path}`);
      noticeStore.addDownloadedNotice(notice, result.path);
      console.log("[通知下载] 已更新通知存储状态");
    } else {
      const errorMessage = `下載PDF "${notice.title}" 失敗: ${result.error}`;
      console.error(`[通知下载] ${errorMessage}`);
      notificationStore.addNotification(errorMessage, "error");
    }
  } catch (error: any) {
    console.error(`[通知下载] 发生错误:`, error);
    // 特别处理403错误
    if (error.response?.status === 403) {
      const errorMessage = `下載PDF "${notice.title}" 失敗: 無訪問權限 (403 Forbidden)`;
      console.error(`[通知下载] ${errorMessage}`);
      notificationStore.addNotification(errorMessage, "error");
    } else {
      const errorMessage = `下載PDF "${notice.title}" 失敗: ${error.message || "未知錯誤"}`;
      console.error(`[通知下载] ${errorMessage}`);
      notificationStore.addNotification(errorMessage, "error");
    }
  }
};

/**
 * 下载所有PDF文件
 */
export const downloadAllPDFs = async () => {
  const noticeStore = useNoticeStore();
  const notificationStore = useNotificationStore();

  console.log("[批量下载] 开始批量下载PDF通知");
  console.log("[批量下载] 通知列表:", noticeStore.notices);
  // 获取所有类型的通知
  const currentNotices = noticeStore.notices.filter(
    (notice) => notice.fileId && notice.file?.path,
  ); // 只处理有文件的通知

  if (currentNotices.length === 0) {
    console.log("[批量下载] 没有需要下载的PDF文件");
    return;
  }

  console.log(`[批量下载] 找到 ${currentNotices.length} 个需要下载的通知`);

  let downloadCount = 0;
  let errorCount = 0;
  let skipCount = 0;

  for (const notice of currentNotices) {
    try {
      // 检查是否已下载
      if (noticeStore.isNoticeDownloaded(notice.id)) {
        console.log(`[批量下载] 跳过已下载通知: ${notice.title}`);
        skipCount++;
        continue;
      }

      console.log(`[批量下载] 正在下载通知: ${notice.title}`);
      await downloadAndStorePDF(notice, notice.type);
      downloadCount++;

      // 添加小延迟避免同时下载太多文件
      await new Promise((resolve) => setTimeout(resolve, 500));
    } catch (error) {
      errorCount++;
      console.error(`[批量下载] 下载失败 - ${notice.title}:`, error);
    }
  }

  // 下载完成后显示统计信息
  const message = `PDF更新完成: 成功${downloadCount}個, 跳過${skipCount}個${errorCount > 0 ? `, 失敗${errorCount}個` : ""}`;
  notificationStore.addNotification(
    message,
    errorCount > 0 ? "warning" : "success",
  );
};

/**
 * 处理欠费数据更新
 */
const handleArrearageUpdate = async () => {
  const arrearageStore = useArrearageStore();
  const buildingId = localStorage.getItem("ismartId"); // 从localStorage获取当前大厦ID

  if (!buildingId) {
    throw new Error("Building ID not found");
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
  const notificationStore = useNotificationStore();
  const flowStore = useFlowStore();

  try {
    console.log("[PDF更新] 开始获取最新通知数据");

    // 保存当前状态
    const currentState = {
      noticeIndex: flowStore.currentNoticeIndex,
      noticePage: flowStore.currentNoticePage,
      screenState: flowStore.currentScreenState,
    };

    // 更新通知数据并清理过期文件
    const noticesResponse = await api.getNotices();
    if (!noticesResponse.data || noticesResponse.data.length === 0) {
      console.log("[PDF更新] 没有获取到新的通知数据");
      return noticesResponse;
    }

    console.log(`[PDF更新] 成功获取 ${noticesResponse.data.length} 条通知`);

    // 智能合并通知数据并清理磁盘上过期文件
    const oldNotices = noticeStore.notices;
    await noticeStore.setNotices(noticesResponse.data);

    // 如果正在轮播，尝试保持当前位置
    if (flowStore.isNoticeRotating) {
      const currentNotice = oldNotices[currentState.noticeIndex];
      if (currentNotice) {
        const newIndex = noticesResponse.data.findIndex(
          (n) => n.id === currentNotice.id,
        );
        if (newIndex !== -1) {
          flowStore.currentNoticeIndex = newIndex;
        }
      }
    }

    // 下载新通知
    console.log("[PDF更新] 开始下载PDF文件");
    await downloadAllPDFs();

    console.log("[PDF更新] PDF更新和下载流程完成");
    return noticesResponse;
  } catch (error) {
    console.error("[PDF更新] 更新过程发生错误:", error);
    notificationStore.addNotification(
      "PDF更新過程發生錯誤，請檢查網絡連接",
      "error",
    );
    throw error;
  }
};

/**
 * 处理广告数据更新和下载
 */
const handleAdsUpdate = async () => {
  const adsStore = useAdsStore();

  // 1. 更新广告数据（setAds 方法现在会自动清理旧的已下载数据，包括磁盘文件）
  const adsResponse = await api.getAdvertisements();
  await adsStore.setAds(adsResponse.data);

  // 2. 下载新的广告资源
  await downloadAllAds();

  return adsResponse;
};

/**
 * 定时任务主函数
 * @param type - 任务类型：'arrearage' | 'pdf' | 'ads'
 */
export const timeTask = async (type: "arrearage" | "pdf" | "ads") => {
  const notificationStore = useNotificationStore();

  try {
    let response;

    // 根据类型执行相应的更新任务
    switch (type) {
      case "arrearage":
        response = await handleArrearageUpdate();
        break;
      case "pdf":
        response = await handlePDFUpdate();
        break;
      case "ads":
        response = await handleAdsUpdate();
        break;
    }
  } catch (error) {
    console.error(`${type}資源更新失敗:`, error);
    notificationStore.addNotification(
      `${type}資源更新失敗，請檢查網絡連接`,
      "error",
    );
    throw error;
  }
};
