// app.js
const logger = require('./logger.js')

App({
  onLaunch: function () {
    if (!wx.cloud) {
      logger.error('请使用 2.2.3 或以上的基础库以使用云能力');
    } else {
      wx.cloud.init({
        // env 参数说明：
        //   env 参数决定接下来小程序发起的云开发调用（wx.cloud.xxx）会默认请求到哪个云环境的资源
        //   此处请填入环境 ID, 环境 ID 可打开云控制台查看
        //   如不填则使用默认环境（第一个创建的环境）
        env: 'cloud1-5gfrbhtxff24a34f',
        traceUser: true,
      })
      .then(() => {
        logger.info(`云环境初始化成功 ${666}`)
        // 初始化用户信息
        this.initUser()
      }).catch(err => {
        logger.error(`云环境初始化失败 ${err}`)
      })
    }
  },

  /**
   * 初始化用户信息到数据库
   */
  async initUser() {
    try {
      // 获取用户的 openid
      const loginResult = await wx.cloud.callFunction({
        name: 'piratecat_notes_get_wx_context'
      })
      
      if (loginResult.result.openid) {
        const openid = loginResult.result.openid
        logger.info('用户 openid: ' + openid)
        
        // 检查用户是否已存在
        const db = wx.cloud.database()
        const userCollection = db.collection('piratecat_notes_user')
        
        // 查询用户是否存在
        const queryResult = await userCollection.where({
          _openid: openid
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
      }
    } catch (error) {
      logger.error('初始化用户信息失败: ' + JSON.stringify(error))
    }
  }
});