// pages/edit-profile/index.js
const logger = require('../../logger')
const dataManager = require('../../utils/dataManager.js')
const commonUtils = require('../../utils/commonUtils.js')

Page({

  /**
   * 页面的初始数据
   */
  data: {
    userInfo: {
      nickName: '',
      avatarUrl: ''
    },
    isRegistered: false  // 是否已注册（是否有真实信息）
  },

  /**
   * 生命周期函数--监听页面加载
   */
  async onLoad(options) {
    // 等待数据中心初始化完成
    await dataManager.init()
    // 从数据中心加载用户信息
    this.loadUserInfo()
  },

  /**
   * 从数据中心加载用户信息
   */
  async loadUserInfo() {
    const USER_DEFAULTS = require('../../config/userDefaults.js')
    const userInfo = await dataManager.getUserInfo(true)
    
    if (userInfo) {
      this.setData({
        userInfo: {
          nickName: userInfo.nickName || '',
          avatarUrl: userInfo.avatarUrl || USER_DEFAULTS.AVATAR_URL
        },
        isRegistered: userInfo.isRegistered
      })
    } else {
      // 如果没有用户信息，使用默认值
      this.setData({
        userInfo: {
          nickName: '',
          avatarUrl: USER_DEFAULTS.AVATAR_URL
        },
        isRegistered: false
      })
    }
  },

  /**
   * 选择头像
   */
  async onChooseAvatar(e) {
    logger.info('选择头像: ' + JSON.stringify(e.detail))
    const { avatarUrl } = e.detail
    
    try {
      // 上传头像到云存储
      const cloudUrl = await this.uploadAvatarToCloud(avatarUrl)
      
      // 更新为云存储地址
      this.setData({
        'userInfo.avatarUrl': cloudUrl
      })
      
      logger.info('头像已上传到云存储: ' + cloudUrl)
    } catch (error) {
      logger.error('上传头像失败: ' + JSON.stringify(error))
      wx.showToast({
        title: '上传失败',
        icon: 'none'
      })
    } finally {
      wx.hideLoading()
    }
  },

  /**
   * 上传头像到云存储
   */
  async uploadAvatarToCloud(localPath) {
    // 获取文件扩展名
    const ext = localPath.split('.').pop()
    // 获取 openid 用于文件名前缀，防止冲突
    let prefix = dataManager.getOpenid()
    
    // 如果 openid 为空，使用随机 UUID 代替
    if (!prefix) {
      prefix = commonUtils.generateUUID()
      logger.warn('openid 为空，使用随机 UUID 代替: ' + prefix)
    }
    
    const fileName = `avatars/${prefix}_${Date.now()}.${ext}`
    
    // 上传到云存储
    const result = await wx.cloud.uploadFile({
      cloudPath: fileName,
      filePath: localPath
    })
    
    return result.fileID
  },


  /**
   * 昵称输入框失焦
   */
  onNicknameBlur(e) {
    const nickName = e.detail.value || ''
    logger.info('输入昵称: ' + nickName)
    this.setData({
      'userInfo.nickName': nickName
    })
  },

  /**
   * 保存用户信息
   */
  async onSaveUserInfo() {
    const USER_DEFAULTS = require('../../config/userDefaults.js')
    const userInfo = {
      nickName: this.data.userInfo.nickName || '',
      avatarUrl: this.data.userInfo.avatarUrl || USER_DEFAULTS.AVATAR_URL
    }
    
    logger.info('准备保存用户信息: ' + JSON.stringify(userInfo))
    
    // 验证是否填写完整（只验证昵称）
    if (!userInfo.nickName) {
      wx.showToast({
        title: '请输入昵称',
        icon: 'none'
      })
      return
    }
    
    // 通过数据中心保存用户信息
    const success = await dataManager.saveUserInfo(userInfo)
    
    if (success) {
      wx.showToast({
        title: '保存成功',
        icon: 'success'
      })
      
      // 延迟返回上一页
      setTimeout(() => {
        wx.navigateBack()
      }, 1500)
    } else {
      wx.showToast({
        title: '保存失败',
        icon: 'none'
      })
    }
  }
})
