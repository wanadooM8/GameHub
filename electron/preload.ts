import { contextBridge, ipcRenderer } from 'electron'

const api = {
  // games
  getGames: () => ipcRenderer.invoke('get-games'),
  launchGame: (id: number) => ipcRenderer.invoke('launch-game', id),
  stopTracking: (id: number) => ipcRenderer.invoke('stop-tracking', id),
  removeGame: (id: number) => ipcRenderer.invoke('remove-game', id),
  updateGame: (id: number, data: Record<string, unknown>) => ipcRenderer.invoke('update-game', id, data),
  addGameManual: () => ipcRenderer.invoke('add-game-manual'),
  browseExe: () => ipcRenderer.invoke('browse-exe'),
  refreshCover: (id: number) => ipcRenderer.invoke('refresh-cover', id),
  setCustomCover: (id: number) => ipcRenderer.invoke('set-custom-cover', id),

  // folders
  getFolders: () => ipcRenderer.invoke('get-folders'),
  scanFolders: () => ipcRenderer.invoke('scan-folders'),
  addFolder: () => ipcRenderer.invoke('add-folder'),
  removeFolder: (path: string) => ipcRenderer.invoke('remove-folder', path),

  // settings
  getSetting: (key: string) => ipcRenderer.invoke('get-setting', key),
  setSetting: (key: string, value: string) => ipcRenderer.invoke('set-setting', key, value),

  // misc
  openPath: (target: string) => ipcRenderer.invoke('open-path', target),

  // events main -> renderer
  onScanProgress: (cb: (data: { found: number }) => void) => {
    const listener = (_evt: Electron.IpcRendererEvent, data: { found: number }) => cb(data)
    ipcRenderer.on('scan-progress', listener)
    return () => ipcRenderer.removeListener('scan-progress', listener)
  },
  onScanDone: (cb: (data: { added: number }) => void) => {
    const listener = (_evt: Electron.IpcRendererEvent, data: { added: number }) => cb(data)
    ipcRenderer.on('scan-done', listener)
    return () => ipcRenderer.removeListener('scan-done', listener)
  },
  onGameStopped: (cb: (data: { id: number }) => void) => {
    const listener = (_evt: Electron.IpcRendererEvent, data: { id: number }) => cb(data)
    ipcRenderer.on('game-stopped', listener)
    return () => ipcRenderer.removeListener('game-stopped', listener)
  },
  onRepairDone: (cb: (data: { repaired: number }) => void) => {
    const listener = (_evt: Electron.IpcRendererEvent, data: { repaired: number }) => cb(data)
    ipcRenderer.on('repair-done', listener)
    return () => ipcRenderer.removeListener('repair-done', listener)
  }
}

contextBridge.exposeInMainWorld('api', api)

export type MarathonApi = typeof api
