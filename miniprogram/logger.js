var logManager = wx.getRealtimeLogManager ? wx.getRealtimeLogManager() : null
var enableEditorLog = true

/**
 * 创建带标签的 logger
 * @param {string} tag - 标签（通常是文件名或类名）
 * @returns {object} logger 对象
 */
function createLogger(tag) {
  return {
    debug(msg) {
      const formattedMsg = `[${tag}] ${msg}`
      if (enableEditorLog) console.debug(formattedMsg)
      if (!logManager) return
      logManager.debug(formattedMsg)
    },
    info(msg) {
      const formattedMsg = `[${tag}] ${msg}`
      if (enableEditorLog) console.info(formattedMsg)
      if (!logManager) return
      logManager.info(formattedMsg)
    },
    warn(msg) {
      const formattedMsg = `[${tag}] ${msg}`
      if (enableEditorLog) console.warn(formattedMsg)
      if (!logManager) return
      logManager.warn(formattedMsg)
    },
    error(msg) {
      const formattedMsg = `[${tag}] ${msg}`
      if (enableEditorLog) console.error(formattedMsg)
      if (!logManager) return
      logManager.error(formattedMsg)
    }
  }
}

module.exports = {
  // 默认 logger（无标签）
  debug() {
    if (enableEditorLog) console.debug(arguments[0])
    if (!logManager) return
    logManager.debug.apply(logManager, arguments)
  },
  info() {
    if (enableEditorLog) console.info(arguments[0])
    if (!logManager) return
    logManager.info.apply(logManager, arguments)
  },
  warn() {
    if (enableEditorLog) console.warn(arguments[0])
    if (!logManager) return
    logManager.warn.apply(logManager, arguments)
  },
  error() {
    if (enableEditorLog) console.error(arguments[0])
    if (!logManager) return
    logManager.error.apply(logManager, arguments)
  },
  setFilterMsg(msg) { // 从基础库2.7.3开始支持
    if (!logManager || !logManager.setFilterMsg) return
    if (typeof msg !== 'string') return
    logManager.setFilterMsg(msg)
  },
  // 导出创建 logger 的方法
  create: createLogger
}