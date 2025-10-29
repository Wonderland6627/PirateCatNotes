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
  }
}

module.exports = CONSTANTS

