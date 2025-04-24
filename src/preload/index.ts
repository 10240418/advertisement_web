import {
  contextBridge,
  ipcRenderer,
} from 'electron';

import { electronAPI } from '@electron-toolkit/preload';

// Custom APIs for renderer
const api = {
  getDeviceId: () => ipcRenderer.invoke('get-device-id'),
  downloadPDF: (PathName: string, url: string, filename: string) => {
    return ipcRenderer.invoke('download-pdf', { PathName, url, filename })
  },
  downloadVideo: (PathName: string, url: string, filename: string) => {
    return ipcRenderer.invoke('download-video', { PathName, url, filename })
  },
  downloadImage: (PathName: string, url: string, filename: string) => {
    return ipcRenderer.invoke('download-image', { PathName, url, filename })
  },
  deleteFile: (filePath: string) => {
    return ipcRenderer.invoke('delete-file', filePath)
  },
  getWindowSize: () => ipcRenderer.invoke('get-window-size'),
  onWindowResize: (callback) => {
    ipcRenderer.on('window-resize', (_event, size) => {
      callback(size)
    })
  }
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
