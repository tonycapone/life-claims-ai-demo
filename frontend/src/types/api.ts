export interface ApiError {
  detail: string
  status?: number
}

export interface ApiResponse<T> {
  data?: T
  error?: ApiError
  loading: boolean
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  page_size: number
}
