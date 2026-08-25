import { useState } from 'react'
import { useStore } from '../store/useStore'
import type { Game } from '../types'

interface EditGameDialogProps {
  game: Game
  onClose: () => void
}

function dirnameOf(filePath: string): string {
  const idx = Math.max(filePath.lastIndexOf('\\'), filePath.lastIndexOf('/'))
  return idx === -1 ? filePath : filePath.slice(0, idx)
}

export default function EditGameDialog({ game, onClose }: EditGameDialogProps) {
  const updateGame = useStore((s) => s.updateGame)

  const [name, setName] = useState(game.name)
  const [exePath, setExePath] = useState(game.exe_path)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const browse = async () => {
    const picked = await window.api.browseExe()
    if (picked) setExePath(picked)
  }

  const save = async () => {
    const trimmedName = name.trim()
    if (!trimmedName) {
      setError('Le nom ne peut pas être vide.')
      return
    }
    if (!exePath.trim()) {
      setError("Le chemin de l'exécutable ne peut pas être vide.")
      return
    }

    setSaving(true)
    setError(null)
    const result = await updateGame(game.id, {
      name: trimmedName,
      exe_path: exePath,
      folder_path: dirnameOf(exePath)
    })
    setSaving(false)

    if (!result.ok) {
      setError(result.error ?? 'Erreur inconnue')
      return
    }
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/25" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-[400px] rounded-lg border border-border bg-surface p-5 shadow-xl"
      >
        <h3 className="mb-4 text-[15px] font-semibold text-text">Edit game</h3>

        <label className="mb-1 block text-[11px] font-medium text-text2">Name</label>
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mb-3 w-full rounded-md border border-border2 bg-surface2 px-3 py-2 text-[13px] text-text focus:border-accent focus:ring-1 focus:ring-accent"
        />

        <label className="mb-1 block text-[11px] font-medium text-text2">Executable path</label>
        <div className="mb-1 flex gap-2">
          <input
            value={exePath}
            readOnly
            title={exePath}
            className="min-w-0 flex-1 truncate rounded-md border border-border2 bg-surface2 px-3 py-2 text-[12px] text-text2"
          />
          <button
            onClick={() => void browse()}
            className="shrink-0 rounded-md border border-border2 px-3 py-2 text-[12px] font-medium text-text2 hover:bg-black/[0.03]"
          >
            Browse…
          </button>
        </div>

        {error && <p className="mt-2 text-[12px] font-medium text-danger">{error}</p>}

        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-md border border-border2 px-3.5 py-1.5 text-[12px] font-medium text-text2 hover:bg-black/[0.03]"
          >
            Cancel
          </button>
          <button
            onClick={() => void save()}
            disabled={saving}
            className="rounded-md bg-accent px-3.5 py-1.5 text-[12px] font-semibold text-white hover:bg-accent-hover disabled:opacity-60"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}
