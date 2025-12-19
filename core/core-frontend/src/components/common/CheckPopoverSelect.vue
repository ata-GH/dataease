<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { ArrowDown } from '@element-plus/icons-vue'

type ValueType = string | number
interface OptionItem {
  label: string
  value: ValueType
  avatar?: string
}

const props = defineProps<{
  modelValue: ValueType[]
  options: OptionItem[]
  placeholder?: string
  loading?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', val: ValueType[]): void
}>()

const visible = ref(false)
const keyword = ref('')
const innerValue = ref<ValueType[]>(Array.isArray(props.modelValue) ? [...props.modelValue] : [])
const checkAll = ref(false)

watch(
  () => props.modelValue,
  val => {
    // 去重同步，避免因重复值导致“全选”误判
    innerValue.value = Array.isArray(val) ? Array.from(new Set(val)) : []
  }
)

watch(visible, v => {
  if (v) {
    // 打开弹层时与外部值对齐并去重
    innerValue.value = Array.isArray(props.modelValue)
      ? Array.from(new Set(props.modelValue))
      : []
  }
})

const filteredOptions = computed(() => {
  const kw = keyword.value.trim().toLowerCase()
  if (!kw) return props.options || []
  return (props.options || []).filter(o => o.label.toLowerCase().includes(kw))
})

const selectedOptions = computed(() => {
  const set = new Set(innerValue.value)
  return (props.options || []).filter(o => set.has(o.value))
})

watch(
  [innerValue, () => props.options],
  () => {
    const total = (props.options || []).length
    const set = new Set(innerValue.value)
    const matched = (props.options || []).reduce((acc, o) => acc + (set.has(o.value) ? 1 : 0), 0)
    checkAll.value = total > 0 && matched === total
  },
  { immediate: true }
)

const isIndeterminate = computed(() => {
  const total = (props.options || []).length
  const set = new Set(innerValue.value)
  const matched = (props.options || []).reduce((acc, o) => acc + (set.has(o.value) ? 1 : 0), 0)
  return matched > 0 && matched < total
})

const handleCheckAll = (val: boolean) => {
  if (val) {
    innerValue.value = (props.options || []).map(o => o.value)
  } else {
    innerValue.value = []
  }
  // 勾选“全员”或取消时立即同步到外部
  emit('update:modelValue', innerValue.value)
}

const remove = (val: ValueType) => {
  innerValue.value = innerValue.value.filter(v => v !== val)
  emit('update:modelValue', innerValue.value)
}

// 选项组变化时：去重并即时同步到外部
const onGroupChange = (vals: ValueType[]) => {
  innerValue.value = Array.from(new Set(vals))
  emit('update:modelValue', innerValue.value)
}

const onSearchInput = (val: string) => {
  // 纯前端筛选：仅更新关键字，利用 filteredOptions 计算结果
  keyword.value = val
}

// 通用：移除英文括号及其前的空格，清理多余空格
const formatLabel = (label: string | null | undefined) => {
  const s = String(label ?? '')
  return s
    // 移除形如 " (xxx)" 的英文括号内容（可出现多次）
    .replace(/\s*\([^)]*\)/g, '')
    // 合并可能出现的多余空格
    .replace(/\s{2,}/g, ' ')
    .trim()
}
</script>

<template>
  <el-popover v-model:visible="visible" placement="bottom-start" trigger="click" width="360">
    <template #reference>
      <div class="check-select-reference">
        <div class="tags" v-if="selectedOptions.length">
          <el-tag
            v-for="opt in selectedOptions"
            :key="opt.value"
            size="small"
            closable
            @close="remove(opt.value)"
          >
            {{ formatLabel(opt.label) }}
          </el-tag>
        </div>
        <span v-else class="placeholder">{{ props.placeholder || '请选择' }}</span>
        <el-icon class="arrow"><ArrowDown /></el-icon>
      </div>
    </template>
    <div class="check-select-panel">
      <div class="panel-header">
        <el-checkbox v-model="checkAll" :indeterminate="isIndeterminate" @change="handleCheckAll">全选</el-checkbox>
        <el-input
          size="small"
          clearable
          placeholder="搜索"
          v-model="keyword"
          @input="onSearchInput($event as any)"
        />
      </div>
      <el-scrollbar height="240px">
        <template v-if="filteredOptions.length">
          <el-checkbox-group v-model="innerValue" @change="onGroupChange">
            <el-checkbox v-for="opt in filteredOptions" :key="opt.value" :label="opt.value">
              {{ opt.label }}
            </el-checkbox>
          </el-checkbox-group>
        </template>
        <div v-else class="empty-tip">未搜索到</div>
      </el-scrollbar>

    </div>
  </el-popover>
</template>

<style lang="less" scoped>
.check-select-reference {
  display: flex;
  align-items: flex-start;
  width: 100%;
  min-height: 60px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  padding: 4px 8px;
  cursor: pointer;
  box-sizing: border-box;
}
.check-select-reference .tags {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
  flex: 1 1 auto;
}
.check-select-reference .placeholder {
  color: #c0c4cc;
}
.check-select-reference .arrow {
  margin-left: auto;
  color: #909399;
}
.check-select-panel {
  display: flex;
  flex-direction: column;
}
.panel-header {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-bottom: 8px;
}

.empty-tip {
  color: #909399;
  text-align: center;
  padding: 24px 0;
}

</style>
