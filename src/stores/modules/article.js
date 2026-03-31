import { defineStore } from 'pinia'
import { artGetChannelsService, artGetArticleService } from '@/api/article'
import { ref } from 'vue'

export const useArticleStore = defineStore('article', () => {
  const channelList = ref([])
  const getChannelList = async () => {
    const res = await artGetChannelsService()
    // console.log(res.data)
    channelList.value = res.data
    // console.log(articleList.value)
  }

  const params = ref({
    pagenum: 1,
    pagesize: 5,
    cate_id: '',
    state: '',
  })
  const articleList = ref([])
  const total = ref(0)
  const getList = async () => {
    const res = await artGetArticleService(params.value)
    // console.log(res.data)
    articleList.value = res.data
    total.value = res.total || 0
    // console.log(articleList.value)
  }
  const getArticleList = (obj) => {
    //先复制 params.value 对象的所有属性,再复制 obj 对象的所有属性如果有同名属性，obj 的属性值会覆盖 params.value 的属性值
    params.value = { ...params.value, ...obj }
    getList()
  }

  return {
    channelList,
    getChannelList,
    articleList,
    total,
    params,
    getList,
    getArticleList,
  }
})
