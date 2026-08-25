interface ConfirmDialogProps {
  title: string
  message: string
  confirmLabel: string
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmDialog({ title, message, confirmLabel, onConfirm, onCancel }: ConfirmDialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/25" onClick={onCancel}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-[320px] rounded-lg border border-border bg-surface p-5 shadow-xl"
      >
        <h3 className="mb-2 text-[15px] font-semibold text-text">{title}</h3>
        <p className="mb-5 text-[13px] leading-relaxed text-text2">{message}</p>
        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="rounded-md border border-border2 px-3.5 py-1.5 text-[12px] font-medium text-text2 hover:bg-black/[0.03]"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="rounded-md bg-danger px-3.5 py-1.5 text-[12px] font-semibold text-white hover:brightness-110"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
