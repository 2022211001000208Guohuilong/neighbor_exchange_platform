import request from '@/utils/request.js'

//获取文章分类
export const artGetChannelsService = () =>
  request.get('https://big-event-vue-api-t.itheima.net/my/cate/list')

//添加文章分类
export const artAddChannelService = (obj) =>
  request.post('https://big-event-vue-api-t.itheima.net/my/cate/add', {
    ...obj,
  })

//编辑文章分类
export const artEditChannelService = (obj) =>
  request.put('https://big-event-vue-api-t.itheima.net/my/cate/info', obj)

//删除文章分类
export const artDelChannelService = (id) =>
  request.delete('https://big-event-vue-api-t.itheima.net/my/cate/del', {
    params: {
      id,
    },
  })

//获取文章
export const artGetArticleService = (params) =>
  request.get('https://big-event-vue-api-t.itheima.net/my/article/list', {
    params,
  })

//添加文章
export const artAddArticleService = (obj) =>
  request.post('https://big-event-vue-api-t.itheima.net/my/article/add', obj)

//编辑文章
export const artEditArticleService = (obj) =>
  request.put('https://big-event-vue-api-t.itheima.net/my/article/info', obj)

//获取文章详情
export const getArticleDetailService = (id) =>
  request.get('https://big-event-vue-api-t.itheima.net/my/article/info', {
    params: {
      id,
    },
  })

//删除文章
export const artDelArticleService = (id) =>
  request.delete('https://big-event-vue-api-t.itheima.net/my/article/info', {
    params: {
      id,
    },
  })
