/**
 * 公共格式化工具
 */

// 将时间字符串格式化为本地时间
export const formatTime = (timeString) => {
  const date = new Date(timeString)
  return date.toLocaleString()
}
