// app.js
const logger = require('./logger.js')
const dataManager = require('./utils/dataManager.js')

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
        // 初始化数据中心（获取openid等）
        dataManager.init()
      }).catch(err => {
        logger.error(`云环境初始化失败 ${err}`)
      })
    }
  },

  globalData: {
    dataManager: dataManager
  }
});