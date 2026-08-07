'use client'
// components/onboarding/SignaturePad.tsx
//
// Draw-your-signature canvas. Finger on a phone, stylus on a tablet, trackpad
// or mouse on a desktop — all three go through Pointer Events, which is the
// one API that covers every input without three separate handler sets.
//
// Notes that are not obvious and cost real debugging time if missed:
//
//  * touchAction: 'none' is REQUIRED. Without it the browser treats the first
//    finger drag as a page scroll and the canvas receives nothing at all on a
//    phone — which is the exact device this feature exists for.
//  * The canvas backing store is sized to devicePixelRatio. Skip that and a
//    signature drawn on a retina phone is a soft, blocky mess in the PDF.
//  * setPointerCapture keeps the stroke alive when a finger slides past the
//    edge of the canvas mid-signature, instead of leaving a severed line.
//  * Resizing rescales the backing store, which clears the drawing. A phone
//    rotation therefore wipes the signature — so the parent is told, rather
//    than the person pressing Sign over an empty canvas.
//
// Inline styles only, per house rules.

import { useCallback, useEffect, useRef, useState } from 'react'

export interface SignaturePadProps {
  disabled?: boolean
  /** Fires with a PNG data URL, or null when the pad is empty or cleared. */
  onChange: (dataUrl: string | null) => void
  height?: number
  penColor?: string
}

export default function SignaturePad({
  disabled = false,
  onChange,
  height = 170,
  penColor = '#1C2A18',
}: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const drawing = useRef(false)
  const last = useRef<{ x: number; y: number } | null>(null)
  // Ref rather than state: the pointer handlers read it on every move, and a
  // stale closure here would silently stop reporting strokes.
  const hasInk = useRef(false)
  const [empty, setEmpty] = useState(true)

  const setupContext = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return null
    const ctx = canvas.getContext('2d')
    if (!ctx) return null
    ctx.lineWidth = 2.4
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.strokeStyle = penColor
    return ctx
  }, [penColor])

  /** Size the backing store to the CSS box times the device pixel ratio. */
  const resize = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const dpr = window.devicePixelRatio || 1
    const w = Math.max(1, Math.round(rect.width * dpr))
    const h = Math.max(1, Math.round(rect.height * dpr))
    if (canvas.width === w && canvas.height === h) return
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    if (ctx) ctx.scale(dpr, dpr)
    setupContext()
    // The backing-store change wiped whatever was drawn. Say so rather than
    // letting someone sign an empty canvas after rotating their phone.
    if (hasInk.current) {
      hasInk.current = false
      setEmpty(true)
      onChange(null)
    }
  }, [onChange, setupContext])

  useEffect(() => {
    resize()
    window.addEventListener('resize', resize)
    window.addEventListener('orientationchange', resize)
    return () => {
      window.removeEventListener('resize', resize)
      window.removeEventListener('orientationchange', resize)
    }
  }, [resize])

  const pointFrom = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  const emit = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    onChange(hasInk.current ? canvas.toDataURL('image/png') : null)
  }

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (disabled) return
    e.preventDefault()
    e.currentTarget.setPointerCapture(e.pointerId)
    drawing.current = true
    last.current = pointFrom(e)
    // A single tap is a dot, and a dot is a legitimate mark — draw it now
    // rather than requiring movement before anything appears.
    const ctx = setupContext()
    if (ctx && last.current) {
      ctx.beginPath()
      ctx.arc(last.current.x, last.current.y, 1.2, 0, Math.PI * 2)
      ctx.fillStyle = penColor
      ctx.fill()
    }
    hasInk.current = true
    setEmpty(false)
  }

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (disabled || !drawing.current) return
    e.preventDefault()
    const ctx = canvasRef.current?.getContext('2d')
    const p = pointFrom(e)
    if (!ctx || !last.current) return
    ctx.beginPath()
    ctx.moveTo(last.current.x, last.current.y)
    ctx.lineTo(p.x, p.y)
    ctx.stroke()
    last.current = p
  }

  const endStroke = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return
    drawing.current = false
    last.current = null
    try { e.currentTarget.releasePointerCapture(e.pointerId) } catch { /* already released */ }
    emit()
  }

  const clear = () => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    const dpr = window.devicePixelRatio || 1
    ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr)
    hasInk.current = false
    setEmpty(true)
    onChange(null)
  }

  return (
    <div>
      <div style={{ position: 'relative' }}>
        <canvas
          ref={canvasRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endStroke}
          onPointerLeave={endStroke}
          onPointerCancel={endStroke}
          style={{
            width: '100%',
            height,
            display: 'block',
            border: `1px solid ${disabled ? '#E2E8F0' : '#9DA89A'}`,
            borderRadius: 8,
            background: disabled ? '#F7F8F6' : '#fff',
            // Without this the browser eats the gesture as a scroll and the
            // canvas never sees a finger.
            touchAction: 'none',
            cursor: disabled ? 'not-allowed' : 'crosshair',
          }}
        />
        {empty && (
          <div style={{
            position: 'absolute', left: 0, right: 0, bottom: 34,
            textAlign: 'center', pointerEvents: 'none',
            fontSize: 13, color: '#B4BDB0',
          }}>
            {disabled ? '' : 'Sign here with your finger, stylus, or mouse'}
          </div>
        )}
        <div style={{
          position: 'absolute', left: 18, right: 18, bottom: 22,
          borderBottom: '1px solid #D8DFD3', pointerEvents: 'none',
        }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 6 }}>
        <button type="button" onClick={clear} disabled={disabled || empty}
          style={{
            padding: '5px 12px', borderRadius: 7, border: '1px solid #D8DFD3',
            background: '#fff', color: disabled || empty ? '#B4BDB0' : '#4A6070',
            fontSize: 12, fontWeight: 700,
            cursor: disabled || empty ? 'default' : 'pointer',
          }}>
          Clear and start again
        </button>
      </div>
    </div>
  )
}
