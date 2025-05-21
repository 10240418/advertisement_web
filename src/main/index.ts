// 导入必要的依赖
import axios from "axios";
import { app, BrowserWindow, ipcMain, shell } from "electron";
import fs from "fs";
import path, { join } from "path";
import { pipeline } from "stream/promises";
import { machineIdSync } from "node-machine-id";
import * as crypto from "crypto";

import { electronApp, is, optimizer } from "@electron-toolkit/utils";

import icon from "../../resources/icon.png?asset";

// 在文件顶部添加这个函数来获取应用程序目录路径
const getAppPath = () => {
  // 强制返回 advertisement_web 目录，确保静态资源路径一致
  return "D:/schooll/advertisement_web";
};

// 在文件顶部添加这个函数来获取静态资源目录路径
const getStaticPath = () => {
  const appPath = getAppPath();
  const staticPath = path.join(appPath, "static");
  return staticPath;
};

// 确保所有必要的目录都存在
const ensureDirectories = async () => {
  try {
    const staticPath = getStaticPath();

    // 创建主static目录
    await fs.promises.mkdir(staticPath, { recursive: true });
    console.log(`[目录初始化] 已创建 static 目录: ${staticPath}`);

    // 创建广告资源子目录
    const imgDir = path.join(staticPath, "img");
    const videoDir = path.join(staticPath, "video");
    const noticeDir = path.join(staticPath, "notice");

    await fs.promises.mkdir(imgDir, { recursive: true });
    console.log(`[目录初始化] 已创建 img 目录: ${imgDir}`);

    await fs.promises.mkdir(videoDir, { recursive: true });
    console.log(`[目录初始化] 已创建 video 目录: ${videoDir}`);

    await fs.promises.mkdir(noticeDir, { recursive: true });
    console.log(`[目录初始化] 已创建 notice 目录: ${noticeDir}`);

    // 创建通知类型子目录
    const commonNoticeDir = path.join(noticeDir, "common");
    const advNoticeDir = path.join(noticeDir, "adv");
    const normalNoticeDir = path.join(noticeDir, "normal");

    await fs.promises.mkdir(commonNoticeDir, { recursive: true });
    await fs.promises.mkdir(advNoticeDir, { recursive: true });
    await fs.promises.mkdir(normalNoticeDir, { recursive: true });

    console.log("[目录初始化] 所有静态资源目录已创建完成");

    // 尝试从旧目录迁移文件
    await migrateFromOldPath();
  } catch (error) {
    console.error("[目录初始化] 创建目录失败:", error);
  }
};

// 尝试从旧目录迁移文件的函数
const migrateFromOldPath = async () => {
  try {
    // 常见的旧目录路径
    const possibleOldPaths = [
      "D:\\schooll\\iboard_electron_building\\static",
      "D:/schooll/iboard_electron_building/static",
    ];

    let oldPath: string | null = null;

    // 检查哪个旧路径存在
    for (const testPath of possibleOldPaths) {
      try {
        await fs.promises.access(testPath);
        oldPath = testPath;
        console.log(`[迁移] 找到旧目录: ${oldPath}`);
        break;
      } catch (e) {
        // 旧路径不存在，继续尝试下一个
      }
    }

    if (!oldPath) {
      console.log("[迁移] 没有找到旧目录，无需迁移");
      return;
    }

    const newPath = getStaticPath();

    // 迁移函数 - 递归复制目录结构
    const migratePath = async (oldSubPath: string, newSubPath: string) => {
      try {
        // 确保目标目录存在
        await fs.promises.mkdir(newSubPath, { recursive: true });

        // 获取源目录内容
        const entries = await fs.promises.readdir(oldSubPath, {
          withFileTypes: true,
        });

        let filesCount = 0;
        let dirsCount = 0;

        // 遍历所有条目
        for (const entry of entries) {
          const srcPath = path.join(oldSubPath, entry.name);
          const destPath = path.join(newSubPath, entry.name);

          if (entry.isDirectory()) {
            // 如果是目录，递归处理
            const result = await migratePath(srcPath, destPath);
            filesCount += result.files;
            dirsCount += result.dirs;
          } else {
            // 如果是文件，检查目标文件是否存在
            try {
              await fs.promises.access(destPath);
              // 文件已存在，跳过
            } catch {
              // 文件不存在，复制
              await fs.promises.copyFile(srcPath, destPath);
              filesCount++;
            }
          }
        }

        return { files: filesCount, dirs: dirsCount };
      } catch (error) {
        console.error(
          `[迁移] 迁移目录失败 ${oldSubPath} -> ${newSubPath}:`,
          error,
        );
        return { files: 0, dirs: 0 };
      }
    };

    // 开始迁移
    console.log(`[迁移] 开始从 ${oldPath} 迁移文件到 ${newPath}`);
    const result = await migratePath(oldPath, newPath);
    console.log(
      `[迁移] 迁移完成: 复制了 ${result.files} 个文件，${result.dirs} 个目录`,
    );

    // 添加一个IPC处理程序，让渲染进程可以重新加载文件
    ipcMain.handle("reload-resources", async () => {
      return { success: true, migrated: result.files > 0 };
    });
  } catch (error) {
    console.error("[迁移] 迁移过程出错:", error);
  }
};

// 创建主窗口的函数
function createWindow(): void {
  // 创建浏览器窗口实例
  const mainWindow = new BrowserWindow({
    width: 1024,
    height: 768, // 修改为更合理的默认窗口高度
    show: false,
    // frame: false,   // 移除窗口边框和标题栏
    resizable: true, // 允许调整窗口大小
    autoHideMenuBar: true,
    ...(process.platform === "linux" ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, "../preload/index.js"),
      sandbox: false,
      webSecurity: false,
    },
  });

  // 当窗口准备好时显示
  mainWindow.on("ready-to-show", () => {
    mainWindow.show();
    // 移除全屏设置
    // mainWindow.setFullScreen(true)
  });

  // 处理新窗口打开请求，在默认浏览器中打开链接
  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: "deny" };
  });

  // 根据环境加载不同的内容
  // 开发环境：加载开发服务器 URL
  // 生产环境：加载本地 HTML 文件
  if (is.dev && process.env["ELECTRON_RENDERER_URL"]) {
    mainWindow.loadURL(process.env["ELECTRON_RENDERER_URL"]);
  } else {
    mainWindow.loadFile(join(__dirname, "../renderer/index.html"));
  }

  // 监听窗口大小变化事件
  mainWindow.on("resize", () => {
    const [width, height] = mainWindow.getSize();
    mainWindow.webContents.send("window-resize", { width, height });
  });

  // 处理获取窗口尺寸的 IPC 请求
  ipcMain.handle("get-window-size", () => {
    const [width, height] = mainWindow.getSize();
    return { width, height };
  });
}

// 当 Electron 完成初始化时执行
app.whenReady().then(async () => {
  // 设置 Windows 应用程序用户模型 ID
  electronApp.setAppUserModelId("com.electron");

  // 确保所有必要的目录都存在
  await ensureDirectories();

  // 监听窗口创建事件，设置快捷键
  app.on("browser-window-created", (_, window) => {
    optimizer.watchWindowShortcuts(window);
  });

  // IPC 测试
  ipcMain.on("ping", () => console.log("pong"));

  // 创建主窗口
  createWindow();

  // macOS 特定：点击 dock 图标时重新创建窗口
  app.on("activate", function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// 处理窗口关闭事件
// 在 macOS 上，除非用户使用 Cmd + Q 退出，
// 否则应用程序和菜单栏会保持活动状态
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

// 处理 PDF 下载请求
ipcMain.handle("download-pdf", async (_event, { PathName, url, filename }) => {
  console.log(`[PDF下载] 开始下载PDF: ${filename}`);
  console.log(`[PDF下载] 下载URL: ${url}`);
  console.log(`[PDF下载] 保存类型: ${PathName}`);

  try {
    console.log("[PDF下载] 发起下载请求...");
    const response = await axios.get(url, {
      responseType: "arraybuffer",
      headers: {
        Accept: "application/pdf",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    });
    console.log("[PDF下载] 下载请求成功");

    // 修改保存路径到static/notice文件夹
    const staticPath = getStaticPath();
    const saveDir = path.join(staticPath, "notice", PathName);
    console.log(`[PDF下载] 保存目录: ${saveDir}`);

    // 确保保存目录存在
    await fs.promises.mkdir(saveDir, { recursive: true });
    console.log("[PDF下载] 目录创建成功");

    // 净化文件名并构建完整的文件路径
    const sanitizedFilename = sanitizeFilename(filename);
    const filePath = path.join(saveDir, sanitizedFilename);
    console.log(`[PDF下载] 完整保存路径: ${filePath}`);

    // 检查文件是否已存在
    try {
      await fs.promises.access(filePath);
      console.log(`[PDF下载] 文件已存在: ${filePath}`);
      return { success: true, path: filePath };
    } catch {
      // 文件不存在，保存文件
      console.log("[PDF下载] 开始写入文件...");
      await fs.promises.writeFile(filePath, response.data);
      console.log("[PDF下载] 文件写入成功");
      return { success: true, path: filePath };
    }
  } catch (error: any) {
    console.error(`[PDF下载] 下载失败 "${filename}":`, error);
    return { success: false, error: error.message };
  }
});

// 处理视频下载请求
ipcMain.handle(
  "download-video",
  async (_event, { PathName, url, filename }) => {
    try {
      const response = await axios.get(url, { responseType: "arraybuffer" });
      const contentType = response.headers["content-type"];

      const allowedVideoTypes = [
        "video/mp4",
        "video/webm",
        "video/avi",
        "video/mkv",
      ];
      if (!allowedVideoTypes.includes(contentType)) {
        return { success: false, error: `不支持的视频类型: ${contentType}` };
      }

      const extension = contentType.split("/").pop();
      const validatedFilename = `${path.parse(filename).name}.${extension}`;

      // 修改保存路径，使用传入的 PathName
      const staticPath = getStaticPath();
      const saveDir = path.join(staticPath, PathName);

      await fs.promises.mkdir(saveDir, { recursive: true });
      const filePath = path.join(saveDir, validatedFilename);

      try {
        await fs.promises.access(filePath);
        console.log(`[视频下载] 文件已存在: ${filePath}`);
        return { success: true, path: filePath };
      } catch {
        await fs.promises.writeFile(filePath, response.data);
        console.log(`[视频下载] 文件保存成功: ${filePath}`);
        return { success: true, path: filePath };
      }
    } catch (error: any) {
      console.error(`[视频下载] 下载失败 "${filename}":`, error);
      return { success: false, error: error.message };
    }
  },
);

// 文件名净化函数：移除不安全的字符
const sanitizeFilename = (filename: string): string => {
  return filename.replace(/[^a-zA-Z0-9_\-.]/g, "_");
};

// 添加 check-path IPC 处理程序
ipcMain.handle("check-path", async (_event, relativePath) => {
  try {
    // 获取完整路径
    const fullPath = path.join(getStaticPath(), relativePath);
    console.log(`[路径检查] 检查路径: ${fullPath}`);

    // 检查路径是否存在
    await fs.promises.access(fullPath);
    console.log(`[路径检查] 路径存在: ${fullPath}`);
    return { exists: true, path: fullPath };
  } catch (error) {
    console.error(`[路径检查] 路径不存在 "${relativePath}":`, error);

    // 尝试创建路径
    try {
      const fullPath = path.join(getStaticPath(), relativePath);
      await fs.promises.mkdir(fullPath, { recursive: true });
      console.log(`[路径检查] 已创建路径: ${fullPath}`);
      return { exists: false, created: true, path: fullPath };
    } catch (createError: any) {
      console.error(`[路径检查] 无法创建路径 "${relativePath}":`, createError);
      return { exists: false, created: false, error: createError.message };
    }
  }
});

// 添加 delete-file IPC 处理程序
ipcMain.handle("delete-file", async (_event, filePath) => {
  try {
    console.log(`[文件删除] 尝试删除文件: ${filePath}`);
    await fs.promises.access(filePath);
    await fs.promises.unlink(filePath);
    console.log(`[文件删除] 文件删除成功: ${filePath}`);
    return { success: true };
  } catch (error: any) {
    console.error(`[文件删除] 删除文件失败 "${filePath}":`, error);
    return { success: false, error: error.message };
  }
});

// 处理图片下载请求
ipcMain.handle(
  "download-image",
  async (_event, { PathName, url, filename }) => {
    try {
      const response = await axios.get(url, { responseType: "stream" });
      let contentType = response.headers["content-type"];

      // 修改保存路径，使用传入的 PathName
      const staticPath = getStaticPath();
      const saveDir = path.join(staticPath, PathName);

      // 处理内容类型
      if (contentType.includes(";")) {
        contentType = contentType.split(";")[0].trim();
      }

      // 检查图片类型是否支持
      const allowedImageTypes = [
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/bmp",
        "image/webp",
        "image/jpg",
        "image/svg+xml",
      ];

      if (!allowedImageTypes.includes(contentType)) {
        console.error(`不支持的图片类型: ${contentType}`);
        return { success: false, error: `不支持的图片类型: ${contentType}` };
      }

      // 处理文件扩展名和路径
      const extension = contentType.split("/").pop();
      const sanitizedFilename = sanitizeFilename(filename);
      const validatedFilename = `${path.parse(sanitizedFilename).name}.${extension}`;

      // 确保保存目录存在
      await fs.promises.mkdir(saveDir, { recursive: true });
      console.log(`[download-image] 确保目录存在: ${saveDir}`);

      const filePath = path.join(saveDir, validatedFilename);

      // 检查文件是否已存在
      try {
        await fs.promises.access(filePath);
        console.warn(`[download-image] 文件已存在: ${filePath}`);
        return { success: true, path: filePath };
      } catch {
        // 文件不存在，使用流式下载保存文件
        await pipeline(response.data, fs.createWriteStream(filePath));
        console.log(`图片 ${validatedFilename} 下载成功，路径: ${filePath}`);
        return { success: true, path: filePath };
      }
    } catch (error: any) {
      console.error(`下载图片 "${filename}" 失败:`, error);
      return { success: false, error: error.message || "未知错误" };
    }
  },
);

// 添加 IPC 处理器来获取设备 ID
ipcMain.handle("get-device-id", () => {
  try {
    // 获取机器 ID
    const machineId = machineIdSync();

    // 使用 app.getPath('userData') 获取应用程序数据目录
    const appPath = app.getPath("userData");

    // 组合信息并创建哈希
    const dataToHash = `${machineId}-${appPath}`;
    const hash = crypto.createHash("md5").update(dataToHash).digest("hex");

    // 取前8位并加上前缀
    return `DEVICE_${hash.substring(0, 8).toUpperCase()}`;
  } catch (error) {
    console.error("获取机器ID失败:", error);
    return "DEVICE_UNKNOWN";
  }
});

// 添加清理静态目录下载缓存的功能
ipcMain.handle("clear-downloads-cache", async (_event, types) => {
  try {
    const staticPath = getStaticPath();
    const results = {
      success: true,
      deleted: {
        ads: 0,
        pdfs: 0,
      },
      errors: [] as string[],
    };

    // 清理广告文件（图片和视频）
    if (!types || types.includes("ads")) {
      try {
        // 清理图片目录
        const imgDir = path.join(staticPath, "img");
        await clearDirectory(imgDir);

        // 清理视频目录
        const videoDir = path.join(staticPath, "video");
        await clearDirectory(videoDir);

        console.log("[缓存清理] 已清理广告文件缓存");
        results.deleted.ads = 1; // 简单计数，表示已清理
      } catch (error: any) {
        console.error("[缓存清理] 清理广告缓存失败:", error);
        results.errors.push(`清理广告缓存失败: ${error.message}`);
      }
    }

    // 清理PDF文件
    if (!types || types.includes("pdfs")) {
      try {
        // 清理所有通知子目录
        const noticeDir = path.join(staticPath, "notice");
        const subDirs = ["common", "adv", "normal"];

        for (const subDir of subDirs) {
          const fullPath = path.join(noticeDir, subDir);
          await clearDirectory(fullPath);
        }

        console.log("[缓存清理] 已清理PDF文件缓存");
        results.deleted.pdfs = 1; // 简单计数，表示已清理
      } catch (error: any) {
        console.error("[缓存清理] 清理PDF缓存失败:", error);
        results.errors.push(`清理PDF缓存失败: ${error.message}`);
      }
    }

    return results;
  } catch (error: any) {
    console.error("[缓存清理] 过程中发生错误:", error);
    return {
      success: false,
      error: error.message || "未知错误",
    };
  }
});

// 清空目录但保留目录本身
const clearDirectory = async (dirPath: string) => {
  try {
    // 确保目录存在
    try {
      await fs.promises.access(dirPath);
    } catch {
      // 目录不存在，创建它
      await fs.promises.mkdir(dirPath, { recursive: true });
      return; // 新创建的目录已经是空的，无需继续
    }

    // 读取目录内容
    const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });

    // 删除所有文件和子目录
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);

      if (entry.isDirectory()) {
        // 递归删除子目录内容
        await clearDirectory(fullPath);
        // 删除空目录
        await fs.promises.rmdir(fullPath);
      } else {
        // 删除文件
        await fs.promises.unlink(fullPath);
      }
    }

    console.log(`[缓存清理] 已清理目录: ${dirPath}`);
  } catch (error) {
    console.error(`[缓存清理] 清理目录失败 ${dirPath}:`, error);
    throw error;
  }
};

// 这里可以添加应用程序的其他主进程代码
// 也可以将它们放在单独的文件中并在这里导入
