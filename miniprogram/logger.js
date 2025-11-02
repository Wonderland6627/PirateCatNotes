var logManager = wx.getRealtimeLogManager ? wx.getRealtimeLogManager() : null
var enableEditorLog = true
var appInstance = null // 缓存的 app 实例
var isDevOrTestModeCached = null // 缓存环境判断结果

/**
 * 初始化环境判断缓存（延迟初始化，在第一次使用时调用）
 */
function initDevModeCache() {
  if (isDevOrTestModeCached !== null) {
    return // 已经初始化过，直接返回
  }
  
  // 获取 app 实例（只获取一次）
  if (appInstance === null) {
    try {
      appInstance = getApp()
    } catch (e) {
      appInstance = false // 标记为获取失败
    }
  }
  
  // 如果 app 实例获取成功，判断环境
  if (appInstance && appInstance.globalData && appInstance.globalData.isDevOrTestMode) {
    isDevOrTestModeCached = appInstance.globalData.isDevOrTestMode()
  } else {
    isDevOrTestModeCached = false
  }
}

/**
 * 获取当前时间戳（精确到毫秒）
 * @returns {string} 格式化的时间字符串，格式：[HH:mm:ss.SSS] 或空字符串
 */
function getCurrentTime() {
  // 延迟初始化缓存
  if (isDevOrTestModeCached === null) {
    initDevModeCache()
  }
  
  if (!isDevOrTestModeCached) {
    return ''
  }
  
  const now = new Date()
  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')
  const seconds = String(now.getSeconds()).padStart(2, '0')
  const milliseconds = String(now.getMilliseconds()).padStart(3, '0')
  return `[${hours}:${minutes}:${seconds}.${milliseconds}]`
}

/**
 * 格式化日志消息
 * @param {string} msg - 日志消息
 * @param {string} tag - 标签（可选）
 * @returns {string} 格式化后的消息
 */
function formatLogMsg(msg, tag) {
  const time = getCurrentTime()
  const timePrefix = time ? `${time} ` : ''
  if (tag) {
    return `${timePrefix}[${tag}] ${msg}`
  }
  return `${timePrefix}${msg}`
}

/**
 * 创建带标签的 logger
 * @param {string} tag - 标签（通常是文件名或类名）
 * @returns {object} logger 对象
 */
function createLogger(tag) {
  return {
    debug(msg) {
      const formattedMsg = formatLogMsg(msg, tag)
      if (enableEditorLog) console.debug(formattedMsg)
      if (!logManager) return
      logManager.debug(formattedMsg)
    },
    info(msg) {
      const formattedMsg = formatLogMsg(msg, tag)
      if (enableEditorLog) console.info(formattedMsg)
      if (!logManager) return
      logManager.info(formattedMsg)
    },
    warn(msg) {
      const formattedMsg = formatLogMsg(msg, tag)
      if (enableEditorLog) console.warn(formattedMsg)
      if (!logManager) return
      logManager.warn(formattedMsg)
    },
    error(msg) {
      const formattedMsg = formatLogMsg(msg, tag)
      if (enableEditorLog) console.error(formattedMsg)
      if (!logManager) return
      logManager.error(formattedMsg)
    }
  }
}

module.exports = {
  // 默认 logger（无标签）
  debug() {
    const formattedMsg = formatLogMsg(arguments[0])
    if (enableEditorLog) console.debug(formattedMsg)
    if (!logManager) return
    logManager.debug(formattedMsg)
  },
  info() {
    const formattedMsg = formatLogMsg(arguments[0])
    if (enableEditorLog) console.info(formattedMsg)
    if (!logManager) return
    logManager.info(formattedMsg)
  },
  warn() {
    const formattedMsg = formatLogMsg(arguments[0])
    if (enableEditorLog) console.warn(formattedMsg)
    if (!logManager) return
    logManager.warn(formattedMsg)
  },
  error() {
    const formattedMsg = formatLogMsg(arguments[0])
    if (enableEditorLog) console.error(formattedMsg)
    if (!logManager) return
    logManager.error(formattedMsg)
  },
  setFilterMsg(msg) { // 从基础库2.7.3开始支持
    if (!logManager || !logManager.setFilterMsg) return
    if (typeof msg !== 'string') return
    logManager.setFilterMsg(msg)
  },
  // 导出创建 logger 的方法
  create: createLogger
}