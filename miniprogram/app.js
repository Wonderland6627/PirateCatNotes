// app.js
const logger = require('./logger.js')
const dataManager = require('./dataManager')

/**
 * 判断是否在编辑器或测试模式下
 * @returns {boolean} 如果在开发/测试环境返回 true，否则返回 false
 */
function isDevOrTestMode() {
  try {
    // 通过账号信息判断环境：develop(开发版)、trial(体验版)、release(正式版)
    const accountInfo = wx.getAccountInfoSync()
    const envVersion = accountInfo.miniProgram.envVersion
    // 开发版和体验版都显示时间戳，正式版不显示
    return envVersion === 'develop' || envVersion === 'trial'
  } catch (e) {
    // 如果获取账号信息失败，可能是开发者工具环境，默认显示时间戳
    return true
  }
}

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
    dataManager: dataManager,
    isDevOrTestMode: isDevOrTestMode
  }
});