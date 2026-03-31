import axios from 'axios'
import { useUserStore } from '@/stores'
import { ElMessage } from 'element-plus'
import router from '@/router'

const baseURL = 'http://big-event-vue-api-t.itheima.net'

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
    if (res.data.code === 0) {
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
      // 清除过期的token
      const userStore = useUserStore()
      userStore.clearToken()
      router.push('/login')
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
    return Promise.reject(err)
  },
)

export default instance
export { baseURL }
