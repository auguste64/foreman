import { ImageResponse } from 'next/og'

export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        background: '#ea580c',
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '6px',
        color: '#fff',
        fontSize: '20px',
        fontWeight: 'bold',
        fontFamily: 'sans-serif',
      }}
    >
      B
    </div>
  )
}
