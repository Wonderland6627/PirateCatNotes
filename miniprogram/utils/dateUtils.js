// utils/dateUtils.js
/**
 * 日期工具函数库
 */

/**
 * 安全解析日期字符串（兼容 iOS）
 * iOS 只支持特定格式：yyyy/MM/dd、yyyy/MM/dd HH:mm:ss、yyyy-MM-dd、yyyy-MM-ddTHH:mm:ss 等
 * @param {string|number|Date} dateStr - 日期字符串、时间戳或 Date 对象
 * @returns {Date|null} Date 对象，解析失败返回 null
 */
function safeParseDate(dateStr) {
  if (!dateStr) return null
  
  // 如果是 Date 对象，直接返回
  if (dateStr instanceof Date) {
    return dateStr
  }
  
  // 如果是时间戳，直接创建 Date
  if (typeof dateStr === 'number') {
    return new Date(dateStr)
  }
  
  // 如果是字符串，需要转换为 iOS 支持的格式
  if (typeof dateStr === 'string') {
    // 将 "yyyy-MM-dd HH:mm" 格式转换为 "yyyy-MM-ddTHH:mm:ss" (iOS 支持)
    let isoFormat = dateStr.replace(' ', 'T')
    
    // 如果没有秒数，添加 :00
    if (isoFormat.includes(':') && isoFormat.split(':').length === 2) {
      isoFormat = isoFormat + ':00'
    }
    
    // 如果已经是 ISO 格式，直接使用
    const date = new Date(isoFormat)
    
    // 检查解析是否成功
    if (isNaN(date.getTime())) {
      // 如果解析失败，尝试其他格式
      // 尝试 yyyy/MM/dd HH:mm:ss 格式
      const slashFormat = dateStr.replace(/-/g, '/')
      const date2 = new Date(slashFormat)
      if (!isNaN(date2.getTime())) {
        return date2
      }
      return null
    }
    
    return date
  }
  
  return null
}

/**
 * 格式化日期为 "yyyy-MM-dd HH:mm" 格式
 * @param {string|number|Date} dateStr - 日期字符串、时间戳或 Date 对象
 * @returns {string} 格式化后的日期字符串，失败返回空字符串
 */
function formatDate(dateStr) {
  if (!dateStr) return ''
  
  // 如果是字符串，检查是否已经是格式化好的
  if (typeof dateStr === 'string' && /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}/.test(dateStr)) {
    return dateStr
  }
  
  // 使用安全解析
  const date = safeParseDate(dateStr)
  if (!date || isNaN(date.getTime())) {
    return ''
  }
  
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hour = String(date.getHours()).padStart(2, '0')
  const minute = String(date.getMinutes()).padStart(2, '0')
  
  return `${year}-${month}-${day} ${hour}:${minute}`
}

/**
 * 格式化日期为 "yyyy-MM-dd" 格式
 * @param {string|number|Date} dateStr - 日期字符串、时间戳或 Date 对象
 * @returns {string} 格式化后的日期字符串，失败返回空字符串
 */
function formatDateOnly(dateStr) {
  if (!dateStr) return ''
  
  const date = safeParseDate(dateStr)
  if (!date || isNaN(date.getTime())) {
    return ''
  }
  
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  
  return `${year}-${month}-${day}`
}

/**
 * 格式化日期为 "HH:mm" 格式
 * @param {string|number|Date} dateStr - 日期字符串、时间戳或 Date 对象
 * @returns {string} 格式化后的时间字符串，失败返回空字符串
 */
function formatTimeOnly(dateStr) {
  if (!dateStr) return ''
  
  const date = safeParseDate(dateStr)
  if (!date || isNaN(date.getTime())) {
    return ''
  }
  
  const hour = String(date.getHours()).padStart(2, '0')
  const minute = String(date.getMinutes()).padStart(2, '0')
  
  return `${hour}:${minute}`
}

/**
 * 合并日期和时间字符串为 Date 对象
 * @param {string} dateStr - 日期字符串，格式 "yyyy-MM-dd"
 * @param {string} timeStr - 时间字符串，格式 "HH:mm"，可选
 * @returns {Date|null} Date 对象，解析失败返回 null
 */
function combineDateAndTime(dateStr, timeStr) {
  if (!dateStr) return null
  
  // 如果提供了时间，合并日期和时间；否则使用当天的 00:00
  const dateTimeStr = timeStr ? `${dateStr} ${timeStr}` : `${dateStr} 00:00`
  
  return safeParseDate(dateTimeStr)
}

module.exports = {
  safeParseDate,
  formatDate,
  formatDateOnly,
  formatTimeOnly,
  combineDateAndTime
}

