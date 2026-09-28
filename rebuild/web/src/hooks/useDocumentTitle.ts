import { useEffect } from 'react'

const BASE = 'CyberChic'

export function useDocumentTitle(title?: string) {
  useEffect(() => {
    document.title = title ? `${title} — ${BASE}` : `${BASE} — AI Models`
  }, [title])
}
