const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000'

export function getBackendUrl(path: string) {
  return `${BACKEND_URL}${path.startsWith('/') ? path : `/${path}`}`
}

export async function backendFetch(
  path: string,
  options: RequestInit & { token?: string | null } = {}
) {
  const headers = new Headers(options.headers)
  if (options.token) {
    headers.set('Authorization', `Bearer ${options.token}`)
  }

  const res = await fetch(getBackendUrl(path), {
    ...options,
    headers,
  })

  const data = await res.json().catch(() => ({}))
  return { res, data }
}
