// pages/reminder-list/index.js - 提醒列表页面
const logger = require('../../logger')
const log = logger.create('reminder-list')
const dataManager = require('../../utils/dataManager')
const CONSTANTS = require('../../config/constants')

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
      
      // 排序：按状态（pending在前）、临近时间、创建时间排序
      const sortedList = [...list].sort((a, b) => {
        const aStatus = a.status || CONSTANTS.TODO_STATUS.PENDING
        const bStatus = b.status || CONSTANTS.TODO_STATUS.PENDING
        const aIsPending = aStatus === CONSTANTS.TODO_STATUS.PENDING
        const bIsPending = bStatus === CONSTANTS.TODO_STATUS.PENDING
        
        // 1. 首先按是否pending排序：pending在前
        if (aIsPending !== bIsPending) {
          return aIsPending ? -1 : 1  // pending在前
        }
        
        // 2. 如果状态相同，按临近时间（remindAt）排序
        const aRemindAt = a.remindAt ? new Date(a.remindAt).getTime() : 0
        const bRemindAt = b.remindAt ? new Date(b.remindAt).getTime() : 0
        
        if (aRemindAt !== bRemindAt) {
          return aRemindAt - bRemindAt  // 时间更早的在前
        }
        
        // 3. 如果提醒时间相同，按创建时间（createdAt）排序
        const aCreatedAt = a.createdAt ? new Date(a.createdAt).getTime() : 0
        const bCreatedAt = b.createdAt ? new Date(b.createdAt).getTime() : 0
        
        return aCreatedAt - bCreatedAt  // 创建更早的在前
      })
      
      // 格式化数据，添加颜色索引和分割线标识（只有pending状态才有颜色）
      let pendingIndex = 0
      const formattedList = sortedList.map((item, index) => {
        const currentStatus = item.status || CONSTANTS.TODO_STATUS.PENDING
        const isPending = currentStatus === CONSTANTS.TODO_STATUS.PENDING
        const isCompleted = currentStatus === CONSTANTS.TODO_STATUS.COMPLETED
        
        // 只有pending状态才分配颜色
        const colorIndex = isPending ? ((pendingIndex++ % 4) + 1) : 0
        
        // 判断是否需要显示分割线：当前项不是pending，但前一项是pending
        let showDivider = false
        if (!isPending && index > 0) {
          const prevStatus = sortedList[index - 1].status || CONSTANTS.TODO_STATUS.PENDING
          const prevIsPending = prevStatus === CONSTANTS.TODO_STATUS.PENDING
          if (prevIsPending) {
            showDivider = true
          }
        }
        
        return {
          _id: item._id,
          title: item.title,
          description: item.description,
          remindAt: item.remindAt ? this.formatDate(item.remindAt) : '',
          status: currentStatus,
          isPending: isPending,
          isCompleted: isCompleted,
          colorIndex: colorIndex,
          showDivider: showDivider
        }
      })

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

