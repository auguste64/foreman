'use client'

import { useEffect, useRef, useState } from 'react'

type Tool = 'rectangle' | 'circle' | 'arrow'

interface Annotation {
  tool: Tool
  color: string
  x1: number
  y1: number
  x2: number
  y2: number
}

export default function PhotoAnnotator({
  imageSrc,
  onSave,
  onClose,
}: {
  imageSrc: string
  onSave: (dataUrl: string) => void
  onClose: () => void
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imageRef = useRef<HTMLImageElement | null>(null)
  const [tool, setTool] = useState<Tool>('rectangle')
  const [color, setColor] = useState('#ef4444')
  const [annotations, setAnnotations] = useState<Annotation[]>([])
  const [drawing, setDrawing] = useState(false)
  const [start, setStart] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.src = imageSrc
    img.onload = () => {
      imageRef.current = img
      redraw([])
    }
  }, [imageSrc])

  function redraw(anns: Annotation[], preview?: Annotation) {
    const canvas = canvasRef.current
    if (!canvas || !imageRef.current) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(imageRef.current, 0, 0, canvas.width, canvas.height)
    ;[...anns, ...(preview ? [preview] : [])].forEach((a) => drawOne(ctx, a))
  }

  function drawOne(ctx: CanvasRenderingContext2D, ann: Annotation) {
    ctx.strokeStyle = ann.color
    ctx.lineWidth = 3
    ctx.beginPath()
    if (ann.tool === 'rectangle') {
      ctx.strokeRect(ann.x1, ann.y1, ann.x2 - ann.x1, ann.y2 - ann.y1)
    } else if (ann.tool === 'circle') {
      const cx = (ann.x1 + ann.x2) / 2
      const cy = (ann.y1 + ann.y2) / 2
      const rx = Math.abs(ann.x2 - ann.x1) / 2
      const ry = Math.abs(ann.y2 - ann.y1) / 2
      ctx.ellipse(cx, cy, rx, ry, 0, 0, 2 * Math.PI)
      ctx.stroke()
    } else if (ann.tool === 'arrow') {
      const dx = ann.x2 - ann.x1
      const dy = ann.y2 - ann.y1
      const angle = Math.atan2(dy, dx)
      const head = 18
      ctx.moveTo(ann.x1, ann.y1)
      ctx.lineTo(ann.x2, ann.y2)
      ctx.lineTo(ann.x2 - head * Math.cos(angle - Math.PI / 6), ann.y2 - head * Math.sin(angle - Math.PI / 6))
      ctx.moveTo(ann.x2, ann.y2)
      ctx.lineTo(ann.x2 - head * Math.cos(angle + Math.PI / 6), ann.y2 - head * Math.sin(angle + Math.PI / 6))
      ctx.stroke()
    }
  }

  function getPos(e: React.MouseEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    return {
      x: (e.clientX - rect.left) * (canvas.width / rect.width),
      y: (e.clientY - rect.top) * (canvas.height / rect.height),
    }
  }

  function onMouseDown(e: React.MouseEvent<HTMLCanvasElement>) {
    const pos = getPos(e)
    setStart(pos)
    setDrawing(true)
  }

  function onMouseMove(e: React.MouseEvent<HTMLCanvasElement>) {
    if (!drawing) return
    const pos = getPos(e)
    redraw(annotations, { tool, color, x1: start.x, y1: start.y, x2: pos.x, y2: pos.y })
  }

  function onMouseUp(e: React.MouseEvent<HTMLCanvasElement>) {
    if (!drawing) return
    const pos = getPos(e)
    const next = [...annotations, { tool, color, x1: start.x, y1: start.y, x2: pos.x, y2: pos.y }]
    setAnnotations(next)
    redraw(next)
    setDrawing(false)
  }

  function handleErase() {
    setAnnotations([])
    redraw([])
  }

  function handleSave() {
    const canvas = canvasRef.current
    if (!canvas) return
    onSave(canvas.toDataURL('image/jpeg', 0.9))
  }

  const TOOLS: { id: Tool; label: string }[] = [
    { id: 'rectangle', label: '⬜ Rectangle' },
    { id: 'circle', label: '◯ Cercle' },
    { id: 'arrow', label: '→ Flèche' },
  ]

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      backgroundColor: 'rgba(0,0,0,0.88)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px',
    }}>
      {/* Toolbar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', justifyContent: 'center',
        backgroundColor: '#1E1E1C', borderRadius: '10px', padding: '10px 16px',
        border: '1px solid #2A2A28',
      }}>
        {TOOLS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTool(t.id)}
            style={{
              padding: '6px 14px', borderRadius: '6px', fontSize: '13px', cursor: 'pointer', border: 'none',
              fontFamily: 'var(--font-dm-sans), sans-serif', fontWeight: 500,
              backgroundColor: tool === t.id ? '#E8C547' : '#2A2A28',
              color: tool === t.id ? '#0D0D0B' : '#F0EDE6',
              transition: 'all 0.15s',
            }}
          >
            {t.label}
          </button>
        ))}
        <div style={{ width: '1px', height: '24px', backgroundColor: '#2A2A28', margin: '0 4px' }} />
        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px', color: '#8A8880', fontFamily: 'var(--font-dm-sans), sans-serif' }}>
          Couleur
          <input
            type="color" value={color} onChange={(e) => setColor(e.target.value)}
            style={{ width: '28px', height: '28px', border: 'none', borderRadius: '4px', cursor: 'pointer', backgroundColor: 'transparent', padding: 0 }}
          />
        </label>
        <div style={{ width: '1px', height: '24px', backgroundColor: '#2A2A28', margin: '0 4px' }} />
        <button
          onClick={handleErase}
          style={{ padding: '6px 14px', borderRadius: '6px', fontSize: '13px', cursor: 'pointer', border: 'none', backgroundColor: '#2A2A28', color: '#F0EDE6', fontFamily: 'var(--font-dm-sans), sans-serif' }}
        >
          Effacer tout
        </button>
        <button
          onClick={handleSave}
          style={{ padding: '6px 16px', borderRadius: '6px', fontSize: '13px', cursor: 'pointer', border: 'none', backgroundColor: '#4ade80', color: '#0D0D0B', fontWeight: 600, fontFamily: 'var(--font-dm-sans), sans-serif' }}
        >
          ✓ Sauvegarder
        </button>
        <button
          onClick={onClose}
          style={{ padding: '6px 14px', borderRadius: '6px', fontSize: '13px', cursor: 'pointer', border: '1px solid #3A3A38', backgroundColor: 'transparent', color: '#8A8880', fontFamily: 'var(--font-dm-sans), sans-serif' }}
        >
          Annuler
        </button>
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        width={960}
        height={640}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        style={{
          maxWidth: '90vw', maxHeight: '68vh', borderRadius: '8px',
          cursor: 'crosshair', border: '1px solid #2A2A28', display: 'block',
        }}
      />
      <p style={{ fontSize: '12px', color: '#7A7870', fontFamily: 'var(--font-dm-sans), sans-serif', margin: 0 }}>
        Cliquez et faites glisser pour annoter
      </p>
    </div>
  )
}
