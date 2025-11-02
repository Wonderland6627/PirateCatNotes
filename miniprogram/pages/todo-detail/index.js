// pages/todo-detail/index.js - 待办事项详情页面
const logger = require('../../logger')
const log = logger.create('todo-detail')
const dataManager = require('../../dataManager')
const dateUtils = require('../../utils/dateUtils')
const CONSTANTS = require('../../config/constants')
const fieldConfig = require('../../config/todoFieldConfig')
const subscribeMessageUtils = require('../../utils/subscribeMessageUtils')

Page({
  /**
   * 页面的初始数据
   */
  data: {
    // 页面状态
    todoId: '', // 待办事项ID
    loading: false, // 是否正在加载
    isFirstLoad: true, // 是否首次加载
    
    // 数据库原始数据
    todoData: {
      _id: '',
      content: '',
      description: '',
      remindAt: null, // Date对象或null
      status: '',
      creatorOpenID: '',
      createdAt: null,
      updatedAt: null
    },
    
    // 格式化后的显示数据
    todoFormatted: {
      remindAt: '', // 格式化后的完整日期时间字符串
      remindDate: '', // 日期部分 yyyy-MM-dd
      remindTime: '' // 时间部分 HH:mm
    },
    
    // 当前日期时间（用于picker默认值）
    currentDate: '', // 当前日期 yyyy-MM-dd
    currentTime: '', // 当前时间 HH:mm
    defaultTime: '', // 默认时间（用于时间选择器，如果选择的日期是今天则为下一分钟）
    
    // UI配置和状态
    fieldConfig: [], // 字段配置列表
    // 字段开关状态
    contentOpen: false, // 标题开关
    descriptionOpen: false, // 事项描述开关
    remindAtOpen: false, // 提醒时间开关
    statusOpen: false, // 状态开关
    // 变更检测
    originalTodoData: null, // 原始数据快照，用于检测变更
    hasChanges: false, // 是否有变更
    saving: false // 是否正在保存
  },

  /**
   * 生命周期函数--监听页面加载
   */
  async onLoad(options) {
    // 初始化当前日期时间
    const now = new Date()
    const currentDate = dateUtils.formatDateOnly(now)
    const currentTime = dateUtils.formatTimeOnly(now)
    
    // 计算默认时间（下一分钟）
    const nextMinute = new Date(now.getTime() + 60 * 1000)
    const defaultTime = dateUtils.formatTimeOnly(nextMinute)
    
    this.setData({
      currentDate: currentDate,
      currentTime: currentTime,
      defaultTime: defaultTime
    })
    
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
      todoId: todoId,
      isFirstLoad: true
    })

    // 加载待办事项详情
    await this.loadTodoDetail()
    
    // 标记首次加载完成
    this.setData({
      isFirstLoad: false
    })
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

      // 获取可见字段配置
      const visibleFields = fieldConfig.getVisibleFields()
      
      // 字段值提取器映射：根据字段key提取对应的值（从todoData）
      const fieldValueExtractors = {
        content: () => todo.content || '',
        description: () => todo.description || '',
        remindAt: () => remindAtFormatted,
        status: () => todo.status || CONSTANTS.TODO_STATUS.PENDING
      }
      
      // 字段数据检查器映射：检查字段是否有数据
      const fieldDataCheckers = {
        description: () => !!(todo.description && todo.description.trim()),
        remindAt: () => !!remindAtFormatted
      }
      
      // 使用reduce函数式地构建fieldStates和fieldData
      const { fieldStates, fieldData } = visibleFields.reduce((acc, field) => {
        const fieldKey = field.key
        
        // 提取字段值
        const extractor = fieldValueExtractors[fieldKey]
        if (extractor) {
          acc.fieldData[fieldKey] = extractor()
        }
        
        // 设置字段开关状态
        if (field.required) {
          // 必填字段默认打开
          acc.fieldStates[fieldKey + 'Open'] = true
        } else {
          // 可选字段：有数据则打开，无数据则关闭
          const checker = fieldDataCheckers[fieldKey]
          acc.fieldStates[fieldKey + 'Open'] = checker ? checker() : false
        }
        
        return acc
      }, { fieldStates: {}, fieldData: {} })
      
      // 保存原始数据快照，用于检测变更
      const originalTodoData = {
        content: todo.content || '',
        description: todo.description || '',
        remindAt: remindAtDate, // Date对象或null
        status: todo.status || CONSTANTS.TODO_STATUS.PENDING
      }
      
      // 更新数据：分离数据库数据和格式化数据
      this.setData({
        todoData: {
          _id: todo._id || '',
          content: todo.content || '',
          description: todo.description || '',
          remindAt: remindAtDate, // 保存Date对象
          status: todo.status || CONSTANTS.TODO_STATUS.PENDING,
          creatorOpenID: todo.creatorOpenID || '',
          createdAt: todo.createdAt || null,
          updatedAt: todo.updatedAt || null
        },
        todoFormatted: {
          remindAt: remindAtFormatted,
          remindDate: remindDate,
          remindTime: remindTime
        },
        fieldConfig: visibleFields.map(field => ({
          ...field,
          value: fieldData[field.key] || '',
          isOpen: fieldStates[field.key + 'Open'] || false
        })),
        ...fieldStates,
        loading: false,
        // 保存原始数据快照用于变更检测
        originalTodoData: originalTodoData,
        hasChanges: false // 是否有变更
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
    // 如果不是首次加载，则刷新详情（可能从编辑页面返回或其他页面返回）
    if (this.data.todoId && !this.data.isFirstLoad) {
      this.loadTodoDetail()
    }
  },

  /**
   * 切换字段开关状态
   */
  onToggleField(e) {
    const field = e.currentTarget.dataset.field
    
    // content字段是必填字段，不允许关闭
    if (field === 'content') {
      return
    }
    
    // status字段是只读字段，不允许切换
    if (field === 'status') {
      return
    }
    
    const currentState = this.data[field + 'Open']
    const newState = !currentState
    
    // 更新字段开关状态
    this.setData({
      [field + 'Open']: newState
    })
    
    // 同步更新fieldConfig中的isOpen状态
    const fieldConfig = this.data.fieldConfig || []
    const updatedFieldConfig = fieldConfig.map(item => {
      if (item.key === field) {
        return { ...item, isOpen: newState }
      }
      return item
    })
    this.setData({
      fieldConfig: updatedFieldConfig
    })
  },

  /**
   * 根据提醒时间自动计算状态
   * @param {Date|null} remindAt - 提醒时间
   * @param {string} currentStatus - 当前状态（用于参考，不影响计算结果）
   * @returns {string} 计算后的状态
   */
  calculateStatus(remindAt, currentStatus) {
    // 如果没有提醒时间，默认为待提醒
    if (!remindAt) {
      return CONSTANTS.TODO_STATUS.PENDING
    }
    
    const now = new Date()
    const remindTime = remindAt.getTime()
    const nowTime = now.getTime()
    
    // 提醒时间在未来 -> 待提醒（复用任务，重新开始）
    if (remindTime > nowTime) {
      return CONSTANTS.TODO_STATUS.PENDING
    }
    
    // 提醒时间在过去 -> 已提醒
    if (remindTime <= nowTime) {
      return CONSTANTS.TODO_STATUS.REMINDED
    }
    
    // 默认返回待提醒
    return CONSTANTS.TODO_STATUS.PENDING
  },

  /**
   * 检查数据是否有变更
   */
  checkChanges() {
    const { todoData, originalTodoData } = this.data
    if (!originalTodoData) {
      return false
    }
    
    // 比较各个字段
    const contentChanged = todoData.content !== originalTodoData.content
    const descriptionChanged = todoData.description !== originalTodoData.description
    const statusChanged = todoData.status !== originalTodoData.status
    
    // 比较remindAt（Date对象需要特殊处理）
    let remindAtChanged = false
    if (todoData.remindAt && originalTodoData.remindAt) {
      // 两个都是Date对象，比较时间戳
      remindAtChanged = todoData.remindAt.getTime() !== originalTodoData.remindAt.getTime()
    } else {
      // 一个为null，另一个不为null，则变更了
      remindAtChanged = todoData.remindAt !== originalTodoData.remindAt
    }
    
    const hasChanges = contentChanged || descriptionChanged || remindAtChanged || statusChanged
    this.setData({
      hasChanges: hasChanges
    })
    
    return hasChanges
  },

  /**
   * 文本输入处理
   */
  onTextInput(e) {
    const field = e.currentTarget.dataset.field
    const value = e.detail.value
    // 更新todoData中的对应字段
    this.setData({
      [`todoData.${field}`]: value
    }, () => {
      // 检查变更
      this.checkChanges()
    })
  },

  /**
   * 日期选择处理
   */
  onDateChange(e) {
    const { todoFormatted, fieldConfig, defaultTime, currentDate } = this.data
    const dateStr = e.detail.value
    const now = new Date()
    
    // 如果选择的日期是今天，且没有时间值，使用下一分钟
    // 如果选择的日期是未来，且没有时间值，使用当前时间
    let timeStr = todoFormatted.remindTime
    if (!timeStr) {
      if (dateStr === currentDate) {
        // 选择的是今天，使用下一分钟
        timeStr = defaultTime
      } else {
        // 选择的是未来日期，使用当前时间
        timeStr = dateUtils.formatTimeOnly(now)
      }
    } else {
      // 如果已有时间值，但选择的日期是今天，需要校验时间不能早于当前时间
      if (dateStr === currentDate) {
        const testTime = dateUtils.combineDateAndTime(dateStr, timeStr)
        if (testTime && testTime <= now) {
          // 时间早于或等于当前时间，使用下一分钟
          timeStr = defaultTime
          wx.showToast({
            title: '已自动调整为下一分钟',
            icon: 'none',
            duration: 1500
          })
        }
      }
    }
    
    // 更新提醒时间
    const remindAt = dateUtils.combineDateAndTime(dateStr, timeStr)
    if (remindAt) {
      const formattedTime = timeStr || dateUtils.formatTimeOnly(remindAt)
      this.updateRemindAt(remindAt, fieldConfig, formattedTime)
    }
  },

  /**
   * 时间选择处理
   */
  onTimeChange(e) {
    const { todoFormatted, fieldConfig, currentDate } = this.data
    const timeStr = e.detail.value
    // 如果没有日期，使用当前日期
    const now = new Date()
    const dateStr = todoFormatted.remindDate || dateUtils.formatDateOnly(now)
    
    // 如果选择的日期是今天，需要校验时间不能早于当前时间
    if (dateStr === currentDate) {
      const selectedTime = dateUtils.combineDateAndTime(dateStr, timeStr)
      if (selectedTime && selectedTime <= now) {
        wx.showToast({
          title: '提醒时间必须晚于当前时间',
          icon: 'none',
          duration: 2000
        })
        // 自动设置为下一分钟
        const nextMinute = new Date(now.getTime() + 60 * 1000)
        const nextMinuteTime = dateUtils.formatTimeOnly(nextMinute)
        this.setData({
          'todoFormatted.remindTime': nextMinuteTime
        })
        // 使用下一分钟的时间继续处理
        const remindAt = dateUtils.combineDateAndTime(dateStr, nextMinuteTime)
        if (remindAt) {
          this.updateRemindAt(remindAt, fieldConfig)
        }
        return
      }
    }
    
    // 更新提醒时间
    const remindAt = dateUtils.combineDateAndTime(dateStr, timeStr)
    if (remindAt) {
      this.updateRemindAt(remindAt, fieldConfig, timeStr)
    }
  },

  /**
   * 更新提醒时间的统一方法
   * @param {Date} remindAt - 提醒时间Date对象
   * @param {Array} fieldConfig - 字段配置
   * @param {string} timeStr - 时间字符串（用于更新todoFormatted.remindTime）
   */
  updateRemindAt(remindAt, fieldConfig, timeStr = null) {
    const { todoData } = this.data
    const formatted = dateUtils.formatDate(remindAt)
    const formattedDate = dateUtils.formatDateOnly(remindAt)
    const formattedTime = timeStr || dateUtils.formatTimeOnly(remindAt)
    
    // 同步更新fieldConfig中的状态
    const updatedFieldConfig = (fieldConfig || []).map(item => {
      if (item.key === 'remindAt') {
        return { ...item, isOpen: true, value: formatted }
      }
      return item
    })
    
    // 根据提醒时间自动计算状态
    const newStatus = this.calculateStatus(remindAt, todoData.status)
    
    // 同步更新状态相关的fieldConfig
    const updatedFieldConfigWithStatus = updatedFieldConfig.map(item => {
      if (item.key === 'status') {
        return { ...item, value: newStatus }
      }
      return item
    })
    
    // 更新todoData对象（需要完整更新以确保视图刷新）
    const updatedTodoData = {
      ...todoData,
      remindAt: remindAt,
      status: newStatus
    }
    
    // 更新todoData和todoFormatted
    this.setData({
      todoData: updatedTodoData,
      'todoFormatted.remindAt': formatted,
      'todoFormatted.remindDate': formattedDate,
      'todoFormatted.remindTime': formattedTime,
      remindAtOpen: true,
      fieldConfig: updatedFieldConfigWithStatus
    }, () => {
      // 检查变更
      this.checkChanges()
    })
  },


  /**
   * 重新启用待办事项
   */
  onReactivate() {
    const { todoData, todoFormatted } = this.data
    
    // 如果已有提醒时间，保持原提醒时间；否则设置为明天
    let newRemindAt = todoData.remindAt
    if (!newRemindAt) {
      // 设置为明天当前时间
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      newRemindAt = tomorrow
    }
    
    // 格式化新的提醒时间
    const formatted = dateUtils.formatDate(newRemindAt)
    const formattedDate = dateUtils.formatDateOnly(newRemindAt)
    const formattedTime = dateUtils.formatTimeOnly(newRemindAt)
    
    // 更新todoData，状态改为pending
    const updatedTodoData = {
      ...todoData,
      status: CONSTANTS.TODO_STATUS.PENDING,
      remindAt: newRemindAt
    }
    
    // 更新数据
    this.setData({
      todoData: updatedTodoData,
      todoFormatted: {
        remindAt: formatted,
        remindDate: formattedDate,
        remindTime: formattedTime
      },
      remindAtOpen: true, // 打开提醒时间开关
      // 更新原始数据快照，因为状态变化了
      originalTodoData: {
        content: todoData.content,
        description: todoData.description || '',
        remindAt: newRemindAt,
        status: CONSTANTS.TODO_STATUS.PENDING
      },
      hasChanges: true // 标记为有变更
    }, () => {
      // 检查变更
      this.checkChanges()
    })
  },

  /**
   * 保存待办事项
   */
  async onSave() {
    const { todoId, todoData, hasChanges, saving } = this.data
    
    // 如果没有变更或正在保存，则不允许保存
    if (!hasChanges || saving) {
      return
    }
    
    // 验证必填字段
    if (!todoData.content || !todoData.content.trim()) {
      wx.showToast({
        title: '请输入标题',
        icon: 'none'
      })
      return
    }
    
    this.setData({
      saving: true
    })
    
    try {
      // 如果提醒时间在未来，需要申请订阅消息权限
      if (todoData.remindAt && todoData.remindAt instanceof Date) {
        const now = new Date()
        const remindTime = todoData.remindAt.getTime()
        const nowTime = now.getTime()
        
        // 提醒时间在未来，需要申请权限
        if (remindTime > nowTime) {
          const permissionResult = await subscribeMessageUtils.checkAndRequestPermission()
          if (!permissionResult.success) {
            // 用户拒绝或失败，但不阻止保存（用户可能只是想保存数据）
            log.warn('订阅消息权限申请失败: ' + permissionResult.message)
            // 如果是总开关关闭，给用户更明确的提示
            if (permissionResult.needOpenMainSwitch) {
              wx.showModal({
                title: '开启订阅消息',
                content: '需要开启订阅消息功能才能接收提醒。请在微信设置中开启订阅消息总开关。',
                showCancel: false
              })
            } else {
              wx.showToast({
                title: permissionResult.message || '需要订阅权限才能接收提醒',
                icon: 'none',
                duration: 2000
              })
            }
          }
        }
      }
      
      // 准备要保存的数据
      const updateData = {
        content: todoData.content,
        description: todoData.description || '',
        remindAt: todoData.remindAt,
        status: todoData.status
      }
      
      // 调用dataManager更新
      const success = await dataManager.updateTodo(todoId, updateData)
      
      if (success) {
        wx.showToast({
          title: '保存成功',
          icon: 'success'
        })
        
        // 更新原始数据快照
        this.setData({
          originalTodoData: {
            content: todoData.content,
            description: todoData.description || '',
            remindAt: todoData.remindAt,
            status: todoData.status
          },
          hasChanges: false
        })
        
        // 重新加载详情以确保数据同步
        await this.loadTodoDetail()
      } else {
        wx.showToast({
          title: '保存失败',
          icon: 'none'
        })
      }
    } catch (error) {
      log.error('保存待办事项失败: ' + JSON.stringify(error))
      wx.showToast({
        title: '保存失败',
        icon: 'none'
      })
    } finally {
      this.setData({
        saving: false
      })
    }
  }
})

