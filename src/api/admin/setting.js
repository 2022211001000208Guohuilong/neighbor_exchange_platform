import request from '@/utils/request.js'

// 获取系统配置
export const getSystemConfigService = () =>
  request.get('/admin/config')

// 更新系统配置
export const updateSystemConfigService = (data) =>
  request.post('/admin/config/update', data)

// 获取管理员列表
export const getAdminListService = () =>
  request.get('/admin/list')

// 添加管理员
export const addAdminService = (data) =>
  request.post('/admin/add', data)

// 编辑管理员
export const editAdminService = (data) =>
  request.post('/admin/edit', data)

// 删除管理员
export const deleteAdminService = (id) =>
  request.post('/admin/delete', { id })
