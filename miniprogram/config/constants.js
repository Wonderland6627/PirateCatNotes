// config/constants.js
/**
 * 项目常量配置
 */

const CONSTANTS = {
  // 云函数名称
  CLOUD_FUNCTION: {
    GET_WX_CONTEXT: 'piratecat_notes_get_wx_context',
    SEND_SUBSCRIBE_MESSAGE: 'piratecat_notes_send_subscribe_message',
    CHECK_TODOS: 'piratecat_notes_check_todos'
  },

  // 数据库集合名称
  COLLECTION: {
    USER: 'piratecat_notes_user',
    TODO: 'piratecat_notes_todo'
  },

  // 云存储路径
  CLOUD_STORAGE: {
    AVATARS: 'avatars/'
  },

  // 存储键名
  STORAGE_KEY: {
    USER_INFO: 'userInfo'
  },

  // 待办事项状态枚举
  TODO_STATUS: {
    PENDING: 'pending',     // 待提醒
    REMINDED: 'reminded',   // 已提醒
    COMPLETED: 'completed'  // 已完成
  },

  // 待办事项颜色配置
  TODO_COLORS: {
    1: {
      value: 1,
      startColor: '#ff9ecf',
      endColor: '#ff84c4',
      shadowColor: 'rgba(255, 158, 207, 0.3)',
      gradient: 'linear-gradient(135deg, #ff9ecf 0%, #ff84c4 100%)'
    },
    2: {
      value: 2,
      startColor: '#a8e6cf',
      endColor: '#7dd3b0',
      shadowColor: 'rgba(168, 230, 207, 0.3)',
      gradient: 'linear-gradient(135deg, #a8e6cf 0%, #7dd3b0 100%)'
    },
    3: {
      value: 3,
      startColor: '#ffd93d',
      endColor: '#ffc93c',
      shadowColor: 'rgba(255, 217, 61, 0.3)',
      gradient: 'linear-gradient(135deg, #ffd93d 0%, #ffc93c 100%)'
    },
    4: {
      value: 4,
      startColor: '#b4e7f7',
      endColor: '#9dd5eb',
      shadowColor: 'rgba(180, 231, 247, 0.3)',
      gradient: 'linear-gradient(135deg, #b4e7f7 0%, #9dd5eb 100%)'
    }
  },

  // 默认颜色值
  TODO_DEFAULT_COLOR: 1,

  // 订阅消息模板ID
  SUBSCRIBE_MESSAGE_TEMPLATE_ID: 'IiYABIcxdWwaAbqXPb71Yijw-iYMRlbRpghZCT58eQ8'
}

module.exports = CONSTANTS

