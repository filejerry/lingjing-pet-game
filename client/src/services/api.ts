/**
 * Axios API 客户端配置
 */

import axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import router from '@/router'

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // 添加认证token
    const token = localStorage.getItem('auth_token')
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }

    // 请求日志
    console.log(`📤 API请求: ${config.method?.toUpperCase()} ${config.url}`)

    return config
  },
  (error: AxiosError) => {
    console.error('❌ 请求错误:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // 响应日志
    console.log(`📥 API响应: ${response.config.url} - ${response.status}`)
    return response
  },
  (error: AxiosError) => {
    console.error('❌ 响应错误:', error)

    // 处理HTTP错误
    if (error.response) {
      switch (error.response.status) {
        case 401:
          // 未授权,跳转登录
          localStorage.removeItem('auth_token')
          router.push('/login')
          break
        case 403:
          // 禁止访问
          console.error('没有权限访问此资源')
          break
        case 404:
          // 资源不存在
          console.error('请求的资源不存在')
          break
        case 500:
          // 服务器错误
          console.error('服务器内部错误')
          break
        default:
          console.error(`HTTP错误: ${error.response.status}`)
      }
    } else if (error.request) {
      // 请求已发送但无响应
      console.error('网络错误,请检查连接')
    } else {
      // 其他错误
      console.error('请求配置错误:', error.message)
    }

    return Promise.reject(error)
  }
)

export default apiClient
