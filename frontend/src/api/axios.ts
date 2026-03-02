import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'

export const api = axios.create({
  baseURL: '/api/v1',
  withCredentials: true,
  // No global Content-Type: Axios auto-sets application/json for objects
  // and multipart/form-data (with boundary) for FormData
})

let isRefreshing = false
let failedQueue: Array<{
  resolve: (value: unknown) => void
  reject: (reason?: unknown) => void
}> = []

function processQueue(error: AxiosError | null) {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error)
    else resolve(undefined)
  })
  failedQueue = []
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean
    }

    const isRefreshEndpoint = originalRequest?.url?.includes('token/refresh')
    const isLoginEndpoint =
      originalRequest?.url?.includes('/auth/token/') && !isRefreshEndpoint

    if (
      error.response?.status === 401 &&
      !originalRequest?._retry &&
      !isRefreshEndpoint &&
      !isLoginEndpoint
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then(() => api(originalRequest))
          .catch((err) => Promise.reject(err))
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        await api.post('/auth/token/refresh/')
        processQueue(null)
        return api(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError as AxiosError)
        // Navigate to login — page reload resets all Zustand state
        window.location.href = '/login'
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

export function buildFormData(data: Record<string, unknown>): FormData {
  const form = new FormData()
  for (const [key, value] of Object.entries(data)) {
    if (value === undefined || value === null) continue
    if (value instanceof File) {
      form.append(key, value)
    } else {
      form.append(key, String(value))
    }
  }
  return form
}
