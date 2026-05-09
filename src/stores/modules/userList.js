import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getUserListService } from '@/api/user'

export const useUserListStore = defineStore(
  'big-user-list',
  () => {
    const userList = ref([])
    const getUser = async () => {
      const res = await getUserListService()
      userList.value = res.data
    }

    return {
      userList,
      getUser,
    }
  },
  {
    persist: true,
  },
)
