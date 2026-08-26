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

// Pour les lancements qui ne renvoient aucun PID exploitable (steam://, ou
// ShellExecute pour un exe nécessitant une élévation UAC) — on repère le jeu en
// surveillant périodiquement la liste des process par nom d'exe.
function trackByImageName(id: number, imageName: string, win: BrowserWindow): void {
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
        // pas du moment où on a sollicité le lancement (temps de chargement exclu).
        const pollTimer = setInterval(() => {
          void (async () => {
            const stillRunning = await isImageRunning(imageName)
            if (!stillRunning) stopEntry(id, win)
          })()
        }, 5000)
        running.set(id, { proc: null, pid: null, pollTimer, startedAt: Date.now() })
      } else if (Date.now() - start > maxWaitMs) {
        // le jeu n'a jamais démarré
        clearInterval(waitForStart)
        running.delete(id)
        if (!win.isDestroyed()) win.webContents.send('game-stopped', { id })
      }
    })()
  }, 2000)
}

async function launchViaSteam(id: number, appId: string, exePath: string, win: BrowserWindow): Promise<void> {
  const imageName = path.basename(exePath)
  await shell.openExternal(`steam://rungameid/${appId}`)
  running.set(id, { proc: null, pid: null, pollTimer: null, startedAt: Date.now() })
  trackByImageName(id, imageName, win)
}

// spawn() appelle CreateProcess directement : Windows refuse de créer le process
// (ERROR_ELEVATION_REQUIRED, remonté par Node en EACCES) si le manifeste de l'exe
// exige une élévation UAC. shell.openPath (ShellExecute) sait déclencher l'invite
// UAC — mais ne renvoie aucun PID, d'où le même suivi par nom d'image que Steam.
async function launchElevated(id: number, exePath: string, win: BrowserWindow): Promise<void> {
  const imageName = path.basename(exePath)
  const err = await shell.openPath(exePath)
  if (err) {
    running.delete(id)
    if (!win.isDestroyed()) win.webContents.send('game-stopped', { id })
    return
  }
  running.set(id, { proc: null, pid: null, pollTimer: null, startedAt: Date.now() })
  trackByImageName(id, imageName, win)
}

function launchDirect(
  id: number,
  exePath: string,
  win: BrowserWindow,
  args: string[],
  steamAppId: string | null
): void {
  const proc = spawn(exePath, args, {
    cwd: path.dirname(exePath),
    detached: true,
    stdio: 'ignore'
  })
  proc.unref()

  const startedAt = Date.now()
  running.set(id, { proc, pid: proc.pid ?? null, pollTimer: null, startedAt })

  const onExit = () => {
    // steam_appid.txt n'implique pas forcément que le jeu a besoin du vrai client
    // Steam : beaucoup de copies crackées embarquent ce fichier avec une DLL Steam
    // API locale (steam_api64.dll patché/.tnk) et tournent très bien en direct. Le
    // seul signal fiable qu'un jeu a réellement besoin de Steam est qu'il se ferme
    // de lui-même presque aussitôt (échec d'init Steamworks) — donc on ne bascule
    // vers steam://rungameid/... qu'en constatant ce rejet, pas en le devinant.
    const exitedQuickly = Date.now() - startedAt < 2500
    if (exitedQuickly && steamAppId && running.get(id)?.proc === proc) {
      running.delete(id)
      void launchViaSteam(id, steamAppId, exePath, win)
      return
    }
    stopEntry(id, win)
  }

  proc.on('exit', onExit)
  proc.on('error', (err: NodeJS.ErrnoException) => {
    if (running.get(id)?.proc !== proc) return
    if (err.code === 'EACCES') {
      running.delete(id)
      void launchElevated(id, exePath, win)
      return
    }
    onExit()
  })
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
  launchDirect(id, exePath, win, args, steamAppId)
}

export function stopTracking(id: number): void {
  const entry = running.get(id)
  if (entry?.pollTimer) clearInterval(entry.pollTimer)
  running.delete(id)
}
