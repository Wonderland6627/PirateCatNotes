// pages/temp/index.js
const logger = require('../../logger')
const CONSTANTS = require('../../config/constants')

Page({

  /**
   * 页面的初始数据
   */
  data: {
    templateId: 'IiYABIcxdWwaAbqXPb71Yijw-iYMRlbRpghZCT58eQ8' // 日程提醒模板ID
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    
  },

  async getWxContext() {
    const result = await wx.cloud.callFunction({
      name: CONSTANTS.CLOUD_FUNCTION.GET_WX_CONTEXT
    })
    
    logger.info('返回值: ' + JSON.stringify(result.result))
  },

  /**
   * 按钮点击事件处理
   */
  onTestCloudFunction() {
    this.getWxContext()
  },

  /**
   * 请求订阅消息权限
   */
  onRequestSubscribeMessage() {
    wx.requestSubscribeMessage({
      tmplIds: [this.data.templateId],
      success: (res) => {
        logger.info('订阅消息结果: ' + JSON.stringify(res))
        const templateId = this.data.templateId
        if (res[templateId] === 'accept') {
          wx.showToast({
            title: '订阅成功',
            icon: 'success'
          })
        } else if (res[templateId] === 'reject') {
          wx.showToast({
            title: '用户拒绝订阅',
            icon: 'none'
          })
        } else {
          wx.showToast({
            title: '订阅失败',
            icon: 'none'
          })
        }
      },
      fail: (err) => {
        logger.error('订阅消息失败: ' + JSON.stringify(err))
        wx.showToast({
          title: '订阅失败',
          icon: 'none'
        })
      }
    })
  },

  /**
   * 发送订阅消息
   */
  async onSendSubscribeMessage() {
    try {
      wx.showLoading({
        title: '发送中...'
      })

      const result = await wx.cloud.callFunction({
        name: 'piratecat_notes_send_subscribe_message',
        data: {
          templateId: this.data.templateId,
          data: {
            thing2: { value: '重要会议' }, // 提醒内容
            date4: { value: '2024年1月15日 14:00' }, // 日程时间
            thing24: { value: '张三、李四' }, // 参加人
            thing11: { value: '请准时参加' } // 备注
          }
        }
      })

      wx.hideLoading()
      logger.info('发送结果: ' + JSON.stringify(result.result))
      
      if (result.result.success) {
        wx.showToast({
          title: '发送成功',
          icon: 'success'
        })
      } else {
        wx.showToast({
          title: result.result.message || '发送失败',
          icon: 'none'
        })
      }
    } catch (error) {
      wx.hideLoading()
      logger.error('发送订阅消息失败: ' + JSON.stringify(error))
      wx.showToast({
        title: '发送失败',
        icon: 'none'
      })
    }
  },

  /**
   * 检查订阅状态
   */
  onCheckSubscribeStatus() {
    wx.getSetting({
      withSubscriptions: true, // 添加这个参数来获取订阅消息设置
      success: (res) => {
        logger.info('用户设置序列化: ' + JSON.stringify(res, null, 2))
        const templateId = this.data.templateId
        
        if (res.subscriptionsSetting) {
          const mainSwitch = res.subscriptionsSetting.mainSwitch
          const itemSettings = res.subscriptionsSetting.itemSettings
          
          // 检查总开关状态
          if (!mainSwitch) {
            wx.showModal({
              title: '订阅状态',
              content: `模板ID: ${templateId}\n总开关: 关闭\n状态: 订阅消息总开关已关闭`,
              showCancel: false
            })
            return
          }
          
          // 获取模板状态 - 优先从itemSettings获取，如果没有则从根级别获取
          let templateStatus = null
          if (itemSettings && itemSettings[templateId]) {
            templateStatus = itemSettings[templateId]
          } else if (res.subscriptionsSetting[templateId]) {
            templateStatus = res.subscriptionsSetting[templateId]
          }
          
          if (templateStatus) {
            let message = ''
            switch (templateStatus) {
              case 'accept':
                message = '已订阅该模板消息'
                break
              case 'reject':
                message = '已拒绝该模板消息'
                break
              case 'ban':
                message = '该模板消息已被封禁'
                break
              default:
                message = '未知状态'
            }
            
            wx.showModal({
              title: '订阅状态',
              content: `模板ID: ${templateId}\n总开关: 开启\n状态: ${message}`,
              showCancel: false
            })
          } else {
            wx.showModal({
              title: '订阅状态',
              content: `模板ID: ${templateId}\n总开关: 开启\n状态: 用户尚未对该模板进行订阅操作`,
              showCancel: false
            })
          }
        } else {
          wx.showModal({
            title: '订阅状态',
            content: '无法获取订阅消息设置',
            showCancel: false
          })
        }
      },
      fail: (err) => {
        logger.error('获取设置失败: ' + JSON.stringify(err))
        wx.showToast({
          title: '获取状态失败',
          icon: 'none'
        })
      }
    })
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {

  }
})