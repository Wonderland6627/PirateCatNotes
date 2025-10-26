// pages/todo/index.js - 创建提醒事项页面
const logger = require('../../logger')
const log = logger.create('todo')
const dataManager = require('../../utils/dataManager')

Page({
  /**
   * 页面的初始数据
   */
  data: {
    title: '', // 标题
    description: '', // 事项描述
    remindDate: '', // 提醒日期
    remindTime: '', // 提醒时间
    showTimePicker: false, // 是否显示时间选择器
    submitting: false // 是否正在提交
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    // 初始化数据中心
    if (!dataManager.isInitialized()) {
      dataManager.init()
    }
  },

  /**
   * 标题输入处理
   */
  onTitleInput(e) {
    this.setData({
      title: e.detail.value
    })
  },

  /**
   * 描述输入处理
   */
  onDescriptionInput(e) {
    this.setData({
      description: e.detail.value
    })
  },

  /**
   * 日期选择处理
   */
  onDateChange(e) {
    this.setData({
      remindDate: e.detail.value
    })
  },

  /**
   * 时间选择处理
   */
  onTimeChange(e) {
    this.setData({
      remindTime: e.detail.value
    })
  },

  /**
   * 创建提醒事项
   */
  async onCreateTodo() {
    const { title, description, remindDate, remindTime, submitting } = this.data

    // 防止重复提交
    if (submitting) {
      return
    }

    // 验证必填项
    if (!title.trim()) {
      wx.showToast({
        title: '请输入标题',
        icon: 'none'
      })
      return
    }

    if (!remindDate) {
      wx.showToast({
        title: '请选择提醒日期',
        icon: 'none'
      })
      return
    }

    // 合并日期和时间
    const remindDateTime = remindTime ? `${remindDate} ${remindTime}` : remindDate + ' 00:00'

    // 检查数据中心是否已初始化
    if (!dataManager.isInitialized()) {
      wx.showToast({
        title: '请稍候再试',
        icon: 'none'
      })
      return
    }

    // 先请求订阅消息权限
    try {
      const templateId = 'IiYABIcxdWwaAbqXPb71Yijw-iYMRlbRpghZCT58eQ8'
      const subscribeResult = await new Promise((resolve) => {
        wx.requestSubscribeMessage({
          tmplIds: [templateId],
          success: (res) => {
            resolve(res)
          },
          fail: (err) => {
            resolve(null)
          }
        })
      })

      // 即使用户拒绝订阅，也允许创建事项（只是不会收到消息）
      if (subscribeResult) {
        const status = subscribeResult[templateId]
        if (status === 'accept') {
          log.info('用户已接受订阅消息')
        } else if (status === 'reject') {
          log.info('用户拒绝订阅消息')
        }
      }
    } catch (error) {
      log.error('请求订阅权限失败: ' + error.message)
      // 订阅权限请求失败不影响创建事项
    }

    this.setData({
      submitting: true
    })

    wx.showLoading({
      title: '创建中...',
      mask: true
    })

    try {
      // 准备提交的数据
      const todoDataToSubmit = {
        title: title.trim(),
        description: description.trim(),
        remindAt: remindDateTime
      }
      
      // 创建提醒事项
      const success = await dataManager.createTodo(todoDataToSubmit)

      wx.hideLoading()

      if (success) {
        wx.showToast({
          title: '创建成功',
          icon: 'success'
        })

        // 清空表单
        this.setData({
          title: '',
          description: '',
          remindDate: '',
          remindTime: '',
          submitting: false
        })
      } else {
        wx.showToast({
          title: '创建失败',
          icon: 'none'
        })
        this.setData({
          submitting: false
        })
      }
    } catch (error) {
      wx.hideLoading()
      log.error('创建提醒事项异常: ' + JSON.stringify(error))
      wx.showToast({
        title: '创建失败',
        icon: 'none'
      })
      this.setData({
        submitting: false
      })
    }
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

