// utils/commonUtils.js
/**
 * 通用工具函数库
 */

/**
 * 生成 UUID v4
 * @returns {string} UUID 字符串
 */
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

/**
 * 生成短随机字符串
 * @param {number} length - 字符串长度
 * @returns {string} 随机字符串
 */
function generateRandomString(length = 8) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

/**
 * 将文本中的换行符替换为空格，用于单行显示
 * @param {string} text - 原始文本
 * @param {string} replacement - 替换字符，默认为空格
 * @returns {string} 处理后的文本
 */
function replaceNewlines(text, replacement = ' ') {
  if (!text || typeof text !== 'string') {
    return ''
  }
  return text.replace(/\n/g, replacement)
}

/**
 * 截断文本并在末尾添加省略号
 * @param {string} text - 原始文本
 * @param {number} maxLength - 最大长度
 * @param {string} suffix - 后缀，默认为 '...'
 * @returns {string} 处理后的文本
 */
function truncateText(text, maxLength, suffix = '...') {
  if (!text || typeof text !== 'string') {
    return ''
  }
  if (text.length <= maxLength) {
    return text
  }
  return text.substring(0, maxLength) + suffix
}

module.exports = {
  generateUUID,
  generateRandomString,
  replaceNewlines,
  truncateText
}

