import request from '@/utils/request.js'

//注册接口
export const userRegisterService = ({ username, password, repassword }) => {
  return request.post('https://big-event-vue-api-t.itheima.net/api/reg', {
    username,
    password,
    repassword,
  })
}

//登录接口
export const userLoginService = ({ username, password }) =>
  request.post('https://big-event-vue-api-t.itheima.net/api/login', { username, password })

//获取用户基本信息
export const userGetInfo = () => {
  return request.get('https://big-event-vue-api-t.itheima.net/my/userinfo')
}

//更新用户基本信息
export const userUpdateInfo = (data) => {
  return request.put('https://big-event-vue-api-t.itheima.net/my/userinfo', data)
}

//更新用户头像
export const userUpdateAvatar = (avatar) => {
  return request.patch('https://big-event-vue-api-t.itheima.net/my/update/avatar', { avatar })
}

//重置密码
export const userResetPassword = (data) => {
  return request.patch('https://big-event-vue-api-t.itheima.net/my/updatepwd', data)
}
