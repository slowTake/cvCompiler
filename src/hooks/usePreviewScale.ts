import { useEffect, useState } from 'react'

const STORAGE_KEY = 'cvstudio-preview-scale'
export const PREVIEW_SCALE_MIN = 80
export const PREVIEW_SCALE_MAX = 145
export const PREVIEW_SCALE_DEFAULT = 100

function clampScale(value: number) {
  return Math.min(PREVIEW_SCALE_MAX, Math.max(PREVIEW_SCALE_MIN, Math.round(value)))
}

function readStoredScale() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return PREVIEW_SCALE_DEFAULT
    const parsed = Number(raw)
    if (!Number.isFinite(parsed)) return PREVIEW_SCALE_DEFAULT
    return clampScale(parsed)
  } catch {
    return PREVIEW_SCALE_DEFAULT
  }
}

/** Percent scale for CV preview/print density (100 = default). */
export function usePreviewScale() {
  const [scalePercent, setScalePercentState] = useState(PREVIEW_SCALE_DEFAULT)

  useEffect(() => {
    setScalePercentState(readStoredScale())
  }, [])

  function setScalePercent(next: number) {
    const clamped = clampScale(next)
    setScalePercentState(clamped)
    try {
      localStorage.setItem(STORAGE_KEY, String(clamped))
    } catch {
      // ignore quota / private mode
    }
  }

  function resetScale() {
    setScalePercent(PREVIEW_SCALE_DEFAULT)
  }

  return {
    scalePercent,
    scaleFactor: scalePercent / 100,
    setScalePercent,
    resetScale,
  }
}
