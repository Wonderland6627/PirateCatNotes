// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  
  try {
    const { templateId, data } = event
    
    if (!templateId) {
      return {
        success: false,
        message: '模板ID不能为空'
      }
    }
    
    if (!data) {
      return {
        success: false,
        message: '消息数据不能为空'
      }
    }
    
    // 调用微信订阅消息发送接口
    const result = await cloud.openapi.subscribeMessage.send({
      touser: wxContext.OPENID, // 接收者openid
      template_id: templateId,   // 模板ID
      data: data,               // 模板数据
      page: 'pages/temp/index'  // 点击消息跳转的页面
    })
    
    console.log('发送订阅消息结果:', result)
    
    return {
      success: true,
      message: '发送成功',
      result: result
    }
    
  } catch (error) {
    console.error('发送订阅消息失败:', error)
    
    return {
      success: false,
      message: error.message || '发送失败',
      error: error
    }
  }
}