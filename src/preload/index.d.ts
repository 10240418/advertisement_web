import { ElectronAPI } from "@electron-toolkit/preload";

interface DownloadResponse {
  success: boolean;
  path?: string;
  error?: string;
}

interface WindowSize {
  width: number;
  height: number;
}

interface PathCheckResponse {
  exists: boolean;
  created?: boolean;
  path?: string;
  error?: string;
}

interface ClearCacheResponse {
  success: boolean;
  deleted?: {
    ads: number;
    pdfs: number;
  };
  errors?: string[];
  error?: string;
}

interface Api {
  downloadPDF: (
    PathName: string,
    url: string,
    filename: string,
  ) => Promise<DownloadResponse>;
  downloadVideo: (
    PathName: string,
    url: string,
    filename: string,
  ) => Promise<DownloadResponse>;
  downloadImage: (
    PathName: string,
    url: string,
    filename: string,
  ) => Promise<DownloadResponse>;
  deleteFile: (
    filePath: string,
  ) => Promise<{ success: boolean; error?: string }>;
  checkPath: (relativePath: string) => Promise<PathCheckResponse>;
  clearCache: (types?: string[]) => Promise<ClearCacheResponse>;

  getWindowSize: () => Promise<WindowSize>;
  onWindowResize: (callback: (size: WindowSize) => void) => void;
}

declare global {
  interface Window {
    electron: ElectronAPI;
    api: Api;
  }
}
