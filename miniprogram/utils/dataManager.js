// utils/dataManager.js
const logger = require('../logger')
const CONSTANTS = require('../config/constants')

// 创建带标签的 logger
const log = logger.create('dataManager')

/**
 * 数据中心 - 管理本地和数据库之间的数据同步
 */
class DataManager {
  constructor() {
    this._openid = null
    this._userInfo = null
    this._isInitialized = false
    this._initPromise = null
  }

  /**
   * 初始化数据中心
   * 在 app.js 中调用，启动时获取 openid 等基础信息
   */
  async init() {
    if (this._initPromise) {
      return this._initPromise
    }

    this._initPromise = this._doInit()
    return this._initPromise
  }

  /**
   * 执行初始化
   */
  async _doInit() {
    try {
      // 获取用户的 openid
      const loginResult = await wx.cloud.callFunction({
        name: CONSTANTS.CLOUD_FUNCTION.GET_WX_CONTEXT
      })
      
      if (loginResult.result.openid) {
        this._openid = loginResult.result.openid
        log.info('数据中心初始化成功，openid: ' + this._openid)
        
        // 初始化用户信息到数据库
        await this.initUserRecord()
        
        this._isInitialized = true
        return true
      }
      return false
    } catch (error) {
      log.error('数据中心初始化失败: ' + JSON.stringify(error))
      return false
    }
  }

  /**
   * 获取 openid（内部缓存）
   */
  getOpenid() {
    return this._openid
  }

  /**
   * 检查是否已初始化
   */
  isInitialized() {
    return this._isInitialized
  }

  /**
   * 初始化用户记录到数据库
   */
  async initUserRecord() {
    try {
      const db = wx.cloud.database()
      const userCollection = db.collection(CONSTANTS.COLLECTION.USER)
      
      // 查询用户是否存在
      const queryResult = await userCollection.where({
        _openid: this._openid
      }).get()
      
      // 如果用户不存在，创建未注册用户记录
      if (queryResult.data.length === 0) {
        await userCollection.add({
          data: {
            nickName: null,
            avatarUrl: null
          }
        })
        log.info('创建未注册用户记录')
      } else {
        log.info('用户已存在')
      }
    } catch (error) {
      log.error('初始化用户记录失败: ' + JSON.stringify(error))
    }
  }

  /**
   * 获取用户信息
   * @param {boolean} forceRefresh - 是否强制从数据库刷新
   * @returns {Promise<Object>} 用户信息
   */
  async getUserInfo(forceRefresh = false) {
    // 如果已缓存且不强制刷新，返回缓存数据
    if (this._userInfo && !forceRefresh) {
      return this._userInfo
    }

    try {
      const db = wx.cloud.database()
      const userCollection = db.collection(CONSTANTS.COLLECTION.USER)
      
      const queryResult = await userCollection.where({
        _openid: this._openid
      }).get()
      
      if (queryResult.data.length > 0) {
        const dbUserInfo = queryResult.data[0]
        
        this._userInfo = {
          nickName: dbUserInfo.nickName || '',
          avatarUrl: dbUserInfo.avatarUrl || '',
          isRegistered: !!dbUserInfo.nickName  // 只判断是否有昵称
        }
        
        // 如果已注册，同步到本地存储
        if (this._userInfo.isRegistered) {
          wx.setStorageSync(CONSTANTS.STORAGE_KEY.USER_INFO, {
            nickName: this._userInfo.nickName,
            avatarUrl: this._userInfo.avatarUrl
          })
        }
        
        return this._userInfo
      }
      
      return null
    } catch (error) {
      log.error('获取用户信息失败: ' + JSON.stringify(error))
      // 失败则尝试从本地存储加载
      const localUserInfo = wx.getStorageSync(CONSTANTS.STORAGE_KEY.USER_INFO)
      if (localUserInfo) {
        this._userInfo = {
          ...localUserInfo,
          isRegistered: true
        }
        return this._userInfo
      }
      return null
    }
  }

  /**
   * 保存用户信息
   * @param {Object} userInfo - 用户信息 { nickName, avatarUrl }
   * @returns {Promise<boolean>} 是否保存成功
   */
  async saveUserInfo(userInfo) {
    try {
      const db = wx.cloud.database()
      const userCollection = db.collection(CONSTANTS.COLLECTION.USER)
      
      // 查询用户是否存在
      const queryResult = await userCollection.where({
        _openid: this._openid
      }).get()
      
      if (queryResult.data.length > 0) {
        const docId = queryResult.data[0]._id
        await userCollection.doc(docId).update({
          data: {
            nickName: userInfo.nickName,
            avatarUrl: userInfo.avatarUrl
          }
        })
        
        // 更新缓存
        this._userInfo = {
          nickName: userInfo.nickName,
          avatarUrl: userInfo.avatarUrl,
          isRegistered: !!userInfo.nickName  // 只判断是否有昵称
        }
        
        // 同步到本地存储
        wx.setStorageSync(CONSTANTS.STORAGE_KEY.USER_INFO, {
          nickName: userInfo.nickName,
          avatarUrl: userInfo.avatarUrl
        })
        
        log.info('用户信息已保存，昵称: ' + userInfo.nickName)
        return true
      }
      
      return false
    } catch (error) {
      log.error('保存用户信息失败: ' + JSON.stringify(error))
      return false
    }
  }

  /**
   * 清除缓存
   */
  clearCache() {
    this._userInfo = null
  }

  /**
   * 创建提醒事项
   * @param {Object} todoData - 提醒事项数据 { title, description, remindAt }
   * @returns {Promise<boolean>} 是否创建成功
   */
  async createTodo(todoData) {
    try {
      const db = wx.cloud.database()
      const todoCollection = db.collection(CONSTANTS.COLLECTION.TODO)
      
      // 将 remindAt 字符串转换为 Date 对象
      // 格式: "YYYY-MM-DD HH:mm" (如 "2024-01-15 14:30")
      let remindAt = null
      if (todoData.remindAt) {
        // 替换 - 为 / 以便 Date 解析
        const dateStr = todoData.remindAt.replace(/-/g, '/')
        remindAt = new Date(dateStr)
      }
      
      // 准备要保存的数据
      const dataToSave = {
        title: todoData.title,
        description: todoData.description || '',
        remindAt: remindAt,
        creatorOpenID: this._openid,
        status: 'pending', // 待提醒状态
        createdAt: db.serverDate(),
        updatedAt: db.serverDate()
      }
      
      // 保存数据
      const result = await todoCollection.add({
        data: dataToSave
      })

      log.info('创建提醒事项成功: ' + JSON.stringify(dataToSave) + ' Response: ' + JSON.stringify(result))
      
      return true
    } catch (error) {
      log.error('创建提醒事项失败: ' + JSON.stringify(error))
      return false
    }
  }

  /**
   * 获取用户的提醒事项列表
   * @returns {Promise<Array>} 提醒事项列表
   */
  async getTodoList() {
    try {
      const db = wx.cloud.database()
      const todoCollection = db.collection(CONSTANTS.COLLECTION.TODO)
      
      const result = await todoCollection.where({
        creatorOpenID: this._openid
      }).orderBy('remindAt', 'asc').get()
      
      return result.data
    } catch (error) {
      log.error('获取提醒事项列表失败: ' + JSON.stringify(error))
      return []
    }
  }
}

// 导出单例
module.exports = new DataManager()

