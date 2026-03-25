'use client'
import { useState, useEffect, useRef } from 'react'

export default function PolicyIframe({ docId }: { docId: string }) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [height, setHeight] = useState(800)

  useEffect(() => {
    const iframe = iframeRef.current
    if (!iframe) return

    const onLoad = () => {
      try {
        const body = iframe.contentDocument?.body
        if (body) {
          setHeight(body.scrollHeight + 40)
        }
      } catch {}
    }

    // Also listen for ack completion from iframe
    const onMessage = (e: MessageEvent) => {
      if (e.data?.type === 'VITALIS_ACK_COMPLETE') {
        // Reload the parent page to update acknowledgment state
        window.location.reload()
      }
    }

    iframe.addEventListener('load', onLoad)
    window.addEventListener('message', onMessage)
    return () => {
      iframe.removeEventListener('load', onLoad)
      window.removeEventListener('message', onMessage)
    }
  }, [docId])

  return (
    <iframe
      ref={iframeRef}
      src={`/api/pp/html/${docId}`}
      style={{
        width: '100%',
        height: `${height}px`,
        border: 'none',
        display: 'block',
      }}
      title={`Policy ${docId}`}
    />
  )
}
