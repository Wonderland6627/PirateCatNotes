// app.js
App({
  onLaunch: function () {
    this.globalData = {
      // env 参数说明：
      //   env 参数决定接下来小程序发起的云开发调用（wx.cloud.xxx）会默认请求到哪个云环境的资源
      //   此处请填入环境 ID, 环境 ID 可打开云控制台查看
      //   如不填则使用默认环境（第一个创建的环境）
      env: "cloud1-8gewsvyn8efe62b8",
      sharedCloud: null,
    };

    this.cloud = new wx.cloud.Cloud({
      resourceAppid: 'wx44c4c158f1c2daa2', // 替换为A的AppID
      resourceEnv: 'cloud1-8gewsvyn8efe62b8', // 替换为A的云环境ID
    })
    // 必须等待初始化完成
    this.cloud.init().then(() => {
      console.log('共享云环境初始化成功')
    }).catch(err => {
      console.error('共享云环境初始化失败', err)
    })
    this.globalData.sharedCloud = this.cloud

    // if (!wx.cloud) {
    //   console.error("请使用 2.2.3 或以上的基础库以使用云能力");
    // } else {
    //   wx.cloud.init({
    //     env: this.globalData.env,
    //     traceUser: true,
    //   });
    // }
  },
});