// config/todoFieldConfig.js
/**
 * 待办事项字段配置
 * 用于控制哪些字段需要显示、编辑等
 * 后续可以扩展为权限控制（创建者、被邀请者的不同权限）
 */

/**
 * 字段类型枚举
 * 按照UI交互方式进行分类
 */
const FIELD_TYPE = {
  TEXT_INPUT: 'text_input',      // 文本输入框（textarea）- 用于标题、描述等文本字段
  DATETIME_PICKER: 'datetime',   // 日期时间选择器（picker） - 用于提醒时间等日期时间字段
  // STATUS字段已不在字段列表中显示，单独在页面顶部显示，此处保留用于未来可能的扩展
  AUTO_CALCULATED: 'readonly'    // 自动计算字段（只读显示） - 用于状态等自动计算的字段
}

/**
 * 字段配置
 * @type {Array<Object>}
 */
const TODO_FIELD_CONFIG = [
  {
    key: 'content',
    label: '标题',
    type: FIELD_TYPE.TEXT_INPUT,
    required: true,        // 必填字段
    visible: true,         // 是否可见
    editable: true,        // 是否可编辑
    sort: 1                // 显示顺序
  },
  {
    key: 'description',
    label: '事项描述',
    type: FIELD_TYPE.TEXT_INPUT,
    required: false,
    visible: true,
    editable: true,
    sort: 2
  },
  {
    key: 'remindAt',
    label: '提醒时间',
    type: FIELD_TYPE.DATETIME_PICKER,
    required: false,
    visible: true,
    editable: true,
    sort: 3
  },
  {
    key: 'status',
    label: '提醒状态',
    type: FIELD_TYPE.AUTO_CALCULATED,
    required: false,
    visible: false, // 不在字段列表中显示，单独在页面顶部显示
    editable: false, // 不可编辑，自动计算
    sort: 4
  }
  // 创建时间和更新时间不在这里配置，因为它们是系统字段
]

/**
 * 获取所有可见字段的配置（按sort排序）
 * @returns {Array} 字段配置数组
 */
function getVisibleFields() {
  return TODO_FIELD_CONFIG
    .filter(field => field.visible)
    .sort((a, b) => a.sort - b.sort)
}

/**
 * 根据key获取字段配置
 * @param {string} key - 字段key
 * @returns {Object|null} 字段配置
 */
function getFieldConfig(key) {
  return TODO_FIELD_CONFIG.find(field => field.key === key) || null
}

/**
 * 检查字段是否可编辑
 * @param {string} key - 字段key
 * @returns {boolean} 是否可编辑
 */
function isFieldEditable(key) {
  const config = getFieldConfig(key)
  return config ? config.editable : false
}

module.exports = {
  FIELD_TYPE,
  TODO_FIELD_CONFIG,
  getVisibleFields,
  getFieldConfig,
  isFieldEditable
}

