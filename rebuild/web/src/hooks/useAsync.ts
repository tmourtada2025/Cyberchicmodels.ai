import { useEffect, useState } from 'react'

export type AsyncState<T> = { status: 'loading' } | { status: 'error' } | { status: 'ready'; data: T }

// Runs `load` whenever `key` changes. A result is only returned for the key it was loaded for,
// so switching keys (e.g. model slug) shows loading instead of the previous page's data.
export function useAsync<T>(key: string, load: () => Promise<T>): AsyncState<T> {
  const [result, setResult] = useState<{ key: string; state: AsyncState<T> } | null>(null)

  useEffect(() => {
    let cancelled = false
    load()
      .then(
        (data): AsyncState<T> => ({ status: 'ready', data }),
        (): AsyncState<T> => ({ status: 'error' }),
      )
      .then((state) => {
        if (!cancelled) setResult({ key, state })
      })
    return () => {
      cancelled = true
    }
    // `load` is keyed by `key`; re-running on its identity would refetch every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  return result && result.key === key ? result.state : { status: 'loading' }
}
