// pages/profile/index.js
const logger = require('../../logger')
const USER_DEFAULTS = require('../../config/userDefaults.js')

Page({

  /**
   * 页面的初始数据
   */
  data: {
    userInfo: {
      nickName: USER_DEFAULTS.NICKNAME,
      avatarUrl: USER_DEFAULTS.AVATAR_URL
    },
    hasUserInfo: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    // 从数据库加载用户信息
    this.loadUserInfoFromDB()
  },

  /**
   * 从数据库加载用户信息
   */
  async loadUserInfoFromDB() {
    try {
      const db = wx.cloud.database()
      const userCollection = db.collection('piratecat_notes_user')
      
      // 获取当前用户的 openid
      const loginResult = await wx.cloud.callFunction({
        name: 'piratecat_notes_get_wx_context'
      })
      
      if (loginResult.result.openid) {
        const openid = loginResult.result.openid
        
        // 查询用户信息
        const queryResult = await userCollection.where({
          _openid: openid
        }).get()
        
        if (queryResult.data.length > 0) {
          const dbUserInfo = queryResult.data[0]
          
          // 判断是否已注册（是否有真实信息）
          const isRegistered = dbUserInfo.nickName && dbUserInfo.avatarUrl
          
          // 将数据库中的字段名转换为页面需要的格式
          const userInfo = {
            nickName: dbUserInfo.nickName || USER_DEFAULTS.NICKNAME,
            avatarUrl: dbUserInfo.avatarUrl || USER_DEFAULTS.AVATAR_URL
          }
          
          // 更新页面显示
          this.setData({
            userInfo: userInfo,
            hasUserInfo: isRegistered
          })
          
          // 如果已注册，同时保存到本地存储
          if (isRegistered) {
            wx.setStorageSync('userInfo', userInfo)
          }
        } else {
          // 如果没有用户信息，使用默认值
          this.setData({
            hasUserInfo: false,
            userInfo: {
              nickName: USER_DEFAULTS.NICKNAME,
              avatarUrl: USER_DEFAULTS.AVATAR_URL
            }
          })
        }
      }
    } catch (error) {
      logger.error('从数据库加载用户信息失败: ' + JSON.stringify(error))
      // 失败则尝试从本地存储加载
      this.loadUserInfoFromLocal()
    }
  },

  /**
   * 从本地存储加载用户信息
   */
  loadUserInfoFromLocal() {
    const userInfo = wx.getStorageSync('userInfo')
    if (userInfo) {
      this.setData({
        userInfo: userInfo,
        hasUserInfo: true
      })
    }
  },

  /**
   * 跳转到个人信息编辑页
   */
  onNavigateToEditProfile() {
    wx.navigateTo({
      url: '/pages/edit-profile/index'
    })
  },

  /**
   * 跳转到设置页面
   */
  onNavigateToSettings() {
    wx.showToast({
      title: '设置功能开发中',
      icon: 'none'
    })
  },

  /**
   * 关于我们
   */
  onAboutUs() {
    wx.showModal({
      title: '关于我们',
      content: '海盗猫笔记 - 记录你的每一刻',
      showCancel: false,
      confirmText: '知道了'
    })
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
    // 每次显示时重新加载用户信息
    this.loadUserInfoFromDB()
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
