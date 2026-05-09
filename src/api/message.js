import request from '@/utils/request.js'

// 发送系统通知
export const sendSystemMessageService = (data) => request.post('/message/send', data)

// 获取消息列表
export const getMessageListService = () => request.get('/messages')

// 获取管理员消息列表
export const getAdminMessageListService = () => request.get('/messages/admin')

//标记消息为已读
export const markAdminMessageAsReadService = (data) => {
  return request.post(`/messages/admin/read`, data)
}

// 发送管理员消息
export const sendAdminMessageService = (data) => request.post(`/message/admin/send`, data)

// 删除消息
export const deleteMessageService = (data) => request.post(`/messages/delete`, data)
