// pages/notification-manage/index.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    // 接受通知开关
    receiveNotifications: true,
    // 待办事项提醒选项：0-不接收, 1-接收, 2-接收并提醒
    todoReminderOption: 1,
    // 当前选中的待办事项提醒选项文本
    currentTodoReminderLabel: '接收',
    // 待办事项提醒选项列表
    todoReminderOptions: [
      { value: 0, label: '不接收' },
      { value: 1, label: '接收' },
      { value: 2, label: '接收并提醒' }
    ],
    // 是否显示待办事项提醒下拉菜单
    showTodoReminderPicker: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    // 从本地存储加载设置
    this.loadSettings()
  },

  /**
   * 从本地存储加载设置
   */
  loadSettings() {
    try {
      const receiveNotifications = wx.getStorageSync('receiveNotifications')
      const todoReminderOption = wx.getStorageSync('todoReminderOption')
      
      if (receiveNotifications !== '') {
        this.setData({
          receiveNotifications: receiveNotifications
        })
      }
      
      if (todoReminderOption !== '') {
        const option = this.data.todoReminderOptions.find(
          item => item.value === todoReminderOption
        )
        this.setData({
          todoReminderOption: todoReminderOption,
          currentTodoReminderLabel: option ? option.label : '接收'
        })
      } else {
        // 初始化当前标签
        const option = this.data.todoReminderOptions.find(
          item => item.value === this.data.todoReminderOption
        )
        this.setData({
          currentTodoReminderLabel: option ? option.label : '接收'
        })
      }
    } catch (error) {
      console.error('Load settings error:', error)
    }
  },

  /**
   * 保存设置到本地存储
   */
  saveSettings() {
    try {
      wx.setStorageSync('receiveNotifications', this.data.receiveNotifications)
      wx.setStorageSync('todoReminderOption', this.data.todoReminderOption)
    } catch (error) {
      console.error('Save settings error:', error)
    }
  },

  /**
   * 切换接受通知开关
   */
  onToggleReceiveNotifications(e) {
    const value = e.detail.value
    this.setData({
      receiveNotifications: value
    })
    this.saveSettings()
  },

  /**
   * 显示待办事项提醒选择器
   */
  onShowTodoReminderPicker() {
    this.setData({
      showTodoReminderPicker: true
    })
  },

  /**
   * 隐藏待办事项提醒选择器
   */
  onHideTodoReminderPicker() {
    this.setData({
      showTodoReminderPicker: false
    })
  },

  /**
   * 选择待办事项提醒选项
   */
  onSelectTodoReminderOption(e) {
    const option = e.currentTarget.dataset.option
    this.setData({
      todoReminderOption: option.value,
      currentTodoReminderLabel: option.label,
      showTodoReminderPicker: false
    })
    this.saveSettings()
  },

  /**
   * 阻止事件冒泡
   */
  onStopPropagation() {
    // 阻止事件冒泡，防止点击内容区域时关闭下拉菜单
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

