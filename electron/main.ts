import { app, BrowserWindow, ipcMain, dialog, shell, protocol, net, Menu } from 'electron'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import {
  initDb,
  listGames,
  removeGame as dbRemoveGame,
  updateGame as dbUpdateGame,
  getGameByExePath,
  insertGame,
  listFolders,
  getSetting,
  setSetting,
  type Game
} from './db'
import { scanAllFolders, addFolderAndScan, removeFolderEntry, repairBadExePaths } from './scanner'
import { launchGame as doLaunchGame, stopTracking as doStopTracking, isRunning } from './launcher'
import { fetchCoverForGame, setCustomCover } from './igdb'

const isDev = !app.isPackaged

// Dossier de données figé indépendamment du nom d'affichage de l'app (productName) —
// un renommage ne doit jamais faire pointer l'app vers un nouveau dossier userData vide
// et donc "perdre" la bibliothèque, les notes et les favoris déjà scannés.
app.setPath('userData', path.join(app.getPath('appData'), 'Marathon Launcher'))

let win: BrowserWindow | null = null

// Sert les covers locales (userData/covers) au renderer via un schéma dédié,
// car file:// est bloqué depuis une page chargée en http (dev server Vite).
protocol.registerSchemesAsPrivileged([
  { scheme: 'media', privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true, stream: true } }
])

function createWindow(): void {
  // Pas de barre de menu classique (File/Edit/View) — app Windows simple, chrome native minimal.
  Menu.setApplicationMenu(null)

  win = new BrowserWindow({
    width: 1100,
    height: 700,
    minWidth: 800,
    minHeight: 550,
    frame: true,
    resizable: true,
    backgroundColor: '#F3F3F3',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  if (isDev) {
    win.loadURL('http://localhost:5173')
    win.webContents.openDevTools({ mode: 'detach' })
  } else {
    win.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  win.on('closed', () => {
    win = null
  })
}

async function fetchMissingCovers(games: Game[]): Promise<void> {
  const clientId = getSetting('igdb_client_id')
  const clientSecret = getSetting('igdb_client_secret')
  // Un cover_path en .svg est le repli généré localement (pas de jaquette trouvée) —
  // on retente ces jeux à chaque scan, au cas où la clé IGDB vient d'être renseignée
  // ou que le match échoue pour une raison transitoire.
  const missing = games.filter((g) => !g.cover_path || g.cover_path.toLowerCase().endsWith('.svg'))
  for (const g of missing) {
    await fetchCoverForGame(g.id, g.name, g.exe_path, clientId, clientSecret)
  }
}

app.whenReady().then(() => {
  protocol.handle('media', (request) => {
    // request.url est de la forme media:///C:/Users/.../cover.jpg (triple slash,
    // host vide) — on retire le "/" de tête devant la lettre de lecteur Windows.
    let filePath = decodeURIComponent(new URL(request.url).pathname)
    if (/^\/[A-Za-z]:/.test(filePath)) filePath = filePath.slice(1)
    return net.fetch(pathToFileURL(filePath).toString())
  })

  initDb()
  createWindow()

  win?.webContents.once('did-finish-load', () => {
    void repairBadExePaths().then((repaired) => {
      if (repaired > 0) win?.webContents.send('repair-done', { repaired })
    })
  })

  if (getSetting('scan_on_startup') === 'true') {
    win?.webContents.once('did-finish-load', () => {
      void scanAllFolders({
        onProgress: (found) => win?.webContents.send('scan-progress', { found })
      }).then(async (added) => {
        await fetchMissingCovers(listGames())
        win?.webContents.send('scan-done', { added })
      })
    })
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

// ---------- games ----------

ipcMain.handle('get-games', () => listGames())

ipcMain.handle('launch-game', (_evt, id: number) => {
  if (!win) return
  const game = listGames().find((g) => g.id === id)
  if (!game || isRunning(id)) return
  doLaunchGame(id, game.exe_path, game.folder_path, win)
})

ipcMain.handle('stop-tracking', (_evt, id: number) => {
  doStopTracking(id)
})

ipcMain.handle('remove-game', (_evt, id: number) => {
  dbRemoveGame(id)
})

ipcMain.handle(
  'update-game',
  (
    _evt,
    id: number,
    data: Partial<Pick<Game, 'name' | 'exe_path' | 'folder_path' | 'is_favorite' | 'rating'>>
  ): { ok: boolean; error?: string } => {
    if (data.exe_path) {
      const existing = getGameByExePath(data.exe_path)
      if (existing && existing.id !== id) {
        return { ok: false, error: 'Ce jeu est déjà présent dans la bibliothèque.' }
      }
    }
    dbUpdateGame(id, data)
    return { ok: true }
  }
)

ipcMain.handle('browse-exe', async () => {
  if (!win) return null
  const result = await dialog.showOpenDialog(win, {
    title: 'Choisir un exécutable',
    properties: ['openFile'],
    filters: [{ name: 'Exécutable', extensions: ['exe'] }]
  })
  if (result.canceled || result.filePaths.length === 0) return null
  return result.filePaths[0]
})

ipcMain.handle('refresh-cover', async (_evt, id: number) => {
  const game = listGames().find((g) => g.id === id)
  if (!game) return
  const clientId = getSetting('igdb_client_id')
  const clientSecret = getSetting('igdb_client_secret')
  await fetchCoverForGame(game.id, game.name, game.exe_path, clientId, clientSecret)
})

ipcMain.handle('set-custom-cover', async (_evt, id: number) => {
  if (!win) return null
  const result = await dialog.showOpenDialog(win, {
    title: 'Choisir une image',
    properties: ['openFile'],
    filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp'] }]
  })
  if (result.canceled || result.filePaths.length === 0) return null
  return setCustomCover(id, result.filePaths[0])
})

ipcMain.handle('add-game-manual', async () => {
  if (!win) return
  const result = await dialog.showOpenDialog(win, {
    title: 'Ajouter un jeu',
    properties: ['openFile'],
    filters: [{ name: 'Exécutable', extensions: ['exe'] }]
  })
  if (result.canceled || result.filePaths.length === 0) return null

  const exePath = result.filePaths[0]
  if (getGameByExePath(exePath)) return null

  const folderPath = path.dirname(exePath)
  const name = path
    .basename(folderPath)
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  const id = insertGame({ name, exe_path: exePath, folder_path: folderPath })
  const game = listGames().find((g) => g.id === id)
  if (game) fetchMissingCovers([game])
  return id
})

// ---------- folders ----------

ipcMain.handle('get-folders', () => listFolders())

ipcMain.handle('scan-folders', async () => {
  const added = await scanAllFolders({
    onProgress: (found) => win?.webContents.send('scan-progress', { found })
  })
  const games = listGames()
  await fetchMissingCovers(games)
  win?.webContents.send('scan-done', { added })
  return added
})

ipcMain.handle('add-folder', async () => {
  if (!win) return null
  const result = await dialog.showOpenDialog(win, {
    title: 'Ajouter un dossier',
    properties: ['openDirectory']
  })
  if (result.canceled || result.filePaths.length === 0) return null

  const folderPath = result.filePaths[0]
  const added = await addFolderAndScan(folderPath, {
    onProgress: (found) => win?.webContents.send('scan-progress', { found })
  })
  const games = listGames()
  await fetchMissingCovers(games)
  win?.webContents.send('scan-done', { added })
  return added
})

ipcMain.handle('remove-folder', (_evt, folderPath: string) => {
  removeFolderEntry(folderPath)
})

// ---------- settings ----------

ipcMain.handle('get-setting', (_evt, key: string) => getSetting(key))

ipcMain.handle('set-setting', (_evt, key: string, value: string) => setSetting(key, value))

// ---------- misc ----------

ipcMain.handle('open-path', (_evt, target: string) => shell.showItemInFolder(target))
