import request from '@/utils/request.js'

// 获取商品列表
export const getGoodsListService = (params) => request.get('/goods', { params })

// 获取商品详情
export const getGoodsDetailService = (goods_id) =>
  request.get('/goods/detail', { params: { goods_id } })

// 编辑商品信息
export const editGoodsService = (data) => request.post('/goods/edit', data)

// 删除商品
export const deleteGoodsService = (goods_id, user_id) =>
  request.post('/goods/delete', { goods_id, user_id })

// 获取待审核商品列表
export const getPendingGoodsService = () => request.get('/admin/goods/pending')

// 审核商品
export const auditGoodsService = (data) => request.post('/admin/goods/audit', data)

// 获取商品分类列表
export const getGoodsCategoryService = () => request.get('/goodsCate')

// 添加商品分类
export const addGoodsCategoryService = (data) => request.post('/goodsCate/add', data)

// 编辑商品分类
export const editGoodsCategoryService = (data) => request.post('/goodsCate/edit', data)

// 删除商品分类
export const deleteGoodsCategoryService = (cate_id) =>
  request.post('/goodsCate/delete', { cate_id })
