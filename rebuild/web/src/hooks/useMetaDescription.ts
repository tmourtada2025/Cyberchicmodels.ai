import { useEffect } from 'react'

// Sets <meta name="description"> for the page (creating the tag if index.html has none) and restores
// the previous value, or removes the tag it created, when the page unmounts.
export function useMetaDescription(content: string) {
  useEffect(() => {
    let meta = document.querySelector<HTMLMetaElement>('meta[name="description"]')
    const created = !meta
    if (!meta) {
      meta = document.createElement('meta')
      meta.name = 'description'
      document.head.appendChild(meta)
    }
    const previous = meta.getAttribute('content')
    meta.setAttribute('content', content)
    return () => {
      if (created) meta.remove()
      else if (previous != null) meta.setAttribute('content', previous)
    }
  }, [content])
}
