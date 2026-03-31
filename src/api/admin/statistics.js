import request from '@/utils/request.js'

// 获取总览统计数据
export const getOverviewStatisticsService = () =>
  request.get('/admin/statistics/overview')

// 获取趋势数据
export const getTrendStatisticsService = (params) =>
  request.get('/admin/statistics/trend', { params })
