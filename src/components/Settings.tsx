import { useEffect, useState } from 'react'
import { useStore } from '../store/useStore'

function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path
        d="M2 3.5H11M5 3.5V2H8V3.5M3 3.5L3.6 11H9.4L10 3.5"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default function Settings() {
  const { folders, loadFolders, addFolder, removeFolder, rescanAll, scanning } = useStore()

  const [clientId, setClientId] = useState('')
  const [clientSecret, setClientSecret] = useState('')
  const [scanOnStartup, setScanOnStartup] = useState(false)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    void loadFolders()
    void (async () => {
      const [id, secret, startup] = await Promise.all([
        window.api.getSetting('igdb_client_id'),
        window.api.getSetting('igdb_client_secret'),
        window.api.getSetting('scan_on_startup')
      ])
      setClientId(id ?? '')
      setClientSecret(secret ?? '')
      setScanOnStartup(startup === 'true')
      setLoaded(true)
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const toggleScanOnStartup = async () => {
    const next = !scanOnStartup
    setScanOnStartup(next)
    await window.api.setSetting('scan_on_startup', String(next))
  }

  if (!loaded) return null

  return (
    <div className="min-h-0 flex-1 overflow-y-auto bg-bg p-6">
      <div className="mx-auto flex max-w-[540px] flex-col gap-6">
        <section className="rounded-lg border border-border bg-surface p-4">
          <h3 className="mb-3 text-[13px] font-semibold text-text">Scanned folders</h3>

          <div className="mb-3 flex flex-col gap-1.5">
            {folders.length === 0 && (
              <div className="rounded-md border border-dashed border-border2 px-3 py-3 text-[12px] font-medium text-text3">
                No folders yet
              </div>
            )}
            {folders.map((f) => (
              <div
                key={f.id}
                className="flex items-center justify-between rounded-md border border-border bg-surface2 px-3 py-2"
              >
                <span className="truncate text-[12px] font-medium text-text">{f.path}</span>
                <button
                  onClick={() => void removeFolder(f.path)}
                  aria-label="Retirer le dossier"
                  className="ml-3 shrink-0 text-text3 hover:text-danger"
                >
                  <TrashIcon />
                </button>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => void addFolder()}
              disabled={scanning}
              className="rounded-md border border-border2 px-3 py-1.5 text-[12px] font-medium text-text2 hover:bg-black/[0.03] disabled:opacity-50"
            >
              Add folder
            </button>
            <button
              onClick={() => void rescanAll()}
              disabled={scanning}
              className="rounded-md bg-accent px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-accent-hover disabled:opacity-50"
            >
              {scanning ? 'Scanning…' : 'Rescan all'}
            </button>
          </div>
        </section>

        <section className="rounded-lg border border-border bg-surface p-4">
          <h3 className="mb-1 text-[13px] font-semibold text-text">IGDB API</h3>
          <p className="mb-3 text-[12px] text-text3">
            Utilisé pour récupérer automatiquement les jaquettes des jeux. Clé gratuite via le portail développeur
            Twitch.
          </p>
          <div className="flex flex-col gap-2.5">
            <div>
              <label className="mb-1 block text-[11px] font-medium text-text2">Client ID</label>
              <input
                type="password"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                onBlur={() => void window.api.setSetting('igdb_client_id', clientId)}
                className="w-full rounded-md border border-border2 bg-surface2 px-3 py-2 text-[13px] text-text focus:border-accent focus:ring-1 focus:ring-accent"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-medium text-text2">Client Secret</label>
              <input
                type="password"
                value={clientSecret}
                onChange={(e) => setClientSecret(e.target.value)}
                onBlur={() => void window.api.setSetting('igdb_client_secret', clientSecret)}
                className="w-full rounded-md border border-border2 bg-surface2 px-3 py-2 text-[13px] text-text focus:border-accent focus:ring-1 focus:ring-accent"
              />
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-border bg-surface p-1">
          <button
            onClick={() => void toggleScanOnStartup()}
            className="flex w-full items-center justify-between rounded-md px-3 py-3 hover:bg-black/[0.03]"
          >
            <span className="text-[13px] font-medium text-text">Scan on startup</span>
            <span
              className={`relative h-5 w-9 rounded-full transition-colors ${
                scanOnStartup ? 'bg-accent' : 'bg-border2'
              }`}
            >
              <span
                className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                  scanOnStartup ? 'translate-x-4' : 'translate-x-0.5'
                }`}
              />
            </span>
          </button>
        </section>
      </div>
    </div>
  )
}
