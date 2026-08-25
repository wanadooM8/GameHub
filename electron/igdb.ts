import fs from 'node:fs'
import path from 'node:path'
import { app } from 'electron'
import { setCoverPath } from './db'

interface TokenCache {
  token: string
  expiresAt: number
}

let tokenCache: TokenCache | null = null

function coversDir(): string {
  const dir = path.join(app.getPath('userData'), 'covers')
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  return dir
}

async function getAccessToken(clientId: string, clientSecret: string): Promise<string | null> {
  if (tokenCache && tokenCache.expiresAt > Date.now()) return tokenCache.token

  const url = `https://id.twitch.tv/oauth2/token?client_id=${encodeURIComponent(clientId)}&client_secret=${encodeURIComponent(clientSecret)}&grant_type=client_credentials`
  try {
    const res = await fetch(url, { method: 'POST' })
    if (!res.ok) return null
    const data = (await res.json()) as { access_token: string; expires_in: number }
    tokenCache = { token: data.access_token, expiresAt: Date.now() + (data.expires_in - 60) * 1000 }
    return data.access_token
  } catch {
    return null
  }
}

function escapeIgdbQuery(name: string): string {
  return name.replace(/"/g, '\\"')
}

async function searchCoverUrl(name: string, clientId: string, token: string): Promise<string | null> {
  try {
    const res = await fetch('https://api.igdb.com/v4/games', {
      method: 'POST',
      headers: {
        'Client-ID': clientId,
        Authorization: `Bearer ${token}`,
        'Content-Type': 'text/plain'
      },
      body: `search "${escapeIgdbQuery(name)}"; fields name,cover.url; limit 1;`
    })
    if (!res.ok) return null
    const data = (await res.json()) as Array<{ cover?: { url?: string } }>
    const rawUrl = data[0]?.cover?.url
    if (!rawUrl) return null
    // IGDB renvoie des URLs protocol-relative en basse résolution — on upgrade en cover_big
    const upgraded = rawUrl.replace('t_thumb', 't_cover_big')
    return upgraded.startsWith('//') ? `https:${upgraded}` : upgraded
  } catch {
    return null
  }
}

async function downloadCover(url: string, gameId: number): Promise<string | null> {
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    const buffer = Buffer.from(await res.arrayBuffer())
    const filePath = path.join(coversDir(), `${gameId}.jpg`)
    fs.writeFileSync(filePath, buffer)
    return filePath
  } catch {
    return null
  }
}

// Repli intermédiaire : icône réelle extraite du .exe (API native Windows via Electron),
// centrée sur une tuile claire. Utilisé seulement si IGDB n'a rien retourné.
async function extractExeIcon(exePath: string, gameId: number): Promise<string | null> {
  try {
    const icon = await app.getFileIcon(exePath, { size: 'large' })
    if (icon.isEmpty()) return null
    const { width, height } = icon.getSize()
    if (width === 0 || height === 0) return null
    const base64 = icon.toPNG().toString('base64')

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="300" viewBox="0 0 200 300">
  <rect width="200" height="300" fill="#FAFAFA" />
  <image x="${100 - width / 2}" y="${140 - height / 2}" width="${width}" height="${height}" href="data:image/png;base64,${base64}" />
</svg>`

    const filePath = path.join(coversDir(), `${gameId}-icon.svg`)
    fs.writeFileSync(filePath, svg, 'utf-8')
    return filePath
  } catch {
    return null
  }
}

// Repli final (ni IGDB ni icône .exe exploitable) : tuile grise sobre + icône générique,
// cohérent avec PlaceholderArt.tsx côté renderer.
export function generateFallbackCover(_name: string, gameId: number): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="300" viewBox="0 0 200 300">
  <rect width="200" height="300" fill="#FAFAFA" />
  <rect x="70" y="130" width="60" height="36" rx="12" stroke="#8A8A8A" stroke-width="3" fill="none" />
  <circle cx="86" cy="148" r="3.5" fill="#8A8A8A" />
  <path d="M80 148H92M86 142V154" stroke="#D1D1D1" stroke-width="2.5" stroke-linecap="round" />
  <circle cx="112" cy="144" r="2.5" fill="#8A8A8A" />
  <circle cx="118" cy="150" r="2.5" fill="#8A8A8A" />
</svg>`

  const filePath = path.join(coversDir(), `${gameId}.svg`)
  fs.writeFileSync(filePath, svg, 'utf-8')
  return filePath
}

// Image choisie manuellement par l'utilisateur — ne finit jamais en .svg,
// donc jamais écrasée automatiquement par un futur rescan/fetch IGDB.
export function setCustomCover(gameId: number, sourcePath: string): string {
  const ext = path.extname(sourcePath) || '.png'
  const destPath = path.join(coversDir(), `${gameId}-custom${ext}`)
  fs.copyFileSync(sourcePath, destPath)
  setCoverPath(gameId, destPath)
  return destPath
}

export async function fetchCoverForGame(
  gameId: number,
  name: string,
  exePath: string,
  clientId: string | null,
  clientSecret: string | null
): Promise<string> {
  if (clientId && clientSecret) {
    const token = await getAccessToken(clientId, clientSecret)
    if (token) {
      const url = await searchCoverUrl(name, clientId, token)
      if (url) {
        const downloaded = await downloadCover(url, gameId)
        if (downloaded) {
          setCoverPath(gameId, downloaded)
          return downloaded
        }
      }
    }
  }

  const exeIcon = await extractExeIcon(exePath, gameId)
  if (exeIcon) {
    setCoverPath(gameId, exeIcon)
    return exeIcon
  }

  const fallback = generateFallbackCover(name, gameId)
  setCoverPath(gameId, fallback)
  return fallback
}
