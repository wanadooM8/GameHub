import { spawn, ChildProcess, execFile } from 'node:child_process'
import path from 'node:path'
import fs from 'node:fs'
import { BrowserWindow, shell } from 'electron'
import { markGameLaunched } from './db'

interface RunningEntry {
  proc: ChildProcess | null
  pid: number | null
  pollTimer: NodeJS.Timeout | null
  startedAt: number
}

const running = new Map<number, RunningEntry>()

export function getRunningIds(): number[] {
  return Array.from(running.keys())
}

export function isRunning(id: number): boolean {
  return running.has(id)
}

// Beaucoup de jeux Steam vérifient au démarrage que le client Steam tourne
// (initialisation Steamworks) et se ferment aussitôt si on lance le .exe brut.
// steam_appid.txt, déposé par Steam à côté de l'exécutable ou à la racine du
// dossier du jeu, indique qu'il faut passer par steam://rungameid/<id> à la place.
function findSteamAppId(exePath: string, folderPath: string): string | null {
  for (const dir of [path.dirname(exePath), folderPath]) {
    const candidate = path.join(dir, 'steam_appid.txt')
    try {
      if (fs.existsSync(candidate)) {
        const content = fs.readFileSync(candidate, 'utf-8').trim()
        if (/^\d+$/.test(content)) return content
      }
    } catch {
      // ignoré
    }
  }
  return null
}

function isImageRunning(imageName: string): Promise<boolean> {
  return new Promise((resolve) => {
    execFile('tasklist', ['/FI', `IMAGENAME eq ${imageName}`, '/FO', 'CSV', '/NH'], (err, stdout) => {
      if (err) return resolve(false)
      resolve(stdout.toLowerCase().includes(imageName.toLowerCase()))
    })
  })
}

function stopEntry(id: number, win: BrowserWindow): void {
  const entry = running.get(id)
  if (entry?.pollTimer) clearInterval(entry.pollTimer)
  running.delete(id)
  const sessionSeconds = entry ? (Date.now() - entry.startedAt) / 1000 : 0
  markGameLaunched(id, sessionSeconds)
  if (!win.isDestroyed()) {
    win.webContents.send('game-stopped', { id })
  }
}

// Le lancement via steam:// ne renvoie aucun PID (Steam lance le process lui-même) —
// on repère le jeu en surveillant périodiquement la liste des process par nom d'exe.
async function launchViaSteam(id: number, appId: string, exePath: string, win: BrowserWindow): Promise<void> {
  const imageName = path.basename(exePath)
  await shell.openExternal(`steam://rungameid/${appId}`)

  running.set(id, { proc: null, pid: null, pollTimer: null, startedAt: Date.now() })

  const maxWaitMs = 60_000
  const start = Date.now()
  const waitForStart = setInterval(() => {
    void (async () => {
      if (!running.has(id)) {
        clearInterval(waitForStart)
        return
      }
      const found = await isImageRunning(imageName)
      if (found) {
        clearInterval(waitForStart)
        // Le jeu vient réellement de démarrer — le chrono de session repart d'ici,
        // pas du moment où on a sollicité Steam (temps de chargement exclu).
        const pollTimer = setInterval(() => {
          void (async () => {
            const stillRunning = await isImageRunning(imageName)
            if (!stillRunning) stopEntry(id, win)
          })()
        }, 5000)
        running.set(id, { proc: null, pid: null, pollTimer, startedAt: Date.now() })
      } else if (Date.now() - start > maxWaitMs) {
        // le jeu n'a jamais démarré (Steam pas installé, refus, etc.)
        clearInterval(waitForStart)
        running.delete(id)
        if (!win.isDestroyed()) win.webContents.send('game-stopped', { id })
      }
    })()
  }, 2000)
}

function launchDirect(id: number, exePath: string, win: BrowserWindow, args: string[]): void {
  const proc = spawn(exePath, args, {
    cwd: path.dirname(exePath),
    detached: true,
    stdio: 'ignore'
  })
  proc.unref()

  running.set(id, { proc, pid: proc.pid ?? null, pollTimer: null, startedAt: Date.now() })

  proc.on('exit', () => stopEntry(id, win))
  proc.on('error', () => stopEntry(id, win))
}

export function launchGame(
  id: number,
  exePath: string,
  folderPath: string,
  win: BrowserWindow,
  args: string[] = []
): void {
  if (running.has(id)) return

  const steamAppId = findSteamAppId(exePath, folderPath)
  if (steamAppId) {
    void launchViaSteam(id, steamAppId, exePath, win)
  } else {
    launchDirect(id, exePath, win, args)
  }
}

export function stopTracking(id: number): void {
  const entry = running.get(id)
  if (entry?.pollTimer) clearInterval(entry.pollTimer)
  running.delete(id)
}
