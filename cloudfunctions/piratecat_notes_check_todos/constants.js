// 云函数常量配置
/**
 * 待办事项状态枚举
 */
const TODO_STATUS = {
  PENDING: 'pending',        // 待提醒
  REMINDED: 'reminded',      // 已提醒
  COMPLETED: 'completed',    // 已完成
  REMIND_FAILED: 'remind_failed'  // 提醒失败（通常是权限问题）
}

module.exports = {
  TODO_STATUS
}

