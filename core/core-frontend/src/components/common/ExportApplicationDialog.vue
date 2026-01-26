<template>
  <el-dialog
    v-model="dialogVisible"
    title="导出申请"
    width="500px"
    append-to-body
    :close-on-click-modal="false"
    @closed="handleClose"
  >
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-position="top"
      require-asterisk-position="left"
    >
      <el-form-item label="申请原因" prop="reason">
        <el-input
          v-model="form.reason"
          type="textarea"
          placeholder="请输入"
          maxlength="200"
          show-word-limit
          :rows="3"
        />

      </el-form-item>
      <div style="color: #FF7C42; font-size: 12px; padding-top: 5px; margin-bottom: 10px; line-height: 1.5;">
        根据《咪咕文化科技有限公司4A管理办法》，数据导出必须通过4A金库模式管控并填写申请理由，若不填写或申请理由不充分，将会承担安全审计责任，后果自负！
      </div>
      <el-form-item label="任务描述" prop="desc">
        <el-input
          v-model="form.desc"
          type="textarea"
          placeholder="请输入"
          maxlength="1000"
          show-word-limit
          :rows="3"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="loading" @click="confirm">确定</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'

const emits = defineEmits(['confirm'])

const dialogVisible = ref(false)
const loading = ref(false)
const formRef = ref(null)
const form = reactive({
  reason: '',
  desc: ''
})

const rules = {
  reason: [
    { required: true, trigger: 'blur', validator: (rule, value, callback) => {
      if (!value) {
        callback(new Error('请输入申请原因'))
      } else if (value.length < 10) {
        callback(new Error('申请原因不得少于10个字符'))
      } else if (/(.)\1{4}/.test(value)) {
        callback(new Error('申请原因不能连续出现5个相同字符'))
      } else {
        callback()
      }
    }}
  ]
}

const open = () => {
  form.reason = ''
  form.desc = ''
  dialogVisible.value = true
}

const handleClose = () => {
  formRef.value?.resetFields()
}

const confirm = () => {
  formRef.value?.validate(valid => {
    if (valid) {
      loading.value = true
      emits('confirm', { ...form, callback: () => {
        loading.value = false
        dialogVisible.value = false
      }})
    }
  })
}

defineExpose({
  open
})
</script>
