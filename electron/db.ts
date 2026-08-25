import { DatabaseSync } from 'node:sqlite'
import path from 'node:path'
import fs from 'node:fs'
import { app } from 'electron'

export interface Game {
  id: number
  name: string
  exe_path: string
  folder_path: string
  cover_path: string | null
  size_bytes: number | null
  last_played: string | null
  play_count: number
  playtime_seconds: number
  is_favorite: number
  rating: number
  added_at: string
}

export interface Folder {
  id: number
  path: string
  last_scanned: string | null
}

let db: DatabaseSync

export function initDb(): DatabaseSync {
  const userData = app.getPath('userData')
  if (!fs.existsSync(userData)) fs.mkdirSync(userData, { recursive: true })
  const dbPath = path.join(userData, 'marathon.db')
  db = new DatabaseSync(dbPath)
  db.exec('PRAGMA journal_mode = WAL')

  db.exec(`
    CREATE TABLE IF NOT EXISTS games (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      name        TEXT NOT NULL,
      exe_path    TEXT NOT NULL UNIQUE,
      folder_path TEXT NOT NULL,
      cover_path  TEXT,
      size_bytes  INTEGER,
      last_played TEXT,
      play_count  INTEGER DEFAULT 0,
      is_favorite INTEGER DEFAULT 0,
      added_at    TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS folders (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      path         TEXT NOT NULL UNIQUE,
      last_scanned TEXT
    );

    CREATE TABLE IF NOT EXISTS settings (
      key   TEXT PRIMARY KEY,
      value TEXT
    );
  `)

  migrate(db)

  return db
}

// Ajoute les colonnes introduites après la création initiale des DB existantes.
function migrate(database: DatabaseSync): void {
  const columns = database.prepare('PRAGMA table_info(games)').all() as unknown as Array<{ name: string }>
  const hasRating = columns.some((c) => c.name === 'rating')
  if (!hasRating) {
    database.exec('ALTER TABLE games ADD COLUMN rating INTEGER DEFAULT 0')
  }
  const hasPlaytime = columns.some((c) => c.name === 'playtime_seconds')
  if (!hasPlaytime) {
    database.exec('ALTER TABLE games ADD COLUMN playtime_seconds INTEGER DEFAULT 0')
  }
}

export function getDb(): DatabaseSync {
  if (!db) throw new Error('Database not initialized')
  return db
}

// ---------- games ----------

export function listGames(): Game[] {
  return getDb().prepare('SELECT * FROM games ORDER BY name COLLATE NOCASE ASC').all() as unknown as Game[]
}

export function getGameByExePath(exePath: string): Game | undefined {
  return getDb().prepare('SELECT * FROM games WHERE exe_path = ?').get(exePath) as unknown as Game | undefined
}

export function insertGame(game: {
  name: string
  exe_path: string
  folder_path: string
  cover_path?: string | null
  size_bytes?: number | null
}): number {
  const stmt = getDb().prepare(
    `INSERT INTO games (name, exe_path, folder_path, cover_path, size_bytes) VALUES (?, ?, ?, ?, ?)`
  )
  const info = stmt.run(
    game.name,
    game.exe_path,
    game.folder_path,
    game.cover_path ?? null,
    game.size_bytes ?? null
  )
  return Number(info.lastInsertRowid)
}

export function updateGame(
  id: number,
  data: Partial<Pick<Game, 'name' | 'exe_path' | 'folder_path' | 'cover_path' | 'is_favorite' | 'rating'>>
): void {
  const fields = Object.keys(data) as Array<keyof typeof data>
  if (fields.length === 0) return
  const setClause = fields.map((f) => `${f} = ?`).join(', ')
  const values = fields.map((f) => data[f] as string | number | null)
  getDb()
    .prepare(`UPDATE games SET ${setClause} WHERE id = ?`)
    .run(...values, id)
}

export function removeGame(id: number): void {
  getDb().prepare('DELETE FROM games WHERE id = ?').run(id)
}

export function markGameLaunched(id: number, sessionSeconds: number): void {
  getDb()
    .prepare(
      `UPDATE games
       SET last_played = datetime('now'), play_count = play_count + 1, playtime_seconds = playtime_seconds + ?
       WHERE id = ?`
    )
    .run(Math.max(0, Math.round(sessionSeconds)), id)
}

export function setCoverPath(id: number, coverPath: string): void {
  getDb().prepare('UPDATE games SET cover_path = ? WHERE id = ?').run(coverPath, id)
}

// ---------- folders ----------

export function listFolders(): Folder[] {
  return getDb().prepare('SELECT * FROM folders ORDER BY path ASC').all() as unknown as Folder[]
}

export function addFolder(folderPath: string): void {
  getDb().prepare('INSERT OR IGNORE INTO folders (path) VALUES (?)').run(folderPath)
}

export function removeFolder(folderPath: string): void {
  getDb().prepare('DELETE FROM folders WHERE path = ?').run(folderPath)
}

export function markFolderScanned(folderPath: string): void {
  getDb().prepare(`UPDATE folders SET last_scanned = datetime('now') WHERE path = ?`).run(folderPath)
}

// ---------- settings ----------

export function getSetting(key: string): string | null {
  const row = getDb().prepare('SELECT value FROM settings WHERE key = ?').get(key) as { value: string } | undefined
  return row?.value ?? null
}

export function setSetting(key: string, value: string): void {
  getDb()
    .prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value')
    .run(key, value)
}
