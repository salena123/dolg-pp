import axios from 'axios'

const API_BASE_URL = 'http://localhost:8000'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      if (
        error.response.status === 404 &&
        (error.config?.url === '/departments/my-department' ||
         error.config?.url?.startsWith('/departments/my-department?'))
      ) {
        return Promise.resolve({ data: null, status: 200, statusText: 'OK', headers: {}, config: error.config })
      }

      if (error.response.status === 401) {
        localStorage.removeItem('token')
      }
      
      const errorData = error.response.data
      if (errorData.detail && typeof errorData.detail === 'object') {
        throw new Error(errorData.detail.detail || errorData.detail.error || 'Произошла ошибка')
      }
      throw new Error(errorData.detail || 'Произошла ошибка')
    } else if (error.request) {
      throw new Error('Сервер не отвечает. Проверьте подключение к интернету.')
    } else {
      throw new Error('Ошибка при отправке запроса')
    }
  }
)

export const jobsAPI = {
  getAll: (params = {}) => {
    const queryParams = new URLSearchParams()
    if (params.search) queryParams.append('search', params.search)
    if (params.employment_type) queryParams.append('employment_type', params.employment_type)
    if (params.location) queryParams.append('location', params.location)
    if (params.remote !== undefined && params.remote !== null) queryParams.append('remote', params.remote)
    if (params.status) queryParams.append('status', params.status)
    
    const queryString = queryParams.toString()
    const url = queryString ? `/jobs/?${queryString}` : '/jobs/'
    return api.get(url)
  },
  getById: (id) => api.get(`/jobs/${id}`),
  create: (data) => api.post('/jobs/', data),
  getMy: () => api.get('/jobs/my'),
}

export const applicationsAPI = {
  getAll: () => api.get('/applications/'),
  getById: (id) => api.get(`/applications/${id}`),
  create: (data) => api.post('/applications/', data),
  getByJob: (id) => api.get(`/applications/by-job/${id}`),
  uploadResume: (file) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post('/applications/upload-resume', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
  },
  getResumeUrl: (fileName) => {
    const cleanFileName = fileName.startsWith('/') ? fileName : `/${fileName}`
    return `${API_BASE_URL}${cleanFileName}`
  },
  updateStatus: (id, status) => api.patch(`/applications/${id}/status`, { status }),
}

export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getMe: () => api.get('/auth/me'),
}

export const departmentsAPI = {
  getMyDepartment: () => api.get('/departments/my-department'),
  createDepartment: (data) => api.post('/departments/', data),
  updateMyDepartment: (data) => api.put('/departments/my-department', data),
  deleteDepartment: (id) => api.delete(`/departments/${id}`)
}

export const reviewsAPI = {
  getForJob: (jobId) => api.get(`/reviews/job/${jobId}`),
  create: (data) => api.post('/reviews/', data),
}

export const employerReviewsAPI = {
  getForApplication: (applicationId) => api.get(`/employer-reviews/application/${applicationId}`),
  create: (data) => api.post('/employer-reviews/', data),
}

export default api
