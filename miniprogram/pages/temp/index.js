// pages/temp/index.js
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
      name: 'piratecat_notes_get_wx_context'
    })
    
    console.log('返回值:', result.result)
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
        console.log('订阅消息结果:', res)
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
        console.error('订阅消息失败:', err)
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
      console.log('发送结果:', result.result)
      
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
      console.error('发送订阅消息失败:', error)
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
      success: (res) => {
        console.log('用户设置:', res)
        const templateId = this.data.templateId
        
        if (res.subscriptionsSetting && res.subscriptionsSetting[templateId]) {
          const status = res.subscriptionsSetting[templateId]
          let message = ''
          
          
          switch (status) {
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
            content: `模板ID: ${templateId}\n状态: ${message}`,
            showCancel: false
          })
        } else {
          wx.showModal({
            title: '订阅状态',
            content: '未找到该模板的订阅状态',
            showCancel: false
          })
        }
      },
      fail: (err) => {
        console.error('获取设置失败:', err)
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