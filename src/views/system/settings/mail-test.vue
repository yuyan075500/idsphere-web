<template>
  <el-form ref="form" :model="form" :rules="rules" :validate-on-rule-change="false" label-position="right" label-width="100px" style="width: 95%;padding-top: 20px;">
    <el-form-item label="收件地址：" prop="receiver">
      <el-input v-model="form.receiver" autocomplete="off" clearable />
    </el-form-item>
    <el-form-item>
      <div>
        <el-button size="mini" @click="cancel">取 消</el-button>
        <el-button type="primary" size="mini" :loading="loading" @click="handleSubmit">确 定</el-button>
      </div>
    </el-form-item>
  </el-form>
</template>

<script>
import { Message } from 'element-ui'
import { sendMail } from '@/api/system/settings'

export default {
  name: 'MailTestForm',
  props: {
    form: {
      type: Object,
      default() {
        return {
          receiver: ''
        }
      }
    }
  },
  data() {
    return {
      loading: false,
      rules: {
        receiver: [
          { required: true, message: '请输入收件人地址', trigger: 'change' }
        ]
      }
    }
  },
  methods: {

    /* 提交表单 */
    handleSubmit() {
      this.$refs.form.validate(valid => {
        if (!valid) {
          return
        }
        // 开始加载
        this.loading = true
        sendMail(this.form).then((res) => {
          if (res.code === 0) {
            Message({
              message: res.msg,
              type: 'success',
              duration: 1000
            })
          } else {
            Message({
              message: res.msg,
              type: 'error',
              duration: 2000
            })
            this.loading = false
          }
        }).catch(() => {
          this.loading = false
        }).finally(() => {
          this.loading = false
        })
      })
    },

    /* 关闭表单 */
    cancel() {
      this.$emit('close')
    }
  }
}
</script>
