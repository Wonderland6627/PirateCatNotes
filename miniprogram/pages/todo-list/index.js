// pages/todo-list/index.js - 待办列表页面
const logger = require('../../logger')
const log = logger.create('todo-list')
const dataManager = require('../../dataManager')
const CONSTANTS = require('../../config/constants')
const dateUtils = require('../../utils/dateUtils')
const commonUtils = require('../../utils/commonUtils')

Page({
  /**
   * 页面的初始数据
   */
  data: {
    todoList: [], // 待办列表
    loading: false, // 是否正在加载
    showCreateInput: false, // 是否显示创建输入框
    newTodoContent: '' // 新建待办的内容
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    // 初始化数据中心
    if (!dataManager.isInitialized()) {
      dataManager.init()
    }
    
    // 加载待办列表
    this.loadTodoList()
  },

  /**
   * 加载待办列表
   */
  async loadTodoList() {
    this.setData({
      loading: true
    })

    try {
      // 确保数据中心已初始化
      if (!dataManager.isInitialized()) {
        await dataManager.init()
      }

      // 获取待办列表
      const list = await dataManager.getTodoList()
      
      // 使用统一的排序和格式化方法
      const formattedList = this._sortAndFormatList(list)

      this.setData({
        todoList: formattedList,
        loading: false
      })
    } catch (error) {
      log.error('加载待办列表失败: ' + JSON.stringify(error))
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
   * 切换待办事项状态
   * @param {Object} e - 事件对象
   */
  async onToggleTodoStatus(e) {
    const { id, currentStatus } = e.currentTarget.dataset
    
    if (!id) {
      log.error('切换待办事项状态失败: id为空')
      return
    }

    // 防止重复点击
    if (this._togglingStatus) {
      return
    }
    this._togglingStatus = true

    try {
      // 确定新状态：如果当前是pending，则改为completed；否则改为pending
      const newStatus = currentStatus === CONSTANTS.TODO_STATUS.PENDING
        ? CONSTANTS.TODO_STATUS.COMPLETED
        : CONSTANTS.TODO_STATUS.PENDING

      // 更新数据库
      const success = await dataManager.updateTodoStatus(id, newStatus)

      if (success) {
        // 更新本地列表，避免重新加载整个列表
        this._updateLocalTodoStatus(id, newStatus)
        log.info('切换待办事项状态成功: ' + id + ' -> ' + newStatus)
      } else {
        wx.showToast({
          title: '操作失败',
          icon: 'none'
        })
      }
    } catch (error) {
      log.error('切换待办事项状态异常: ' + JSON.stringify(error))
      wx.showToast({
        title: '操作失败',
        icon: 'none'
      })
    } finally {
      this._togglingStatus = false
    }
  },

  /**
   * 更新本地待办事项状态（优化用户体验，避免重新加载整个列表）
   * @param {string} todoId - 待办事项ID
   * @param {string} newStatus - 新状态
   */
  _updateLocalTodoStatus(todoId, newStatus) {
    const { todoList } = this.data
    const updatedList = todoList.map(item => {
      if (item._id === todoId) {
        const isPending = newStatus === CONSTANTS.TODO_STATUS.PENDING
        const isCompleted = newStatus === CONSTANTS.TODO_STATUS.COMPLETED
        
        // 重新计算颜色索引（如果状态变为pending需要分配颜色）
        let newColorIndex = item.colorIndex
        if (isPending && item.colorIndex === 0) {
          // 需要重新分配颜色，找到pending的数量
          const pendingCount = todoList.filter(i => 
            i.status === CONSTANTS.TODO_STATUS.PENDING && i._id !== todoId
          ).length
          newColorIndex = (pendingCount % 4) + 1
        } else if (!isPending) {
          newColorIndex = 0
        }

        return {
          ...item,
          status: newStatus,
          isPending: isPending,
          isCompleted: isCompleted,
          colorIndex: newColorIndex
        }
      }
      return item
    })

    // 重新排序和格式化列表
    const sortedList = this._sortAndFormatList(updatedList.map(item => {
      // 恢复原始数据结构以便排序
      return {
        _id: item._id,
        content: item.content,
        description: item.description,
        remindAt: item.remindAt,
        status: item.status,
        createdAt: item.createdAt || new Date()
      }
    }))

    this.setData({
      todoList: sortedList
    })
  },

  /**
   * 排序和格式化列表（提取公共逻辑）
   * @param {Array} list - 原始列表
   * @returns {Array} 格式化后的列表
   */
  _sortAndFormatList(list) {
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
      const aRemindAt = a.remindAt ? dateUtils.safeParseDate(a.remindAt)?.getTime() || 0 : 0
      const bRemindAt = b.remindAt ? dateUtils.safeParseDate(b.remindAt)?.getTime() || 0 : 0
      
      if (aRemindAt !== bRemindAt) {
        return aRemindAt - bRemindAt  // 时间更早的在前
      }
      
      // 3. 如果提醒时间相同，按创建时间（createdAt）排序
      const aCreatedAt = a.createdAt ? dateUtils.safeParseDate(a.createdAt)?.getTime() || 0 : 0
      const bCreatedAt = b.createdAt ? dateUtils.safeParseDate(b.createdAt)?.getTime() || 0 : 0
      
      return aCreatedAt - bCreatedAt  // 创建更早的在前
    })
    
    // 格式化数据，添加颜色索引和分割线标识（只有pending状态才有颜色）
    let pendingIndex = 0
    return sortedList.map((item, index) => {
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
      
      // 处理content中的换行符，替换为空格以确保单行显示
      const displayContent = commonUtils.replaceNewlines(item.content || '', ' ')
      
      return {
        _id: item._id,
        content: displayContent,
        description: item.description,
        remindAt: item.remindAt ? dateUtils.formatDate(item.remindAt) : '',
        status: currentStatus,
        isPending: isPending,
        isCompleted: isCompleted,
        colorIndex: colorIndex,
        showDivider: showDivider,
        createdAt: item.createdAt
      }
    })
  },

  /**
   * 下拉刷新
   */
  onPullDownRefresh() {
    this.loadTodoList().then(() => {
      wx.stopPullDownRefresh()
    })
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    // 每次显示时刷新列表
    this.loadTodoList()
  },

  /**
   * 显示创建输入框
   */
  onShowCreateInput() {
    log.info('onShowCreateInput called, current showCreateInput: ' + this.data.showCreateInput)
    // 如果正在创建中，不允许打开
    if (this._creatingTodo) {
      log.info('Creating todo in progress, ignore')
      return
    }
    this.setData({
      showCreateInput: true,
      newTodoContent: ''
    }, () => {
      log.info('showCreateInput set to true')
    })
  },

  /**
   * 输入框内容变化
   */
  onInputChange(e) {
    this.setData({
      newTodoContent: e.detail.value
    })
  },

  /**
   * 取消创建
   */
  onCancelCreate() {
    this.setData({
      showCreateInput: false,
      newTodoContent: ''
    })
  },

  /**
   * 点击待办事项（跳转到编辑页面）
   * @param {Object} e - 事件对象
   */
  onTodoItemTap(e) {
    const { id } = e.currentTarget.dataset
    
    if (!id) {
      log.error('跳转失败: id为空')
      return
    }

    // 跳转到编辑页面
    wx.navigateTo({
      url: `/pages/todo-edit/index?id=${id}`
    })
  },

  /**
   * 完成创建待办
   */
  async onCreateTodoComplete() {
    log.info('onCreateTodoComplete called')
    const { newTodoContent, showCreateInput } = this.data
    log.info('newTodoContent: ' + newTodoContent + ', showCreateInput: ' + showCreateInput)

    // 如果没有内容，关闭输入框
    if (!newTodoContent || !newTodoContent.trim()) {
      log.info('Content is empty, closing input')
      this.setData({
        showCreateInput: false,
        newTodoContent: ''
      })
      return
    }

    // 防止重复提交
    if (this._creatingTodo) {
      return
    }
    this._creatingTodo = true

    // 检查数据中心是否已初始化
    if (!dataManager.isInitialized()) {
      await dataManager.init()
    }

    wx.showLoading({
      title: '创建中...',
      mask: true
    })

    try {
      // 准备提交的数据（简化版本，只需要content，remindAt可以为空）
      const todoDataToSubmit = {
        content: newTodoContent.trim(),
        description: '',
        remindAt: null // 快速创建不设置提醒时间
      }
      
      // 创建待办事项
      const success = await dataManager.createTodo(todoDataToSubmit)

      wx.hideLoading()

      if (success) {
        // 刷新列表
        await this.loadTodoList()

        // 关闭输入框并清空内容
        this.setData({
          showCreateInput: false,
          newTodoContent: ''
        })

        wx.showToast({
          title: '创建成功',
          icon: 'success'
        })
      } else {
        wx.showToast({
          title: '创建失败',
          icon: 'none'
        })
      }
    } catch (error) {
      wx.hideLoading()
      log.error('创建待办事项异常: ' + JSON.stringify(error))
      wx.showToast({
        title: '创建失败',
        icon: 'none'
      })
    } finally {
      this._creatingTodo = false
    }
  }
})

