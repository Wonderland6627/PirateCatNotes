// utils/subscribeMessageUtils.js
/**
 * 订阅消息权限管理工具
 * 用于统一管理订阅消息的权限申请、状态检查等
 */
const logger = require('../logger')
const log = logger.create('subscribeMessageUtils')
const CONSTANTS = require('../config/constants')

/**
 * 订阅消息权限状态枚举
 */
const PERMISSION_STATUS = {
  ACCEPT: 'accept',     // 用户同意
  REJECT: 'reject',     // 用户拒绝
  BAN: 'ban'            // 用户已禁止（永久拒绝）
}

/**
 * 获取订阅消息权限状态
 * @param {string} templateId - 订阅消息模板ID，默认为提醒模板ID
 * @returns {Promise<Object>} 权限状态对象 { hasPermission: boolean, status: string, canRequest: boolean, remainingCount: number }
 */
async function getPermissionStatus(templateId = CONSTANTS.SUBSCRIBE_MESSAGE.REMINDER_TEMPLATE_ID) {
  return new Promise((resolve) => {
    wx.getSetting({
      withSubscriptions: true, // 获取订阅消息设置
      success: (res) => {
        try {
          const subscriptionsSetting = res.subscriptionsSetting || {}
          
          // 检查总开关状态
          if (!subscriptionsSetting.mainSwitch) {
            log.info('订阅消息总开关已关闭')
            resolve({
              hasPermission: false,
              status: 'mainSwitchOff',
              canRequest: true, // 可以申请，但需要先开启总开关
              remainingCount: 0,
              message: '订阅消息总开关已关闭，请在设置中开启'
            })
            return
          }
          
          // 获取模板状态
          const itemSettings = subscriptionsSetting.itemSettings || {}
          let templateStatus = itemSettings[templateId] || null
          
          if (!templateStatus) {
            // 没有权限记录，可以申请
            resolve({
              hasPermission: false,
              status: 'neverRequested',
              canRequest: true,
              remainingCount: 0,
              message: '尚未申请订阅消息权限'
            })
            return
          }
          
          // 解析状态
          const status = templateStatus
          const hasPermission = status === PERMISSION_STATUS.ACCEPT
          const canRequest = status === PERMISSION_STATUS.REJECT // 只有reject状态可以再次申请
          
          // 获取剩余提醒次数（微信官方文档说明：用户每次同意授权，可获得最多3次提醒）
          // 注意：wx.getSetting无法直接获取剩余次数，这里返回null表示未知
          // 实际可以通过云函数发送消息的返回结果来判断
          const remainingCount = null // 无法直接获取，需要根据实际情况判断
          
          resolve({
            hasPermission: hasPermission,
            status: status,
            canRequest: canRequest,
            remainingCount: remainingCount,
            message: hasPermission 
              ? '已获得订阅消息权限' 
              : status === PERMISSION_STATUS.REJECT 
                ? '用户曾拒绝，可以重新申请' 
                : '用户已永久禁止'
          })
        } catch (error) {
          log.error('解析订阅消息权限状态失败: ' + JSON.stringify(error))
          resolve({
            hasPermission: false,
            status: 'unknown',
            canRequest: true,
            remainingCount: 0,
            message: '获取权限状态失败'
          })
        }
      },
      fail: (err) => {
        log.error('获取订阅消息设置失败: ' + JSON.stringify(err))
        resolve({
          hasPermission: false,
          status: 'error',
          canRequest: true,
          remainingCount: 0,
          message: '获取权限状态失败'
        })
      }
    })
  })
}

/**
 * 申请订阅消息权限
 * @param {string} templateId - 订阅消息模板ID，默认为提醒模板ID
 * @returns {Promise<Object>} 申请结果 { success: boolean, status: string, message: string }
 */
async function requestPermission(templateId = CONSTANTS.SUBSCRIBE_MESSAGE.REMINDER_TEMPLATE_ID) {
  return new Promise((resolve) => {
    wx.requestSubscribeMessage({
      tmplIds: [templateId],
      success: (res) => {
        const status = res[templateId]
        
        if (status === PERMISSION_STATUS.ACCEPT) {
          log.info('订阅消息权限申请成功')
          resolve({
            success: true,
            status: PERMISSION_STATUS.ACCEPT,
            message: '订阅消息权限申请成功'
          })
        } else if (status === PERMISSION_STATUS.REJECT) {
          log.warn('用户拒绝订阅消息权限')
          resolve({
            success: false,
            status: PERMISSION_STATUS.REJECT,
            message: '用户拒绝订阅消息权限，将无法接收提醒通知'
          })
        } else {
          // 'ban' 或其他状态
          log.warn('订阅消息权限申请失败: ' + status)
          resolve({
            success: false,
            status: status || 'unknown',
            message: '订阅消息权限申请失败'
          })
        }
      },
      fail: (err) => {
        log.error('订阅消息权限申请失败: ' + JSON.stringify(err))
        resolve({
          success: false,
          status: 'error',
          message: '订阅消息权限申请失败: ' + (err.errMsg || '未知错误')
        })
      }
    })
  })
}

/**
 * 检查并申请订阅消息权限（完整流程）
 * 1. 先检查当前权限状态
 * 2. 如果有权限，直接返回成功
 * 3. 如果没有权限且可以申请，则申请权限
 * 4. 返回最终结果
 * @param {string} templateId - 订阅消息模板ID，默认为提醒模板ID
 * @returns {Promise<Object>} 结果对象 { success: boolean, message: string, needUserAction: boolean }
 */
async function checkAndRequestPermission(templateId = CONSTANTS.SUBSCRIBE_MESSAGE.REMINDER_TEMPLATE_ID) {
  // 先检查当前权限状态
  const statusResult = await getPermissionStatus(templateId)
  
  // 如果已有权限，直接返回成功
  if (statusResult.hasPermission) {
    log.info('用户已有订阅消息权限')
    return {
      success: true,
      message: '用户已有订阅消息权限',
      needUserAction: false
    }
  }
  
  // 如果总开关关闭，提示用户
  if (statusResult.status === 'mainSwitchOff') {
    return {
      success: false,
      message: statusResult.message,
      needUserAction: true,
      needOpenMainSwitch: true
    }
  }
  
  // 如果无法申请（如已永久禁止），返回失败
  if (!statusResult.canRequest) {
    return {
      success: false,
      message: statusResult.message,
      needUserAction: false
    }
  }
  
  // 可以申请，执行申请流程
  const requestResult = await requestPermission(templateId)
  
  return {
    success: requestResult.success,
    message: requestResult.message,
    needUserAction: false,
    status: requestResult.status
  }
}

/**
 * 检查是否需要申请权限（用于判断是否显示申请按钮等）
 * @param {string} templateId - 订阅消息模板ID，默认为提醒模板ID
 * @returns {Promise<boolean>} 是否需要申请权限
 */
async function needRequestPermission(templateId = CONSTANTS.SUBSCRIBE_MESSAGE.REMINDER_TEMPLATE_ID) {
  const statusResult = await getPermissionStatus(templateId)
  return !statusResult.hasPermission && statusResult.canRequest
}

module.exports = {
  PERMISSION_STATUS,
  getPermissionStatus,
  requestPermission,
  checkAndRequestPermission,
  needRequestPermission
}

