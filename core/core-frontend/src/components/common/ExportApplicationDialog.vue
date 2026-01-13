<template>
  <el-dialog
    v-model="dialogVisible"
    title="导出申请"
    width="500px"
    append-to-body
    :close-on-click-modal="false"
  >
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-position="top"
    >
      <el-form-item label="申请原因" prop="reason">
        <el-input
          v-model="form.reason"
          type="textarea"
          placeholder="请输入"
          :rows="3"
        />
        <div style="color: #f56c6c; font-size: 12px; margin-top: 5px; line-height: 1.5;">
          根据《咪咕文化科技有限公司4A管理办法》，数据导出必须通过4A金库模式管控并填写申请理由，若不填写或申请理由不充分，将会承担安全审计责任，后果自负！
        </div>
      </el-form-item>
      <el-form-item label="任务描述" prop="desc">
        <el-input
          v-model="form.desc"
          type="textarea"
          placeholder="请输入"
          :rows="3"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirm">确定</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'

const emits = defineEmits(['confirm'])

const dialogVisible = ref(false)
const formRef = ref(null)
const form = reactive({
  reason: '',
  desc: ''
})

const rules = {
  reason: [{ required: true, message: '请输入申请原因', trigger: 'blur' }]
}

const open = () => {
  form.reason = ''
  form.desc = ''
  dialogVisible.value = true
}

const confirm = () => {
  formRef.value?.validate(valid => {
    if (valid) {
      dialogVisible.value = false
      emits('confirm', { ...form })
    }
  })
}

defineExpose({
  open
})
</script>
