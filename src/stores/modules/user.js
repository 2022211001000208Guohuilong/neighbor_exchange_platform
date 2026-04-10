import { defineStore } from 'pinia'
import { ref } from 'vue'

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
    // const getUser = (userInfo) => {
    //   user.value = userInfo
    // }
    const setUser = (obj) => {
      user.value = obj
    }

    return {
      token,
      setToken,
      removeToken,
      user,
      setUser,
    }
  },
  {
    persist: true,
  },
)
