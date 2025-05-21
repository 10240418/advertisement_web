import { ref } from "vue";

// 广告文件类型定义
export type AdFileType = "image" | "video";

// 广告项定义
export interface Advertisement {
  id: number;
  title: string;
  description?: string;
  type: string;
  status: string;
  duration: number;
  priority: number;
  startTime: string;
  endTime: string;
  display: string;
  fileId: number;
  file: {
    id: number;
    size: number;
    md5: string;
    path: string;
    mimeType: string;
  };
  isPublic: boolean;
}

// 已下载广告记录
export interface DownloadedAd {
  id: number;
  localPath: string;
  type: AdFileType;
  fileId: number;
  originalUrl: string;
}

// 状态变量
const downloadQueue = ref<Advertisement[]>([]);
const downloadedAds = ref<DownloadedAd[]>([]);
const isDownloading = ref(false);
const downloadProgress = ref(0);

/**
 * Check if a file exists in the static directory.
 */
async function checkFileExists(relativePath: string): Promise<boolean> {
  try {
    const result = await window.api.checkPath(relativePath);
    console.log(
      `[CheckFileExists] Checking: static/${relativePath} => exists:`,
      result.exists,
    );
    return !!result.exists;
  } catch (e) {
    console.warn(`[CheckFileExists] Error checking static/${relativePath}:`, e);
    return false;
  }
}

/**
 * Determine ad type from mimeType.
 */
function determineAdType(mimeType: string): AdFileType {
  if (mimeType.startsWith("image/")) {
    return "image";
  } else if (mimeType.startsWith("video/")) {
    return "video";
  }
  const typeParts = mimeType.split("/");
  if (
    typeParts.length > 0 &&
    (typeParts[0] === "image" || typeParts[0] === "video")
  ) {
    return typeParts[0] as AdFileType;
  }
  console.warn(
    `[determineAdType] Unknown mimeType: ${mimeType}, fallback to image`,
  );
  return "image";
}

/**
 * Extract filename from url.
 */
function extractFilename(url: string): string {
  const urlParts = url.split("/");
  const filename = urlParts[urlParts.length - 1];
  if (filename.includes("?")) {
    return filename.split("?")[0];
  }
  return filename;
}

/**
 * Download a single ad file. Will check static directory before downloading. Logs every step.
 */
async function downloadAdFile(
  ad: Advertisement,
  forceDownload = false,
): Promise<DownloadedAd | null> {
  try {
    const adType = determineAdType(ad.file.mimeType);
    const filename = `${ad.id}_${extractFilename(ad.file.path)}`;
    const subDir = adType === "image" ? "img" : "video";
    const relativePath = `${subDir}/${filename}`;
    console.log(
      `[DownloadAdFile] Checking if file exists: static/${relativePath}`,
    );
    const exists = await checkFileExists(relativePath);

    if (exists && !forceDownload) {
      console.log(
        `[DownloadAdFile] File already exists, skip download: static/${relativePath}`,
      );
      return {
        id: ad.id,
        localPath: `static/${relativePath}`,
        type: adType,
        fileId: ad.fileId,
        originalUrl: ad.file.path,
      };
    }

    // Start download
    console.log(
      `[DownloadAdFile] Start downloading: ${adType} ${filename} from ${ad.file.path}`,
    );
    let result;
    if (adType === "image") {
      result = await window.api.downloadImage("img", ad.file.path, filename);
    } else {
      result = await window.api.downloadVideo("video", ad.file.path, filename);
    }

    if (!result.success) {
      console.error(
        `[DownloadAdFile] Download failed for ad ${ad.id}:`,
        result.error,
      );
      return null;
    }
    console.log(`[DownloadAdFile] Download success: ${result.path}`);
    return {
      id: ad.id,
      localPath: result.path,
      type: adType,
      fileId: ad.fileId,
      originalUrl: ad.file.path,
    };
  } catch (error) {
    console.error(`[DownloadAdFile] Error downloading ad ${ad.id}:`, error);
    return null;
  }
}

/**
 * Download all ads from API response. Logs the process.
 */
export async function processAndDownloadAds(
  apiResponse: any,
  forceDownload = false,
): Promise<DownloadedAd[]> {
  try {
    console.log(
      `[ProcessAndDownloadAds] Start. forceDownload=${forceDownload}`,
    );
    if (!apiResponse?.data || !Array.isArray(apiResponse.data)) {
      throw new Error("Invalid API response format");
    }
    const ads = apiResponse.data as Advertisement[];
    isDownloading.value = true;
    downloadQueue.value = [...ads];
    downloadProgress.value = 0;
    const results: DownloadedAd[] = [];
    let completed = 0;
    for (const ad of ads) {
      console.log(
        `[ProcessAndDownloadAds] Downloading ad id=${ad.id}, title=${ad.title}`,
      );
      const result = await downloadAdFile(ad, forceDownload);
      if (result) {
        results.push(result);
        downloadedAds.value.push(result);
      }
      completed++;
      downloadProgress.value = Math.round((completed / ads.length) * 100);
      console.log(
        `[ProcessAndDownloadAds] Progress: ${downloadProgress.value}%`,
      );
    }
    saveDownloadedAdsToStorage(downloadedAds.value);
    console.log(
      `[ProcessAndDownloadAds] All downloads finished. Total: ${results.length}`,
    );
    return results;
  } catch (error) {
    console.error("[ProcessAndDownloadAds] Failed:", error);
    return [];
  } finally {
    isDownloading.value = false;
    downloadQueue.value = [];
  }
}

/**
 * Save downloaded ads to localStorage.
 */
function saveDownloadedAdsToStorage(ads: DownloadedAd[]): void {
  try {
    localStorage.setItem("downloadedAds", JSON.stringify(ads));
    console.log(
      `[saveDownloadedAdsToStorage] Saved ${ads.length} records to localStorage`,
    );
  } catch (error) {
    console.error("[saveDownloadedAdsToStorage] Failed:", error);
  }
}

/**
 * Load downloaded ads from localStorage.
 */
export function loadDownloadedAdsFromStorage(): DownloadedAd[] {
  try {
    const stored = localStorage.getItem("downloadedAds");
    if (stored) {
      const parsed = JSON.parse(stored) as DownloadedAd[];
      downloadedAds.value = parsed;
      console.log(
        `[loadDownloadedAdsFromStorage] Loaded ${parsed.length} records from localStorage`,
      );
      return parsed;
    }
  } catch (error) {
    console.error("[loadDownloadedAdsFromStorage] Failed:", error);
  }
  return [];
}

/**
 * Get local path for an ad by id.
 */
export function getAdLocalPath(adId: number): string | null {
  const ad = downloadedAds.value.find((a) => a.id === adId);
  return ad?.localPath || null;
}

/**
 * Check if ad is downloaded (actually check static directory).
 */
export async function isAdDownloaded(adId: number): Promise<boolean> {
  const ad = downloadedAds.value.find((a) => a.id === adId);
  if (!ad) return false;
  const staticIndex = ad.localPath.indexOf("static/");
  const relativePath =
    staticIndex >= 0 ? ad.localPath.slice(staticIndex + 7) : ad.localPath;
  const exists = await checkFileExists(relativePath);
  console.log(`[isAdDownloaded] Ad id=${adId} exists in static:`, exists);
  return exists;
}

/**
 * Get current download state.
 */
export function getDownloadState() {
  return {
    isDownloading: isDownloading.value,
    progress: downloadProgress.value,
    queueLength: downloadQueue.value.length,
    downloadedCount: downloadedAds.value.length,
  };
}

// Load downloaded records on init
loadDownloadedAdsFromStorage();

export default {
  processAndDownloadAds,
  getAdLocalPath,
  isAdDownloaded,
  getDownloadState,
  downloadedAds,
  checkFileExists,
};
