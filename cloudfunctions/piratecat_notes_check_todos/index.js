// 云函数入口文件 - 定时检查提醒事项并发送订阅消息
const cloud = require('wx-server-sdk')
const { TODO_STATUS } = require('./constants')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  
  try {
    const db = cloud.database()
    // 查询状态为pending、有remindAt字段的数据（排除提醒失败的状态）
    const todosResult = await db.collection('piratecat_notes_todo')
      .where({
        status: TODO_STATUS.PENDING, // 状态为待提醒
        remindAt: db.command.exists(true) // 存在remindAt字段
      })
      .get()

    const now = new Date()
    // 获取当前分钟的开始时间（例如：14:30:00.000）和结束时间（例如：14:30:59.999）
    const currentMinuteStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), now.getMinutes(), 0, 0)
    const currentMinuteEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), now.getMinutes(), 59, 999)
    // 过滤范围内的数据（确保remindAt在范围内）
    const todos = {
      data: todosResult.data.filter(todo => {
        if (!todo.remindAt) return false
        const remindDate = new Date(todo.remindAt)
        return remindDate >= currentMinuteStart && remindDate <= currentMinuteEnd
      })
    }
    
    console.log('找到 ' + todos.data.length + ' 个当前分钟的提醒事项')
    
    if (todos.data.length === 0) {
      return {
        success: true,
        message: '没有到期的提醒事项',
        count: 0
      }
    }
    
    // 获取订阅消息模板ID（从配置文件或常量中）
    const templateId = 'IiYABIcxdWwaAbqXPb71Yijw-iYMRlbRpghZCT58eQ8'
    const sendPromises = todos.data.map(async (todo) => {
      try {
        // 准备订阅消息数据
        const messageData = {
          thing2: { value: todo.content }, // 提醒内容（事项标题）
          date4: { value: formatDateTime(todo.remindAt) }, // 日程时间
          thing24: { value: '系统提醒' }, // 参加人
          thing11: { value: todo.description || '请及时处理' } // 备注
        }
        
        // 发送订阅消息
        const sendResult = await cloud.openapi.subscribeMessage.send({
          touser: todo.creatorOpenID || todo._openid,
          template_id: templateId,
          data: messageData,
          page: 'pages/todo-edit/index' // 点击消息跳转的页面
        })
        
        console.log('发送订阅消息成功:', todo._id, sendResult)
        
        // 更新事项状态为已发送
        await db.collection('piratecat_notes_todo').doc(todo._id).update({
          data: {
            status: TODO_STATUS.REMINDED, // 已提醒
            updatedAt: db.serverDate()
          }
        })
        
        return { success: true, id: todo._id }
      } catch (error) {
        console.error('发送提醒失败:', todo._id, error)
        
        // 序列化错误信息
        const serializedError = serializeError(error)
        
        return { 
          success: false, 
          id: todo._id, 
          error: serializedError
        }
      }
    })
    
    // 等待所有消息发送完成
    const results = await Promise.all(sendPromises)
    const successCount = results.filter(r => r.success).length
    const failedResults = results.filter(r => !r.success)
    
    // 批量更新发送失败的数据状态
    if (failedResults.length > 0) {
      console.log('开始批量更新 ' + failedResults.length + ' 个发送失败的提醒事项')
      
      const updatePromises = failedResults.map(async (result) => {
        try {
          await db.collection('piratecat_notes_todo').doc(result.id).update({
            data: {
              status: TODO_STATUS.REMIND_FAILED, // 提醒失败
              statusWarnMsg: result.error, // 保存序列化后的错误信息
              updatedAt: db.serverDate()
            }
          })
          console.log('已标记为提醒失败:', result.id)
          return { success: true, id: result.id }
        } catch (updateError) {
          console.error('更新失败状态时出错:', result.id, updateError)
          return { success: false, id: result.id, error: updateError.message }
        }
      })
      
      await Promise.all(updatePromises)
      console.log('批量更新完成')
    }
    
    return {
      success: true,
      message: `成功发送 ${successCount} 条提醒消息`,
      total: todos.data.length,
      successCount: successCount,
      results: results
    }
    
  } catch (error) {
    console.error('检查提醒事项失败:', error)
    return {
      success: false,
      message: error.message || '检查提醒事项失败',
      error: error
    }
  }
}

// 格式化日期时间
function formatDateTime(date) {
  if (!date) return ''
  
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hour = String(d.getHours()).padStart(2, '0')
  const minute = String(d.getMinutes()).padStart(2, '0')
  
  return `${year}年${month}月${day}日 ${hour}:${minute}`
}

/**
 * 序列化错误对象
 * @param {Error} error - 错误对象
 * @returns {string} 序列化后的错误信息
 */
function serializeError(error) {
  if (!error) {
    return '未知错误'
  }
  
  try {
    // 直接尝试序列化整个错误对象
    return JSON.stringify(error)
  } catch (e) {
    // 如果序列化失败，返回字符串形式
    return String(error)
  }
}

