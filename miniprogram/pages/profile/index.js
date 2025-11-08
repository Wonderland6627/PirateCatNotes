// pages/profile/index.js
const logger = require('../../logger')
const USER_DEFAULTS = require('../../config/userDefaults.js')
const dataManager = require('../../dataManager')

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
    try {
      const userInfo = await dataManager.getUserInfo(true)
      
      if (userInfo) {
        // 用户已注册，显示真实信息
        this.setData({
          userInfo: {
            nickName: userInfo.nickName || USER_DEFAULTS.NICKNAME,
            avatarUrl: userInfo.avatarUrl || USER_DEFAULTS.AVATAR_URL
          },
          hasUserInfo: userInfo.isRegistered
        })
      } else {
        // 用户未注册，显示默认值
        this.setData({
          hasUserInfo: false,
          userInfo: {
            nickName: USER_DEFAULTS.NICKNAME,
            avatarUrl: USER_DEFAULTS.AVATAR_URL
          }
        })
      }
    } catch (error) {
      logger.error('加载用户信息失败: ' + JSON.stringify(error))
      // 失败则使用默认值
      this.setData({
        hasUserInfo: false,
        userInfo: {
          nickName: USER_DEFAULTS.NICKNAME,
          avatarUrl: USER_DEFAULTS.AVATAR_URL
        }
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
   * 跳转到权限管理页面
   */
  onNavigateToPermissionManage() {
    wx.navigateTo({
      url: '/pages/permission-manage/index'
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
  async onShow() {
    // 每次显示时重新加载用户信息
    this.loadUserInfo()
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
