// pages/todo-edit/index.js - 编辑待办页面
const logger = require('../../logger')
const log = logger.create('todo-edit')
const dataManager = require('../../dataManager')
const dateUtils = require('../../utils/dateUtils')
const CONSTANTS = require('../../config/constants')

Page({
  /**
   * 页面的初始数据
   */
  data: {
    todoId: '', // 待办事项ID
    content: '', // 标题
    description: '', // 备注
    remindDate: '', // 提醒日期（yyyy-MM-dd格式）
    remindTime: '', // 提醒时间（HH:mm格式）
    selectedColor: CONSTANTS.TODO_DEFAULT_COLOR, // 选中的颜色索引
    colorOptions: Object.values(CONSTANTS.TODO_COLORS), // 从常量中获取颜色选项
    saveBtnStyle: '', // 完成按钮样式
    loading: false // 是否正在加载
  },

  /**
   * 生命周期函数--监听页面加载
   */
  async onLoad(options) {
    const { id } = options
    
    if (!id) {
      log.error('页面加载失败: id为空')
      wx.showToast({
        title: '参数错误',
        icon: 'none'
      })
      setTimeout(() => {
        wx.navigateBack()
      }, 1500)
      return
    }

    // 初始化数据中心
    if (!dataManager.isInitialized()) {
      await dataManager.init()
    }

    // 加载待办事项数据
    await this.loadTodoData(id)
  },

  /**
   * 加载待办事项数据
   */
  async loadTodoData(todoId) {
    this.setData({
      loading: true
    })

    try {
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

      // 解析提醒时间
      let remindDate = ''
      let remindTime = ''
      if (todo.remindAt) {
        remindDate = dateUtils.formatDateOnly(todo.remindAt)
        remindTime = dateUtils.formatTimeOnly(todo.remindAt)
      }

      // 解析颜色（使用默认颜色）
      const selectedColor = todo.color || CONSTANTS.TODO_DEFAULT_COLOR
      const colorConfig = CONSTANTS.TODO_COLORS[selectedColor]

      this.setData({
        todoId: todoId,
        content: todo.content || '',
        description: todo.description || '',
        remindDate: remindDate,
        remindTime: remindTime,
        selectedColor: selectedColor,
        saveBtnStyle: `background: ${colorConfig.gradient}; box-shadow: 0 4rpx 12rpx ${colorConfig.shadowColor};`,
        loading: false
      })
    } catch (error) {
      log.error('加载待办事项数据失败: ' + JSON.stringify(error))
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
   * 标题输入变化
   */
  onContentInput(e) {
    this.setData({
      content: e.detail.value
    })
  },

  /**
   * 备注输入变化
   */
  onDescriptionInput(e) {
    this.setData({
      description: e.detail.value
    })
  },

  /**
   * 选择提醒日期
   */
  onRemindDateChange(e) {
    this.setData({
      remindDate: e.detail.value
    })
  },

  /**
   * 选择提醒时间
   */
  onRemindTimeChange(e) {
    this.setData({
      remindTime: e.detail.value
    })
  },

  /**
   * 选择颜色
   */
  onColorSelect(e) {
    const { color } = e.currentTarget.dataset
    const colorConfig = CONSTANTS.TODO_COLORS[color]
    this.setData({
      selectedColor: color,
      saveBtnStyle: `background: ${colorConfig.gradient}; box-shadow: 0 4rpx 12rpx ${colorConfig.shadowColor};`
    })
  },

  /**
   * 保存待办事项
   */
  async onSave() {
    const { todoId, content, description, remindDate, remindTime, selectedColor } = this.data

    // 防止重复提交
    if (this._saving) {
      return
    }
    this._saving = true

    try {
      // 组合提醒时间
      let remindAt = null
      if (remindDate) {
        remindAt = dateUtils.combineDateAndTime(remindDate, remindTime)
      }

      // 准备更新数据
      const updateData = {
        content: content.trim(),
        description: description.trim(),
        remindAt: remindAt,
        color: selectedColor
      }

      wx.showLoading({
        title: '保存中...',
        mask: true
      })

      // 更新待办事项
      const success = await dataManager.updateTodo(todoId, updateData)

      wx.hideLoading()

      if (success) {
        wx.showToast({
          title: '保存成功',
          icon: 'success'
        })
        
        // 延迟返回，让用户看到成功提示
        setTimeout(() => {
          wx.navigateBack()
        }, 1500)
      } else {
        wx.showToast({
          title: '保存失败',
          icon: 'none'
        })
      }
    } catch (error) {
      wx.hideLoading()
      log.error('保存待办事项异常: ' + JSON.stringify(error))
      wx.showToast({
        title: '保存失败',
        icon: 'none'
      })
    } finally {
      this._saving = false
    }
  }
})

