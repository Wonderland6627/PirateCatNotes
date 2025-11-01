// pages/todo-list/index.js - 待办列表页面
const logger = require('../../logger')
const log = logger.create('todo-list')
const dataManager = require('../../dataManager')
const CONSTANTS = require('../../config/constants')

Page({
  /**
   * 页面的初始数据
   */
  data: {
    todoList: [], // 待办列表
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
      
      return {
        _id: item._id,
        content: item.content,
        description: item.description,
        remindAt: item.remindAt ? this.formatDate(item.remindAt) : '',
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
  }
})

