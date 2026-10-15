'use client'

import { CircleHelp, TriangleAlert } from 'lucide-react'
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'

export type ConfirmOptions = {
  title: string
  message?: ReactNode
  confirmLabel: string
  cancelLabel?: string
  // danger = ลบหรือทำแล้วย้อนไม่ได้: ไอคอนเตือน + ปุ่มแดง
  tone?: 'default' | 'danger'
  // ต้องพิมพ์ข้อความนี้ให้ตรงก่อนกดยืนยันได้ (ใช้กับการลบถาวร)
  typeToConfirm?: string
}

type Ask = (options: ConfirmOptions) => Promise<boolean>

const ConfirmContext = createContext<Ask | null>(null)

export const useConfirm = () => {
  const ask = useContext(ConfirmContext)
  if (!ask) throw new Error('useConfirm ต้องอยู่ใต้ ConfirmProvider')
  return ask
}

// กล่องยืนยันของแอปแทน window.confirm/prompt: ใช้ await confirm({...}) ได้ทุกหน้า
export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [request, setRequest] = useState<{ options: ConfirmOptions; resolve: (ok: boolean) => void } | null>(null)

  const ask = useCallback<Ask>((options) => new Promise((resolve) => setRequest({ options, resolve })), [])

  const close = (ok: boolean) => {
    request?.resolve(ok)
    setRequest(null)
  }

  return (
    <ConfirmContext.Provider value={ask}>
      {children}
      {request && <Dialog key={request.options.title} options={request.options} onClose={close} />}
    </ConfirmContext.Provider>
  )
}

function Dialog({ options, onClose }: { options: ConfirmOptions; onClose: (ok: boolean) => void }) {
  const { title, message, confirmLabel, cancelLabel = 'ยกเลิก', tone = 'default', typeToConfirm } = options
  const [typed, setTyped] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const confirmRef = useRef<HTMLButtonElement>(null)
  const danger = tone === 'danger'
  const allowed = !typeToConfirm || typed.trim().toUpperCase() === typeToConfirm.toUpperCase()

  useEffect(() => {
    ;(typeToConfirm ? inputRef.current : confirmRef.current)?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [typeToConfirm, onClose])

  const Icon = danger ? TriangleAlert : CircleHelp
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-night/40 p-4 sm:items-center" onClick={() => onClose(false)}>
      <form
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        className="w-full max-w-md rounded-3xl bg-white p-6 lift"
        onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => {
          e.preventDefault()
          if (allowed) onClose(true)
        }}
      >
        <span className={`grid h-12 w-12 place-items-center rounded-full ${danger ? 'bg-coral-soft text-coral' : 'bg-grape-soft text-grape'}`}>
          <Icon className="h-6 w-6" strokeWidth={2} aria-hidden />
        </span>
        <h2 id="confirm-title" className="mt-4 text-xl font-bold">{title}</h2>
        {message && <div className="mt-2 text-sm leading-relaxed text-night/70">{message}</div>}
        {typeToConfirm && (
          <label className="mt-4 block">
            <span className="text-sm text-night/60">พิมพ์ <b className="font-mono text-night">{typeToConfirm}</b> เพื่อยืนยัน</span>
            <input
              ref={inputRef}
              value={typed}
              onChange={(e) => setTyped(e.target.value.toUpperCase())}
              autoComplete="off"
              spellCheck={false}
              className="mt-1 w-full rounded-2xl bg-cloud px-4 py-3 font-mono text-lg tracking-[0.2em] outline-none focus:ring-4 focus:ring-coral/20"
            />
          </label>
        )}
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button type="button" onClick={() => onClose(false)} className="rounded-2xl bg-cloud px-5 py-3 font-medium text-night/70">
            {cancelLabel}
          </button>
          <button
            ref={confirmRef}
            type="submit"
            disabled={!allowed}
            className={`rounded-2xl px-5 py-3 font-bold text-white ${danger ? 'bg-coral lift-coral' : 'bg-grape lift-grape'}`}
          >
            {confirmLabel}
          </button>
        </div>
      </form>
    </div>
  )
}
