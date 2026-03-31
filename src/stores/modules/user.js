import { defineStore } from 'pinia'
import { ref } from 'vue'
import { userGetInfo } from '@/api/user'

export const useUserStore = defineStore(
  'big-user',
  () => {
    const token = ref('')

    const setToken = (newToken) => {
      token.value = newToken
    }

    const removeToken = () => {
      token.value = ''
    }

    const user = ref({})
    const getUser = async () => {
      const res = await userGetInfo()
      // console.log(res.data)
      user.value = res.data
      // console.log(user.value)
    }
    const setUser = (obj) => {
      user.value = obj
    }

    return {
      token,
      setToken,
      removeToken,
      user,
      getUser,
      setUser,
    }
  },
  {
    persist: true,
  },
)
