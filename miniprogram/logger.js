var logManager = wx.getRealtimeLogManager ? wx.getRealtimeLogManager() : null
var enableEditorLog = true

module.exports = {
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
  }
}