import request from '@/utils/request.js'

//管理员登录接口
export const adminLoginService = ({ username, password }) =>
  request.post('/admin/login', { username, password })

// 获取用户列表
export const getUserListService = (params) => request.get('/user/list', { params })

// 更新用户信息
export const updateUserService = (data) => request.post('/user/update', data)

// 封禁用户
export const banUserService = (user_id, user_status) =>
  request.post('/admin/user/ban', { user_id, user_status })

// 重置用户密码
export const resetUserPasswordService = (user_id) =>
  request.post('/user/reset-password', { user_id })

// 获取用户统计数据
export const getUserStatisticService = () => request.get('/admin/statistics/user')

// 删除用户
export const deleteUser = (user_id) => request.delete('/user/delete', { params: { user_id } })
