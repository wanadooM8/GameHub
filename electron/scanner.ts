import { glob } from 'glob'
import fs from 'node:fs'
import path from 'node:path'
import {
  addFolder as dbAddFolder,
  removeFolder as dbRemoveFolder,
  getGameByExePath,
  insertGame,
  listFolders,
  listGames,
  markFolderScanned,
  updateGame
} from './db'

const EXCLUDE =
  /unins|setup|update|redist|prereq|vcredist|dxsetup|directx|crashhandler|crashpad|crashreport|easyanticheat|battleye|beservice|quicksfv|eosbootstrapper|dotnetfx|dotnet-runtime/i

function cleanName(raw: string): string {
  return raw.replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim()
}

function cleanExeBaseName(exePath: string): string {
  return cleanName(path.basename(exePath, '.exe')).toLowerCase()
}

// « L'exe le plus lourd » se trompe pour beaucoup de jeux Unity : l'exécutable
// principal n'est qu'un petit bootstrapper, parfois plus léger que des utilitaires
// annexes déjà exclus. On préfère donc un exe dont le nom correspond exactement
// au nom du dossier du jeu, et on ne retombe sur le plus lourd qu'en dernier recours.
function pickBestExe(exePaths: string[], folderCleanedName: string): string | null {
  const target = folderCleanedName.toLowerCase()
  const exactMatch = exePaths.find((p) => cleanExeBaseName(p) === target)
  if (exactMatch) return exactMatch
  return pickHeaviest(exePaths)
}

function folderSize(dirPath: string): number {
  let total = 0
  let entries: fs.Dirent[]
  try {
    entries = fs.readdirSync(dirPath, { withFileTypes: true })
  } catch {
    return 0
  }
  for (const entry of entries) {
    const full = path.join(dirPath, entry.name)
    try {
      if (entry.isDirectory()) {
        total += folderSize(full)
      } else if (entry.isFile()) {
        total += fs.statSync(full).size
      }
    } catch {
      // fichier verrouillé ou inaccessible — ignoré
    }
  }
  return total
}

async function findExesUnder(dirPath: string): Promise<string[]> {
  // Certains jeux (ex: Prey -> Binaries/Danielle/x64/Release/Prey.exe) nichent leur
  // exécutable réel à 5 niveaux ou plus — maxDepth: 4 le loupait complètement.
  const matches = await glob('**/*.exe', {
    cwd: dirPath,
    maxDepth: 6,
    nodir: true,
    absolute: true
  })
  return matches.filter((m) => !EXCLUDE.test(path.basename(m)))
}

function pickHeaviest(exePaths: string[]): string | null {
  let best: string | null = null
  let bestSize = -1
  for (const p of exePaths) {
    try {
      const size = fs.statSync(p).size
      if (size > bestSize) {
        bestSize = size
        best = p
      }
    } catch {
      // ignoré
    }
  }
  return best
}

interface ScanCallbacks {
  onProgress?: (found: number) => void
}

async function scanRootFolder(rootPath: string, cb?: ScanCallbacks): Promise<number> {
  let added = 0
  if (!fs.existsSync(rootPath)) return added

  const rootEntries = fs.readdirSync(rootPath, { withFileTypes: true })
  const subDirs = rootEntries.filter((e) => e.isDirectory()).map((e) => path.join(rootPath, e.name))
  const rootLevelExes = rootEntries
    .filter((e) => e.isFile() && e.name.toLowerCase().endsWith('.exe') && !EXCLUDE.test(e.name))
    .map((e) => path.join(rootPath, e.name))

  // Chaque sous-dossier direct = un jeu
  for (const dir of subDirs) {
    const exes = await findExesUnder(dir)
    if (exes.length === 0) continue
    const name = cleanName(path.basename(dir))
    const chosen = pickBestExe(exes, name)
    if (!chosen) continue
    if (getGameByExePath(chosen)) continue

    insertGame({
      name,
      exe_path: chosen,
      folder_path: dir,
      size_bytes: folderSize(dir)
    })
    added++
    cb?.onProgress?.(added)
  }

  // .exe isolés directement à la racine du dossier scanné
  for (const exe of rootLevelExes) {
    if (getGameByExePath(exe)) continue
    const name = cleanName(path.basename(exe, '.exe'))
    insertGame({
      name,
      exe_path: exe,
      folder_path: rootPath,
      size_bytes: fs.statSync(exe).size
    })
    added++
    cb?.onProgress?.(added)
  }

  return added
}

// Corrige les jeux déjà en base dont l'exe pointe vers un utilitaire annexe
// (crash handler, anti-cheat, bootstrapper...) repéré depuis par l'exclusion —
// se reproduit typiquement pour les jeux Unity dont le vrai .exe est plus léger
// que UnityCrashHandler64.exe.
export async function repairBadExePaths(): Promise<number> {
  let fixed = 0
  for (const game of listGames()) {
    if (!EXCLUDE.test(path.basename(game.exe_path))) continue

    const exes = await findExesUnder(game.folder_path)
    if (exes.length === 0) continue

    const chosen = pickBestExe(exes, cleanName(path.basename(game.folder_path)))
    if (!chosen || chosen === game.exe_path) continue
    if (getGameByExePath(chosen)) continue

    updateGame(game.id, { exe_path: chosen })
    fixed++
  }
  return fixed
}

export async function scanAllFolders(cb?: ScanCallbacks): Promise<number> {
  const repaired = await repairBadExePaths()
  if (repaired > 0) cb?.onProgress?.(repaired)

  const folders = listFolders()
  let total = 0
  for (const folder of folders) {
    total += await scanRootFolder(folder.path, cb)
    markFolderScanned(folder.path)
  }
  return total
}

export async function addFolderAndScan(folderPath: string, cb?: ScanCallbacks): Promise<number> {
  dbAddFolder(folderPath)
  const added = await scanRootFolder(folderPath, cb)
  markFolderScanned(folderPath)
  return added
}

export function removeFolderEntry(folderPath: string): void {
  dbRemoveFolder(folderPath)
}
