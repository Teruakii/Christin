'use client'

import { useCallback, useEffect, useState } from 'react'

// โหลดข้อมูลตอนเปิดหน้า และโหลดซ้ำทุก pollMs ถ้าระบุ (คิวช่วยเหลือต้องเห็นของใหม่โดยไม่ต้องรีเฟรช)
export const useLoad = <T>(load: () => Promise<T>, pollMs?: number) => {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<unknown>(null)
  const [loading, setLoading] = useState(true)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    let alive = true
    const run = () =>
      load().then(
        (d) => {
          if (!alive) return
          setData(d)
          setError(null)
          setLoading(false)
        },
        (e) => {
          if (!alive) return
          setError(e)
          setLoading(false)
        },
      )
    void run()
    const t = pollMs ? setInterval(run, pollMs) : undefined
    return () => {
      alive = false
      clearInterval(t)
    }
  }, [load, pollMs, tick])

  const reload = useCallback(() => setTick((n) => n + 1), [])

  return { data, error, loading, reload, setData }
}
