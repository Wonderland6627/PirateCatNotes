// pages/reminder-list/index.js - 提醒列表页面
const logger = require('../../logger')
const log = logger.create('reminder-list')
const dataManager = require('../../utils/dataManager')

Page({
  /**
   * 页面的初始数据
   */
  data: {
    reminderList: [], // 提醒列表
    loading: false // 是否正在加载
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    // 初始化数据中心
    if (!dataManager.isInitialized()) {
      dataManager.init()
    }
    
    // 加载提醒列表
    this.loadReminderList()
  },

  /**
   * 加载提醒列表
   */
  async loadReminderList() {
    this.setData({
      loading: true
    })

    try {
      // 确保数据中心已初始化
      if (!dataManager.isInitialized()) {
        await dataManager.init()
      }

      // 获取提醒列表
      const list = await dataManager.getTodoList()
      
      // 格式化数据，添加颜色索引
      const formattedList = list.map((item, index) => ({
        _id: item._id,
        title: item.title,
        description: item.description,
        remindAt: item.remindAt ? this.formatDate(item.remindAt) : '',
        status: item.status || 'pending',
        isCompleted: item.status === 'completed',
        colorIndex: (index % 4) + 1  // 循环使用4种颜色
      }))

      this.setData({
        reminderList: formattedList,
        loading: false
      })
    } catch (error) {
      log.error('加载提醒列表失败: ' + JSON.stringify(error))
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      })
      this.setData({
        loading: false
      })
    }
  },

  /**
   * 格式化日期
   */
  formatDate(dateStr) {
    if (!dateStr) return ''
    
    // 如果是字符串，直接返回
    if (typeof dateStr === 'string') {
      return dateStr
    }
    
    // 如果是 Date 对象或时间戳
    const date = new Date(dateStr)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hour = String(date.getHours()).padStart(2, '0')
    const minute = String(date.getMinutes()).padStart(2, '0')
    
    return `${year}-${month}-${day} ${hour}:${minute}`
  },

  /**
   * 下拉刷新
   */
  onPullDownRefresh() {
    this.loadReminderList().then(() => {
      wx.stopPullDownRefresh()
    })
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    // 每次显示时刷新列表
    this.loadReminderList()
  }
})

