// pages/edit-profile/index.js
const logger = require('../../logger')

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
  onLoad(options) {
    // 从本地存储加载用户信息
    this.loadUserInfo()
  },

  /**
   * 从本地存储加载用户信息
   */
  loadUserInfo() {
    // 直接从数据库加载
    this.loadUserInfoFromDB()
  },

  /**
   * 从数据库加载用户信息
   */
  async loadUserInfoFromDB() {
    try {
      const db = wx.cloud.database()
      const userCollection = db.collection('piratecat_notes_user')
      
      const loginResult = await wx.cloud.callFunction({
        name: 'piratecat_notes_get_wx_context'
      })
      
      if (loginResult.result.openid) {
        const queryResult = await userCollection.where({
          _openid: loginResult.result.openid
        }).get()
        
        if (queryResult.data.length > 0) {
          const dbUserInfo = queryResult.data[0]
          // 判断是否已注册（是否有真实信息）
          const isRegistered = dbUserInfo.nickName && dbUserInfo.avatarUrl
          
          const userInfo = {
            nickName: dbUserInfo.nickName || '',
            avatarUrl: dbUserInfo.avatarUrl || ''
          }
          
          this.setData({
            userInfo: userInfo,
            isRegistered: isRegistered
          })
          
          // 如果有信息，同步到本地存储
          if (isRegistered) {
            wx.setStorageSync('userInfo', userInfo)
          }
        }
      }
    } catch (error) {
      logger.error('从数据库加载用户信息失败: ' + JSON.stringify(error))
    }
  },

  /**
   * 选择头像
   */
  onChooseAvatar(e) {
    logger.info('选择头像: ' + JSON.stringify(e.detail))
    const { avatarUrl } = e.detail
    this.setData({
      'userInfo.avatarUrl': avatarUrl
    })
    logger.info('头像已更新: ' + avatarUrl)
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
    const userInfo = {
      nickName: this.data.userInfo.nickName || '',
      avatarUrl: this.data.userInfo.avatarUrl || ''
    }
    
    logger.info('准备保存用户信息: ' + JSON.stringify(userInfo))
    
    // 验证是否填写完整
    if (!userInfo.nickName || !userInfo.avatarUrl) {
      wx.showToast({
        title: '请填写完整信息',
        icon: 'none'
      })
      return
    }
    
    // 保存用户信息到本地存储
    wx.setStorageSync('userInfo', userInfo)
    
    // 保存用户信息到数据库
    await this.saveUserInfoToDB(userInfo)
    
    wx.showToast({
      title: '保存成功',
      icon: 'success'
    })
    
    // 延迟返回上一页
    setTimeout(() => {
      wx.navigateBack()
    }, 1500)
  },

  /**
   * 保存用户信息到数据库
   */
  async saveUserInfoToDB(userInfo) {
    try {
      const db = wx.cloud.database()
      const userCollection = db.collection('piratecat_notes_user')
      
      // 获取当前用户的 openid
      const loginResult = await wx.cloud.callFunction({
        name: 'piratecat_notes_get_wx_context'
      })
      
      if (loginResult.result.openid) {
        const openid = loginResult.result.openid
        
        // 查询用户是否存在
        const queryResult = await userCollection.where({
          _openid: openid
        }).get()
        
        // 用户记录肯定存在（初始化时已创建），直接更新
        const docId = queryResult.data[0]._id
        await userCollection.doc(docId).update({
          data: {
            nickName: userInfo.nickName,
            avatarUrl: userInfo.avatarUrl
          }
        })
        logger.info('用户信息已保存到数据库，昵称: ' + userInfo.nickName)
      }
    } catch (error) {
      logger.error('保存用户信息到数据库失败: ' + JSON.stringify(error))
      wx.showToast({
        title: '保存失败',
        icon: 'none'
      })
    }
  }
})
