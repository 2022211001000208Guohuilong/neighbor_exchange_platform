import request from '@/utils/request.js'

// 发送系统通知
export const sendSystemMessageService = (data) => request.post('/message/send', data)

// 获取消息列表
export const getMessageListService = () => request.get('/messages')

// 删除消息
export const deleteMessageService = (data) => request.post(`/messages/delete`, data)
