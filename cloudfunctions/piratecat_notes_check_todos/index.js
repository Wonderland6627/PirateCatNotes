// 云函数入口文件 - 定时检查提醒事项并发送订阅消息
const cloud = require('wx-server-sdk')
const { TODO_STATUS } = require('./constants')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  
  try {
    const db = cloud.database()
    const now = new Date()
    
    // 查询所有已到期但未发送的提醒事项
    const todos = await db.collection('piratecat_notes_todo')
      .where({
        remindAt: db.command.lte(now), // 提醒时间小于等于现在
        status: TODO_STATUS.PENDING // 状态为待提醒
      })
      .get()
    
    console.log('找到 ' + todos.data.length + ' 个到期的提醒事项')
    
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
          page: 'pages/todo/index' // 点击消息跳转的页面
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
        return { success: false, id: todo._id, error: error.message }
      }
    })
    
    // 等待所有消息发送完成
    const results = await Promise.all(sendPromises)
    const successCount = results.filter(r => r.success).length
    
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

