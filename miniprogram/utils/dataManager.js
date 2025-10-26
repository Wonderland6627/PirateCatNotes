// utils/dataManager.js
const logger = require('../logger')

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
        name: 'piratecat_notes_get_wx_context'
      })
      
      if (loginResult.result.openid) {
        this._openid = loginResult.result.openid
        logger.info('数据中心初始化成功，openid: ' + this._openid)
        
        // 初始化用户信息到数据库
        await this.initUserRecord()
        
        this._isInitialized = true
        return true
      }
      return false
    } catch (error) {
      logger.error('数据中心初始化失败: ' + JSON.stringify(error))
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
      const userCollection = db.collection('piratecat_notes_user')
      
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
        logger.info('创建未注册用户记录')
      } else {
        logger.info('用户已存在')
      }
    } catch (error) {
      logger.error('初始化用户记录失败: ' + JSON.stringify(error))
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
      const userCollection = db.collection('piratecat_notes_user')
      
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
          wx.setStorageSync('userInfo', {
            nickName: this._userInfo.nickName,
            avatarUrl: this._userInfo.avatarUrl
          })
        }
        
        return this._userInfo
      }
      
      return null
    } catch (error) {
      logger.error('获取用户信息失败: ' + JSON.stringify(error))
      // 失败则尝试从本地存储加载
      const localUserInfo = wx.getStorageSync('userInfo')
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
      const userCollection = db.collection('piratecat_notes_user')
      
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
        wx.setStorageSync('userInfo', {
          nickName: userInfo.nickName,
          avatarUrl: userInfo.avatarUrl
        })
        
        logger.info('用户信息已保存，昵称: ' + userInfo.nickName)
        return true
      }
      
      return false
    } catch (error) {
      logger.error('保存用户信息失败: ' + JSON.stringify(error))
      return false
    }
  }

  /**
   * 清除缓存
   */
  clearCache() {
    this._userInfo = null
  }
}

// 导出单例
module.exports = new DataManager()

