// pages/todo-detail/index.js - 待办事项详情页面
const logger = require('../../logger')
const log = logger.create('todo-detail')
const dataManager = require('../../dataManager')
const dateUtils = require('../../utils/dateUtils')
const CONSTANTS = require('../../config/constants')

Page({
  /**
   * 页面的初始数据
   */
  data: {
    todoId: '', // 待办事项ID
    loading: false, // 是否正在加载
    todo: null, // 待办事项详情
    content: '', // 内容
    description: '', // 事项描述
    remindAt: '', // 提醒时间（格式化后的字符串）
    remindDate: '', // 提醒日期（格式化）
    remindTime: '', // 提醒时间（格式化）
    status: '', // 状态
    createdAt: '', // 创建时间（格式化）
    updatedAt: '' // 更新时间（格式化）
  },

  /**
   * 生命周期函数--监听页面加载
   */
  async onLoad(options) {
    // 初始化数据中心
    if (!dataManager.isInitialized()) {
      await dataManager.init()
    }

    // 获取传入的todoId
    const todoId = options.id || options.todoId
    if (!todoId) {
      log.error('页面加载失败: 缺少todoId参数')
      wx.showToast({
        title: '参数错误',
        icon: 'none'
      })
      setTimeout(() => {
        wx.navigateBack()
      }, 1500)
      return
    }

    this.setData({
      todoId: todoId
    })

    // 加载待办事项详情
    await this.loadTodoDetail()
  },

  /**
   * 加载待办事项详情
   */
  async loadTodoDetail() {
    const { todoId } = this.data

    if (!todoId) {
      return
    }

    this.setData({
      loading: true
    })

    try {
      // 确保数据中心已初始化
      if (!dataManager.isInitialized()) {
        await dataManager.init()
      }

      // 获取待办事项详情
      const todo = await dataManager.getTodoById(todoId)

      if (!todo) {
        wx.showToast({
          title: '待办事项不存在',
          icon: 'none'
        })
        setTimeout(() => {
          wx.navigateBack()
        }, 1500)
        return
      }

      // 格式化日期时间
      const remindAtDate = todo.remindAt ? dateUtils.safeParseDate(todo.remindAt) : null
      const remindDate = remindAtDate ? dateUtils.formatDateOnly(remindAtDate) : ''
      const remindTime = remindAtDate ? dateUtils.formatTimeOnly(remindAtDate) : ''
      const remindAtFormatted = remindAtDate ? dateUtils.formatDate(remindAtDate) : ''

      const createdAtDate = todo.createdAt ? dateUtils.safeParseDate(todo.createdAt) : null
      const createdAtFormatted = createdAtDate ? dateUtils.formatDate(createdAtDate) : ''

      const updatedAtDate = todo.updatedAt ? dateUtils.safeParseDate(todo.updatedAt) : null
      const updatedAtFormatted = updatedAtDate ? dateUtils.formatDate(updatedAtDate) : ''

      this.setData({
        todo: todo,
        content: todo.content || '',
        description: todo.description || '',
        remindAt: remindAtFormatted,
        remindDate: remindDate,
        remindTime: remindTime,
        status: todo.status || CONSTANTS.TODO_STATUS.PENDING,
        createdAt: createdAtFormatted,
        updatedAt: updatedAtFormatted,
        loading: false
      })

      log.info('加载待办事项详情成功: ' + todoId)
    } catch (error) {
      log.error('加载待办事项详情失败: ' + JSON.stringify(error))
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
   * 生命周期函数--监听页面显示
   */
  onShow() {
    // 每次显示时刷新详情（可能从编辑页面返回）
    if (this.data.todoId) {
      this.loadTodoDetail()
    }
  },

  /**
   * 下拉刷新
   */
  onPullDownRefresh() {
    this.loadTodoDetail().then(() => {
      wx.stopPullDownRefresh()
    })
  }
})

