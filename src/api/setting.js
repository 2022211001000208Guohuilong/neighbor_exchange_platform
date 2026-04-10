import request from '@/utils/request.js'

// 获取管理员列表
export const getAdminListService = () => request.get('/admin/list')

// 添加管理员
export const addAdminService = (data) => request.post('/admin/add', data)

// 编辑管理员
export const editAdminService = (data) => request.post('/admin/edit', data)

// 重置管理员密码
export const resetAdminPasswordService = (id) => request.post('/admin/resetPassword', { id })

//修改管理员密码
export const updateAdminPasswordService = (data) => request.post('/admin/updatePassword', data)

// 删除管理员
export const deleteAdminService = (id) => request.post('/admin/delete', { id })
