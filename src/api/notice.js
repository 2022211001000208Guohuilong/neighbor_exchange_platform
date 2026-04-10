import request from '@/utils/request.js'

// 获取公告列表
export const getNoticeListService = (params) => request.get('/notice', { params })

// 添加公告
export const addNoticeService = (data) => request.post('/notice/add', data)

// 编辑公告
export const editNoticeService = (data) => request.post('/notice/edit', data)

// 删除公告
export const deleteNoticeService = (notice_id) => request.post('/notice/delete', { notice_id })

// 置顶公告
export const topNoticeService = (notice_id) => request.post('/notice/top', { notice_id })
