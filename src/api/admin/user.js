import request from '@/utils/request.js'

// 获取用户列表
export const getUserListService = (params) =>
  request.get('/user/list', { params })

// 获取用户详情
export const getUserInfoService = (id) =>
  request.get('/user/info', { params: { id } })

// 更新用户信息
export const updateUserService = (data) =>
  request.post('/user/update', data)

// 封禁用户
export const banUserService = (id) =>
  request.post('/admin/user/ban', { id })

// 解封用户
export const unbanUserService = (id) =>
  request.post('/admin/user/unban', { id })

// 重置用户密码
export const resetUserPasswordService = (id) =>
  request.post('/user/reset-password', { id })

// 获取用户统计数据
export const getUserStatisticService = () =>
  request.get('/admin/statistics/user')
