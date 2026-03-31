import { dayjs } from 'element-plus'

//格式化日期
export const formatTime = (time) => {
  return dayjs(time).format('YYYY年MM月DD日')
}
