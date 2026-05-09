import request from '@/utils/request.js'

// 获取所有评论（管理端）
export const getAdminCommentListService = (params) => request.get('/comment/list', { params })

// 隐藏/显示评论（管理端）
export const hideCommentService = (data) => request.post('/admin/comment/hide', data)

// 删除评论（管理员也可直接物理删除）
export const deleteCommentService = (comment_id, user_id) =>
  request.post('/comment/delete', { comment_id, user_id })
