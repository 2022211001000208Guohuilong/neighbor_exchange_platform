import request from '@/utils/request.js'

// 获取公告列表
export const getNoticeListService = (params) =>
  request.get('/notice', { params })

// 添加公告
export const addNoticeService = (data) =>
  request.post('/notice/add', data)

// 编辑公告
export const editNoticeService = (data) =>
  request.post('/notice/edit', data)

// 删除公告
export const deleteNoticeService = (id) =>
  request.post('/notice/delete', { id })

// 置顶公告
export const topNoticeService = (id) =>
  request.post('/notice/top', { id })
