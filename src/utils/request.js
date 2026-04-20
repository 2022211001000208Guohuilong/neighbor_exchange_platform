import axios from 'axios'
import { useUserStore } from '@/stores'
import { ElMessage } from 'element-plus'
import router from '@/router'

// const baseURL = 'http://big-event-vue-api-t.itheima.net'http://${localhost}:3001
// const baseURL = 'http://10.32.62.156:3001' //10.32.148.202

const envBaseURL = import.meta.env.VITE_API_BASE_URL
const runtimeBaseURL =
  typeof window !== 'undefined'
    ? `${window.location.protocol}//${window.location.hostname}:3001`
    : 'http://localhost:3001'

const baseURL = envBaseURL || (import.meta.env.DEV ? runtimeBaseURL : '')

const instance = axios.create({
  baseURL,
  timeout: 10000,
})

// 请求拦截器
instance.interceptors.request.use(
  (config) => {
    // 携带token（修正：header -> headers）
    const userStore = useUserStore()
    if (userStore.token) {
      config.headers.Authorization = userStore.token
    }
    return config
  },
  (err) => Promise.reject(err),
)

// 响应拦截器
instance.interceptors.response.use(
  (res) => {
    // 摘取核心响应数据
    if (res.data.code === 200) {
      // 修改为200
      // 只返回数据部分，简化组件中的使用
      return res.data
    }

    // 处理业务失败
    ElMessage({
      message: res.data.message || '服务异常!',
      type: 'error',
      showClose: true,
    })
    return Promise.reject(res.data)
  },
  (err) => {
    // 处理401错误
    if (err.response?.status === 401) {
      const userStore = useUserStore()
      const reqUrl = err.config?.url || ''
      const isLoginRequest = reqUrl.includes('/admin/login')

      if (isLoginRequest) {
        return Promise.reject(err.response?.data || err)
      }

      if (!userStore.token) {
        router.push('/login')
        ElMessage({
          message: err.response?.data?.message || '请先登录',
          type: 'warning',
        })
        return Promise.reject(err.response?.data || err)
      }

      // 清除过期的token
      if (typeof userStore.clearToken === 'function') {
        userStore.clearToken()
      } else if (typeof userStore.removeToken === 'function') {
        userStore.removeToken()
      } else {
        userStore.token = ''
      }
      if (typeof userStore.setUser === 'function') {
        userStore.setUser({})
      }
      if (router.currentRoute.value.path !== '/login') router.push('/login')
      ElMessage({
        message: '登录已过期，请重新登录',
        type: 'warning',
      })
    } else {
      // 默认错误处理（增加安全检查）
      const errorMsg = err.response?.data?.message || '服务异常!'
      ElMessage({
        message: errorMsg,
        type: 'error',
        showClose: true,
      })
    }
    return Promise.reject(err.response?.data || err)
  },
)

export default instance
export { baseURL }
