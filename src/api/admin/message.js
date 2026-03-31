import request from '@/utils/request.js'

// 发送系统通知
export const sendSystemMessageService = (data) =>
  request.post('/user/message', { ...data, msg_type: 1 })

// 获取消息列表
export const getMessageListService = (params) =>
  request.get('/user/message/list', { params })

// 批量发送消息
export const batchSendMessageService = (data) =>
  request.post('/user/message/batch', data)
