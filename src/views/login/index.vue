<template>
  <div class="login-container">
    <div class="login-form">
      <div class="title-container">
        <h3 class="title">{{ title }}</h3>
      </div>

      <el-tabs v-if="isShow('dd') || isShow('ww') || isShow('feishu')" v-model="active" :stretch="stretch" @tab-click="handleTabClick">
        <el-tab-pane label="账号密码" name="username">
          <password-login-form
            ref="loginForm"
            :loading="loading"
            @submit="handleLogin"
          />
        </el-tab-pane>
        <el-tab-pane v-if="isShow('dd')" label="钉钉扫码" name="dd" class="qrcode">
          <div id="dd_qrcode" class="qrcode-container" />
          <div class="tip-qrcode">
            使用钉钉扫描上方二维码登录
          </div>
        </el-tab-pane>
        <el-tab-pane v-if="isShow('ww')" label="企业微信扫码" name="ww" class="qrcode">
          <div id="ww_login" class="qrcode-container" />
          <div class="tip-qrcode">
            使用企业微信扫描上方二维码登录
          </div>
        </el-tab-pane>
        <el-tab-pane v-if="isShow('feishu')" label="飞书扫码" name="feishu" class="qrcode">
          <div id="feishu_login" class="qrcode-container" />
          <div class="tip-qrcode">
            使用飞书扫描上方二维码登录
          </div>
        </el-tab-pane>
      </el-tabs>

      <!-- 仅显示账号密码登录表单 -->
      <div v-else>
        <password-login-form
          ref="loginForm"
          :loading="loading"
          @submit="handleLogin"
        />
      </div>
      <div class="tips"><span>{{ copyright }}</span></div>
    </div>
  </div>
</template>

<script>
import { sdkLoaders } from '@/main'
import { FeishuQrLogin } from '@/utils/feishu'
import { saveToLocalStorage, getFromLocalStorage } from '@/utils/localStorage'
import { isEnvEnabled } from '@/utils/env'
import { Base64 } from 'js-base64'
import { generateState } from '@/utils/generate-stata'
import PasswordLoginForm from './password_login'

export default {
  name: 'Login',
  components: {
    PasswordLoginForm
  },
  data() {
    return {
      // 指定默认登录方式
      active: 'username',
      // 扫码认证相关参数（适用于钉钉、企业微信）
      qrcode: {
        redirect_uri: window.location.protocol + '//' + window.location.hostname + '/login' // 认证成功后的回调地址
      },
      // 控制el-tabs标签页宽度自适应
      stretch: true,
      // 登录成功后跳转的路径
      redirect: undefined,
      // 控制登录按钮状态
      loading: false,
      // 版权信息
      copyright: process.env.VUE_APP_COPYRIGHT,
      // 网站名称
      title: process.env.VUE_APP_TITLE
    }
  },
  watch: {
    $route: {
      handler: function(route) {
        // 获取登录成功后跳转的路径
        this.redirect = route.query && route.query.redirect
      },
      immediate: true
    }
  },
  created() {
    // 页面加载时从缓存中获取上次选择的登录方式
    const savedTab = getFromLocalStorage('defaultLoginTag')
    if (savedTab) {
      this.active = savedTab
    }
  },
  async mounted() {
    // 获取路由参数
    const query = this.$route.query

    // 获取扫码登录回调地址
    this.qrcode.redirect_uri = window.location.protocol + '//' + window.location.host + '/login'

    // 钉钉二维码初始化
    if (isEnvEnabled('VUE_APP_DINGTALK_CLIENT_ID')) {
      // 加载SDK
      await sdkLoaders.dingtalk

      this.ddQrcodeInit()
    }

    // 企业微信认证
    if (isEnvEnabled('VUE_APP_WECHAT_APP_ID') && isEnvEnabled('VUE_APP_WECHAT_AGENT_ID')) {
      // 加载SDK
      await sdkLoaders.wework

      // 认证回调
      if ('code' in query && 'appid' in query && 'state' in query) {
        // state校验
        const storedState = getFromLocalStorage('ww_state')
        if (query.state !== storedState) {
          this.$message.error('请求无效')
          return false
        }
        // 系统登录
        this.handleWwLogin()
      }

      // 二维码初始化
      this.wwQrcodeInit()
    }

    // 飞书认证
    if (isEnvEnabled('VUE_APP_FEISHU_CLIENT_ID')) {
      // 加载SDK
      await sdkLoaders.feishu

      // 认证回调
      if ('code' in query && 'byte' in query && 'state' in query) {
        // state校验
        const storedState = getFromLocalStorage('feishu_state')
        if (query.state !== storedState) {
          this.$message.error('请求无效')
          return false
        }
        // 系统登录
        this.handleFeishuLogin()
      }

      // 二维码初始化
      FeishuQrLogin(query)
    }
  },
  methods: {

    /* 当用户切换Tab */
    handleTabClick(tab) {
      // 保存当前选项到localStorage
      saveToLocalStorage('defaultLoginTag', tab.name)
    },

    /* 判断是否显示某个登录方式 */
    isShow(type) {
      const envMap = {
        dd: process.env.VUE_APP_DINGTALK_CLIENT_ID,
        ww: process.env.VUE_APP_WECHAT_APP_ID && process.env.VUE_APP_WECHAT_AGENT_ID,
        feishu: process.env.VUE_APP_FEISHU_CLIENT_ID
      }
      return !!envMap[type]
    },

    /* 普通登录按钮 */
    handleLogin(formData) {
      this.loading = true

      // 合并URL中的query参数（主要是SSO客户端的请求参数同样需要发送到后端）
      const newForm = {
        ...formData,
        ...this.$route.query
      }

      // 执行登录
      this.$store.dispatch('user/login', newForm).then((res) => {
        // redirect_uri表示SSO客户端在进行单点登录认证
        if (res.redirect_uri !== undefined) {
          // SAML认证
          if (newForm.SAMLRequest) {
            // 将授权HTML插入到当前页面的DOM中
            const div = document.createElement('div')
            div.innerHTML = res.redirect_uri // 这里后端返回的redirect_uri实际是授权HTML
            document.body.appendChild(div)
            // 获取表单（saml这个ID是后端定义好后返回的）
            const form = div.querySelector('#saml')
            // 提交表单
            if (form) {
              form.submit()
            }
          } else {
            // CAS3.0和OAuth2.0认证
            window.location.href = res.redirect_uri
          }
        }

        // redirect表示启动了MFA认证，需要根据后端返回的redirect名称，跳转至不同的MFA认证页面
        if (res.redirect) {
          // 如果是MFA认证，则需要将SSO客户端请求参数传递到MFA认证页面
          this.$router.push({
            name: res.redirect,
            params: {
              token: res.token,
              username: newForm.username
            },
            query: this.$route.query
          })
        } else {
          this.$router.push({ path: this.redirect || '/' })
        }
        this.loading = false
      }).catch(() => {
        this.loading = false
      })
    },

    /* 飞书扫码登录 */
    handleFeishuLogin() {
      // 授权URL请求参数设定
      const newForm = {
        ...this.$route.query
      }

      // 如果是 OAuth2.0认证，需要将本地存储的 state 参数带上
      if ('client_id' in newForm) {
        newForm.state = getFromLocalStorage('oauth_state')
      }

      this.$store.dispatch('user/get_feishu_authorize', newForm).then((res) => {
        // redirect_uri表示SSO客户端在进行单点登录认证
        if (res.redirect_uri !== undefined) {
          // SAML认证
          if (newForm.SAMLRequest) {
            // 将授权HTML插入到当前页面的DOM中
            const div = document.createElement('div')
            div.innerHTML = res.redirect_uri // 这里后端返回的redirect_uri实际是授权HTML
            document.body.appendChild(div)
            // 获取表单（saml这个ID是后端定义好后返回的）
            const form = div.querySelector('#saml')
            // 提交表单
            if (form) {
              form.submit()
            }
          } else {
            // CAS3.0和OAuth2.0认证
            window.location.href = res.redirect_uri
          }
        }

        this.$router.push({ path: this.redirect || '/' })
      }).catch(() => {})
    },

    /* 企业微信二维码初始化 */
    wwQrcodeInit() {
      // 授权URL请求参数设定
      const newForm = {
        ...this.$route.query
      }

      // 如果是 OAuth2.0认证，则将 state 参数保存至本地，然后删除 URL 中的 state 参数，防止在进行企业微信扫码时 state 参数重复
      if ('state' in newForm) {
        saveToLocalStorage('oauth_state', newForm.state)
        delete newForm.state
      }

      // 重新生成 URL Query 参数
      const searchParams = new URLSearchParams(newForm)

      // 生成随机 state，用于请求企业微信后台
      const state = generateState()
      // 将state存储到localStorage，防止回调时页面刷新导致 state 丢失，请求完成后需要校验
      saveToLocalStorage('ww_state', state)

      // 初始化二维码
      new window.WwLogin({
        id: 'ww_login',
        appid: process.env.VUE_APP_WECHAT_APP_ID,
        agentid: process.env.VUE_APP_WECHAT_AGENT_ID,
        redirect_uri: encodeURIComponent(this.qrcode.redirect_uri + '?' + searchParams.toString()),
        state: state,
        href: `data:text/css;base64,${Base64.encode(
          `.impowerBox .title {display: none;}
          .impowerBox .info {display: none;}
          .impowerBox .qrcode {width: 210px;padding-top: 15px;}`
        )}`
      })
    },

    /* 企业微信扫码登录 */
    handleWwLogin() {
      // 授权URL请求参数设定
      const newForm = {
        ...this.$route.query
      }

      // 如果是 OAuth2.0认证，需要将本地存储的 state 参数带上
      if ('client_id' in newForm) {
        newForm.state = getFromLocalStorage('oauth_state')
      }

      this.$store.dispatch('user/get_ww_authorize', newForm).then((res) => {
        // redirect_uri表示SSO客户端在进行单点登录认证
        if (res.redirect_uri !== undefined) {
          // SAML认证
          if (newForm.SAMLRequest) {
            // 将授权HTML插入到当前页面的DOM中
            const div = document.createElement('div')
            div.innerHTML = res.redirect_uri // 这里后端返回的redirect_uri实际是授权HTML
            document.body.appendChild(div)
            // 获取表单（saml这个ID是后端定义好后返回的）
            const form = div.querySelector('#saml')
            // 提交表单
            if (form) {
              form.submit()
            }
          } else {
            // CAS3.0和OAuth2.0认证
            window.location.href = res.redirect_uri
          }
        }

        this.$router.push({ path: this.redirect || '/' })
      }).catch(() => {})
    },

    /* 钉钉二维码初始化、扫码成功后的动作 */
    ddQrcodeInit() {
      // 生成随机state
      const dd_state = generateState()
      // 将state存储到localStorage，防止回调时页面刷新导致state丢失
      saveToLocalStorage('dd_state', dd_state)

      window.DTFrameLogin(
        // 二维码容器相关参数：绑定的容器id、宽度、高度
        {
          id: 'dd_qrcode', // 二维码容器id
          width: 280, // 二维码容器宽度
          height: 280 // 二维码容器高度
        },
        {
          redirect_uri: encodeURIComponent(this.qrcode.redirect_uri), // 回调地址，需要与开发者后台钉钉登录与分享的地址保持一致，必须进行encode处理
          client_id: process.env.VUE_APP_DINGTALK_CLIENT_ID, // 钉钉应用的client_id
          scope: 'openid', // 固定值
          response_type: 'code', // 固定值
          state: dd_state, // 固定值，认证成功后会原样返回
          prompt: 'consent' // 固定值
        },
        (loginResult) => {
          // 获取扫码认证成功后的数据
          const { authCode, state } = loginResult

          // 获取请求时的state
          const storedState = getFromLocalStorage('dd_state')

          // 判断状态是否一致
          if (storedState !== state) {
            this.$message.error('请求无效')
            return false
          }

          // 授权URL请求参数设定
          const newForm = {
            authCode: authCode,
            ...this.$route.query
          }

          // 钉钉登录授权
          this.$store.dispatch('user/get_dingtalk_authorize', newForm).then((res) => {
            // redirect_uri表示SSO客户端在进行单点登录认证
            if (res.redirect_uri !== undefined) {
              // SAML认证
              if (newForm.SAMLRequest) {
                // 将授权HTML插入到当前页面的DOM中
                const div = document.createElement('div')
                div.innerHTML = res.redirect_uri // 这里后端返回的redirect_uri实际是授权HTML
                document.body.appendChild(div)
                // 获取表单（saml这个ID是后端定义好后返回的）
                const form = div.querySelector('#saml')
                // 提交表单
                if (form) {
                  form.submit()
                }
              } else {
                // CAS3.0和OAuth2.0认证
                window.location.href = res.redirect_uri
              }
            }

            this.$router.push({ path: this.redirect || '/' })
          }).catch(() => {})
        },
        (errorMsg) => {
          // 登录失败的原因
          alert(`Login Error: ${errorMsg}`)
        }
      )
    }
  }
}
</script>

<style lang="scss">
$cursor: #fff;

@supports (-webkit-mask: none) and (not (cater-color: $cursor)) {
  .login-container .el-input input {
    color: $cursor;
  }
}

.qrcode {
  text-align: center;
  background-color: white;

  .qrcode-container {
    height: 240px;
  }

  .tip-qrcode {
    padding-top: 15px;
    padding-bottom: 20px;
    font-size: 12.5px;
    margin-bottom: 20px;
  }
}

.login-container {

  .el-tabs__item.is-top{
    color:white
  }

  .el-tabs__item.is-active{
    color:#409EFF
  }
}
</style>

<style lang="scss" scoped>
$bg:#2d3a4b;
$dark_gray:#889aa4;
$light_gray:#eee;

.login-container {
  min-height: 100%;
  width: 100%;
  background-color: $bg;
  overflow: hidden;

  .login-form {
    position: relative;
    width: 520px;
    max-width: 100%;
    padding: 10% 35px 0;
    margin: 0 auto;
    overflow: hidden;
  }

  .tips {
    font-size: 14px;
    text-align: center;
    color: #fff;
  }

  .title-container {
    position: relative;

    .title {
      font-size: 26px;
      color: $light_gray;
      margin: 0px auto 40px auto;
      text-align: center;
      font-weight: bold;
    }
  }
}
</style>
