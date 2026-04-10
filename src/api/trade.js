import request from '@/utils/request.js'

// 获取交易列表
export const getTradeListService = (params) => request.get('/trade/list/all', { params })

// 获取交易详情
export const getTradeDetailService = (trade_id) =>
  request.get('/trade/detail', { params: { trade_id } })

// 手动干预交易状态
export const updateTradeStatusService = (data) => request.post('/trade/handle', data)

// 获取交易统计数据
export const getTradeStatisticService = () => request.get('/admin/statistics/trade')
