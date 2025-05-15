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
  // 在开发环境中使用 process.cwd()
  // 在生产环境中使用 app.getAppPath()
  return is.dev ? process.cwd() : path.dirname(app.getAppPath());
};

// 在文件顶部添加这个函数来获取静态资源目录路径
const getStaticPath = () => {
  const appPath = getAppPath();
  const staticPath = path.join(appPath, "static");
  return staticPath;
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
app.whenReady().then(() => {
  // 设置 Windows 应用程序用户模型 ID
  electronApp.setAppUserModelId("com.electron");

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

// 添加删除文件的IPC处理函数
ipcMain.handle("delete-file", async (_event, filePath) => {
  try {
    // 验证文件路径，确保安全
    if (!filePath || typeof filePath !== "string") {
      return { success: false, error: "无效的文件路径" };
    }

    // 检查文件是否存在
    try {
      await fs.promises.access(filePath);
    } catch (error) {
      console.log(`[文件删除] 文件不存在: ${filePath}`);
      return { success: true, message: "文件不存在" };
    }

    // 删除文件
    await fs.promises.unlink(filePath);
    console.log(`[文件删除] 成功删除文件: ${filePath}`);
    return { success: true };
  } catch (error: any) {
    console.error(`[文件删除] 删除失败 "${filePath}":`, error);
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

// 这里可以添加应用程序的其他主进程代码
// 也可以将它们放在单独的文件中并在这里导入
