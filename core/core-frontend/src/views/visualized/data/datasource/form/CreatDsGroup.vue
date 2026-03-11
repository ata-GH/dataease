<!-- eslint-disable -->
<script lang="ts" setup>
/* eslint-disable */
import dvFolder from '@/assets/svg/dv-folder.svg'
import icon_searchOutline_outlined from '@/assets/svg/icon_search-outline_outlined.svg'
import { ref, reactive, computed, watch, nextTick, shallowRef, unref } from 'vue'
import CheckPopoverSelect from '@/components/common/CheckPopoverSelect.vue'
import { useI18n } from '@/hooks/web/useI18n'
import { checkRepeat, listDatasources, save, update } from '@/api/datasource'
import { ElMessage, ElMessageBox, ElMessageBoxOptions } from 'element-plus-secondary'
import treeSort from '@/utils/treeSortUtils'
import type { DatasetOrFolder } from '@/api/dataset'
import { fetchOperatorListApi, fetchGroupListApi } from '@/api/auth'
import { cloneDeep } from 'lodash-es'
import nothingTree from '@/assets/img/nothing-tree.png'
import { useCache } from '@/hooks/web/useCache'
import { filterFreeFolder } from '@/utils/utils'
export interface Tree {
  name: string
  value?: string | number
  id: string | number
  nodeType: string
  createBy?: string
  level: number
  leaf?: boolean
  pid: string | number
  type?: string
  createTime: number
  children?: Tree[]
  request: any
}
const { t } = useI18n()
const { wsCache } = useCache()

const state = reactive({
  tData: []
})

const nodeType = ref()
const pid = ref()
const id = ref()
const oldName = ref()
const cmd = ref('')
const treeRef = ref()
const filterText = ref('')
const datasetForm = reactive({
  pid: '',
  name: ''
})
const searchEmpty = ref(false)

// 权限与描述相关状态（仅在 nodeType === 'dataset' 时生效）
const manageUsers = ref<string[]>([wsCache.get('user.biuid')])
const manageRoles = ref<string[]>([])
const viewUsers = ref<string[]>([wsCache.get('user.biuid')])
const viewRoles = ref<string[]>([])
const datasetDesc = ref('')
const userOptions = ref<any[]>([])
const roleOptions = ref<any[]>([])
// 缓存完整列表用于本地筛选
const allUsers = ref<any[]>([])
const allRoles = ref<any[]>([])
const loadingUsers = ref(false)
const loadingRoles = ref(false)
// 下拉复选显示项：统一映射为 {label, value}
const userCheckOptions = computed(() =>
  (userOptions.value || []).map(u => ({
    label: `${u.name || u.id}${u.loginName ? ' (' + u.loginName + ')' : ''}`,
    value: u.id
  }))
)
const roleCheckOptions = computed(() =>
  (roleOptions.value || []).map(r => ({
    label: r.name || r.id,
    value: r.id
  }))
)
const fetchUsers = async (keyword: string) => {
  loadingUsers.value = true
  try {
    if (!allUsers.value.length) {
      const res = await fetchOperatorListApi({ numberPerPage: 999999, currentPage: 1 })
      const rows = res?.data?.data?.rows || res?.data?.rows || []
      allUsers.value = rows
    }
    const kw = (keyword || '').trim().toLowerCase()
    userOptions.value = !kw
      ? allUsers.value
      : allUsers.value.filter(u => {
          const name = u.name.toLowerCase()
          return name.includes(kw)
        })
  } finally {
    loadingUsers.value = false
  }
}
const fetchRoles = async (keyword: string) => {
  loadingRoles.value = true
  try {
    if (!allRoles.value.length) {
      const res = await fetchGroupListApi({ state: 1, numberPerPage: 999999, currentPage: 1 })
      const rows = res?.data?.data?.rows || res?.data?.rows || []
      allRoles.value = rows
    }
    const kw = (keyword || '').trim().toLowerCase()
    roleOptions.value = !kw
      ? allRoles.value
      : allRoles.value.filter(r => {
          const name = (r.name || '').toLowerCase()
          return name.includes(kw)
        })
  } finally {
    loadingRoles.value = false
  }
}

const filterNode = (value: string, data: Tree) => {
  nextTick(() => {
    searchEmpty.value = treeRef.value.isEmpty
  })
  if (!value) return true
  return data.name.includes(value)
}

watch(filterText, val => {
  showAll.value = !val
  treeRef.value.filter(val)
  nextTick(() => {
    document.querySelectorAll('.node-text').forEach(ele => {
      const content = ele.getAttribute('title')
      ele.innerHTML = content.replace(val, `<span class="highLight">${val}</span>`)
    })
  })
})

const showPid = computed(() => {
  if (nodeType.value === 'folder' && !!pid.value) {
    return false
  }
  return !['rename', 'move'].includes(cmd.value) && !!pid.value
})

const labelName = computed(() => {
  return nodeType.value === 'folder'
    ? t('deDataset.folder_name')
    : t('data_source.data_source_name')
})

const dialogTitle = computed(() => {
  let title = ''
  switch (nodeType.value) {
    case 'folder':
      title = t('deDataset.new_folder')
      break
    case 'datasource':
      title = t('deDataset.create') + t('auth.datasource')
      break
    default:
      break
  }
  switch (cmd.value) {
    case 'move':
      title = t('chart.move_to')
      break
    case 'rename':
      title = t('chart.rename')
      break
    default:
      break
  }
  return title
})

const showName = computed(() => {
  return cmd.value !== 'move'
})

const placeholder = ref('')
const datasetFormRules = ref()
const activeAll = ref(false)
const showAll = ref(true)
const datasource = ref()
const loading = ref(false)
const createDataset = ref(false)
const filterMethod = (value, data) => {
  if (!data) return false
  data.name.includes(value)
}
const resetForm = () => {
  createDataset.value = false
  // 清空新加字段
  manageUsers.value = [wsCache.get('user.biuid')]
  manageRoles.value = []
  viewUsers.value = [wsCache.get('user.biuid')]
  viewRoles.value = []
  datasetDesc.value = ''
}
const originResourceTree = shallowRef([])

const sortTypeChange = sortType => {
  state.tData = treeSort(originResourceTree.value, sortType)
}
const dfs = (arr: Tree[]) => {
  arr.forEach(ele => {
    ele.value = ele.id
    if (ele.children?.length) {
      dfs(ele.children)
    }
  })
}
const nameValidator = (_, value, callback) => {
  // 名称校验：1~50 位，允许中文、字母、数字、下划线，并校验重名
  const NAME_REG = /^[\u4E00-\u9FA5A-Za-z0-9_]{1,50}$/
  if (!value || !NAME_REG.test(value)) {
    callback(new Error('请填写1~50位名称，允许汉字、字母、下划线、数字'))
    return
  } else {
    callback()
  }
}
let request = null
let dsType = ''
const sortList = ['time_asc', 'time_desc', 'name_asc', 'name_desc']
const createInit = (type, data: Tree, exec, name: string) => {
  pid.value = ''
  id.value = ''
  cmd.value = ''
  datasetForm.pid = ''
  datasetForm.name = ''
  nodeType.value = type
  filterText.value = ''
  placeholder.value =
    type === 'folder' ? t('data_source.a_folder_name') : t('data_source.data_source_name_de')
  dsType = data.type
  if (type === 'datasource') {
    request = data.request
  }
  if (data.id) {
    if (exec !== 'rename') {
      listDatasources({ leaf: false, id: data.id, weight: 7 }).then(res => {
        filterFreeFolder(res, 'datasource')
        dfs(res as unknown as Tree[])
        state.tData = (res as unknown as Tree[]) || []
        if (state.tData.length && state.tData[0].name === 'root' && state.tData[0].id === '0') {
          state.tData[0].name = t('data_source.data_source')
        }
        originResourceTree.value = cloneDeep(unref(state.tData))
        let curSortType = sortList[Number(wsCache.get('TreeSort-backend')) ?? 1]
        curSortType = wsCache.get('TreeSort-datasource') ?? curSortType
        sortTypeChange(curSortType)
      })
    }
    if (exec) {
      pid.value = data.pid
      id.value = data.id
      datasetForm.pid = data.pid as string
      datasetForm.name = data.name
      oldName.value = data.name
    } else {
      datasetForm.pid = data.id as string
      pid.value = data.id
    }
  }
  cmd.value = data.id ? exec : ''
  name && (datasetForm.name = name)
  createDataset.value = true
  datasetFormRules.value = {
    name: [
      {
        required: true,
        message: placeholder.value,
        trigger: 'change'
      },
      {
        required: true,
        message: placeholder.value,
        trigger: 'blur'
      },
      { required: true, trigger: 'blur', validator: nameValidator }
    ],
    pid: [
      {
        required: true,
        message: t('common.please_select'),
        trigger: 'blur'
      }
    ]
  }
  setTimeout(() => {
    datasource.value.clearValidate()
  }, 50)
  // 初始化一次选项列表
  fetchUsers('')
  fetchRoles('')
}

const editeInit = (param: Tree) => {
  pid.value = param.pid
  id.value = param.id
}

const props = {
  label: 'name',
  children: 'children',
  isLeaf: node => !node.children?.length
}

const nodeClick = (data: Tree) => {
  activeAll.value = false
  datasetForm.pid = data.id as string
}

const successCb = () => {
  wsCache.set('ds-new-success', true)
  datasource.value.resetFields()
  request = null
  datasetForm.pid = ''
  datasetForm.name = ''
  createDataset.value = false
}

const finallyCb = () => {
  loading.value = false
}
const checkPid = pid => {
  if (pid !== 0 && !pid) {
    ElMessage.error(t('data_source.the_destination_folder'))
    return false
  }
  return true
}
const saveDataset = () => {
  console.log('保存数据源')
  datasource.value.validate(result => {
    if (result) {
      const params: Omit<DatasetOrFolder, 'nodeType'> & { nodeType: 'folder' | 'datasource' } = {
        nodeType: nodeType.value as 'folder' | 'datasource',
        name: datasetForm.name.trim(),
        // 额外：权限与描述
        manageUserIds: manageUsers.value,
        manageRoleIds: manageRoles.value,
        viewUserIds: viewUsers.value,
        viewRoleIds: viewRoles.value,
        description: datasetDesc.value
      }
      switch (cmd.value) {
        case 'move':
          params.pid = activeAll.value ? '0' : (datasetForm.pid as string)
          params.id = id.value
          params.action = 'move'
          break
        case 'rename':
          params.pid = pid.value as string
          params.id = id.value
          params.action = 'rename'
          break
        default:
          params.pid = datasetForm.pid || pid.value || '0'
          params.action = 'create'
          break
      }
      if (cmd.value === 'rename' && oldName.value === params.name) {
        successCb()
        return
      }
      if (cmd.value === 'move' && !checkPid(params.pid)) {
        return
      }
      if (loading.value) {
        return
      }
      loading.value = true
      if (request) {
        let options = {
          confirmButtonType: 'danger',
          type: 'warning',
          autofocus: false,
          showClose: false,
          tip: ''
        }
        request.apiConfiguration = ''
        checkRepeat(request).then(res => {
          let method = request.id === '' ? save : update
          if (!request.type.startsWith('API') && request.type !== 'ExcelRemote') {
            request.syncSetting = null
          }
          if (res) {
            ElMessageBox.confirm(t('datasource.has_same_ds'), options as ElMessageBoxOptions)
              .then(() => {
                method({
                  ...request,
                  name: datasetForm.name,
                  pid: params.pid,
                  manageUserIds: params.manageUserIds,
                  manageRoleIds: params.manageRoleIds,
                  viewUserIds: params.viewUserIds,
                  viewRoleIds: params.viewRoleIds,
                  description: params.description
                })
                  .then(res => {
                    if (res !== undefined) {
                      wsCache.set('ds-new-success', true)
                      emits('handleShowFinishPage', { ...res, pid: params.pid })
                      ElMessage.success(t('data_source.source_saved_successfully'))
                      createDataset.value = false
                      successCb()
                    }
                  })
                  .finally(() => {
                    loading.value = false
                  })
              })
              .catch(() => {
                loading.value = false
                createDataset.value = false
              })
          } else {
            method({
              ...request,
              name: datasetForm.name,
              pid: params.pid,
              manageUserIds: params.manageUserIds,
              manageRoleIds: params.manageRoleIds,
              viewUserIds: params.viewUserIds,
              viewRoleIds: params.viewRoleIds,
              description: params.description
            })
              .then(res => {
                if (res !== undefined) {
                  wsCache.set('ds-new-success', true)
                  emits('handleShowFinishPage', { ...res, pid: params.pid })
                  ElMessage.success(t('data_source.source_saved_successfully'))
                  successCb()
                }
              })
              .finally(() => {
                loading.value = false
              })
          }
        })
        return
      } else {
        loading.value = false
      }
      emits('finishDs', params, successCb, finallyCb, cmd.value, dsType)
    }
  })
}

defineExpose({
  createInit,
  editeInit
})

const emits = defineEmits(['finishDs', 'handleShowFinishPage'])
</script>

<template>
  <el-dialog
    v-loading="loading"
    :title="dialogTitle"
    v-model="createDataset"
    :width="cmd === 'move' ? '600px' : '600px'"
    class="create-dialog"
    :before-close="resetForm"
  >
    <el-form
      label-position="top"
      require-asterisk-position="right"
      ref="datasource"
      @keydown.stop.prevent.enter
      :model="datasetForm"
      :rules="datasetFormRules"
    >
      <el-form-item v-if="showName" :label="labelName" prop="name">
        <el-input :placeholder="placeholder" v-model="datasetForm.name" />
      </el-form-item>
      <el-form-item v-show="false" :label="t('deDataset.folder')" prop="pid">
        <el-tree-select
          v-model="datasetForm.pid"
          :data="state.tData"
          popper-class="dataset-tree-select"
          style="width: 100%"
          :render-after-expand="false"
          :props="props"
          @node-click="nodeClick"
          :filter-method="filterMethod"
          filterable
        >
          <template #default="{ data: { name } }">
            <el-icon>
              <Icon name="dv-folder"><dvFolder class="svg-icon" /></Icon>
            </el-icon>
            <span :title="name">{{ name }}</span>
          </template>
        </el-tree-select>
      </el-form-item>
      <!-- 数据源描述 -->
      <el-form-item label="数据源描述">
        <el-input type="textarea" :rows="3" v-model="datasetDesc" placeholder="请输入" />
      </el-form-item>
      <!-- 管理权限（用户/群组 多选） 仅在新建/重命名时展示，不在移动时展示 -->
      <el-row class="ed-form-item" :gutter="12">
        <el-col :span="12">
          <el-form-item label="管理权限（用户）">
            <!-- <el-select
              v-model="manageUsers"
              multiple
              filterable
              :loading="loadingUsers"
              placeholder="请选择用户管理权限"
            >
              <el-option
                v-for="item in userOptions"
                :key="item.id || item.uid || item.userId"
                :label="item.name || item.username || item.nickName"
                :value="item.id || item.uid || item.userId"
              />
            </el-select> -->
            <CheckPopoverSelect
              v-model="manageUsers"
              :options="userCheckOptions"
              :loading="loadingUsers"
              placeholder="请选择用户管理权限"
              @search="fetchUsers"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="管理权限（群组）">
            <!-- <el-select
              v-model="manageRoles"
              multiple
              filterable
              :loading="loadingRoles"
              placeholder="请选择群组管理权限"
            >
              <el-option
                v-for="item in roleOptions"
                :key="item.id || item.rid"
                :label="item.name"
                :value="item.id || item.rid"
              />
            </el-select> -->
            <CheckPopoverSelect
              v-model="manageRoles"
              :options="roleCheckOptions"
              :loading="loadingRoles"
              placeholder="请选择群组管理权限"
              @search="fetchRoles"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <!-- 查看权限（用户/群组 多选） -->
      <el-row class="ed-form-item" :gutter="12">
        <el-col :span="12">
          <el-form-item label="查看权限（用户）">
            <!-- <el-select
              v-model="viewUsers"
              multiple
              filterable
              :loading="loadingUsers"
              placeholder="请选择用户查看权限"
            >
              <el-option
                v-for="item in userOptions"
                :key="item.id || item.uid || item.userId"
                :label="item.name || item.username || item.nickName"
                :value="item.id || item.uid || item.userId"
              />
            </el-select> -->
            <CheckPopoverSelect
              v-model="viewUsers"
              :options="userCheckOptions"
              :loading="loadingUsers"
              placeholder="请选择用户查看权限"
              @search="fetchUsers"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="查看权限（群组）">
            <!-- <el-select
              v-model="viewRoles"
              multiple
              filterable
              :loading="loadingRoles"
              placeholder="请选择群组查看权限"
            >
              <el-option
                v-for="item in roleOptions"
                :key="item.id || item.rid"
                :label="item.name"
                :value="item.id || item.rid"
              />
            </el-select> -->
            <CheckPopoverSelect
              v-model="viewRoles"
              :options="roleCheckOptions"
              :loading="loadingRoles"
              placeholder="请选择群组查看权限"
              @search="fetchRoles"
            />
          </el-form-item>
        </el-col>
      </el-row>
      <div v-if="cmd === 'move'">
        <el-input style="margin-bottom: 12px" v-model="filterText" clearable>
          <template #prefix>
            <el-icon>
              <Icon name="icon_search-outline_outlined"
                ><icon_searchOutline_outlined class="svg-icon"
              /></Icon>
            </el-icon>
          </template>
        </el-input>
        <div class="tree-content">
          <el-tree
            ref="treeRef"
            :filter-node-method="filterNode"
            filterable
            v-model="datasetForm.pid"
            menu
            empty-text=""
            :data="state.tData"
            :props="props"
            @node-click="nodeClick"
          >
            <template #default="{ data }">
              <span class="custom-tree-node">
                <el-icon style="font-size: 18px">
                  <Icon name="dv-folder"><dvFolder class="svg-icon" /></Icon>
                </el-icon>
                <span class="node-text" :title="data.name">{{ data.name }}</span>
              </span>
            </template>
          </el-tree>
          <div v-if="searchEmpty" class="empty-search">
            <img :src="nothingTree" />
            <span>{{ t('data_source.relevant_content_found') }}</span>
          </div>
        </div>
      </div>
    </el-form>
    <template #footer>
      <el-button secondary @click="resetForm">{{ t('dataset.cancel') }} </el-button>
      <el-button type="primary" @click="saveDataset">{{ t('dataset.confirm') }} </el-button>
    </template>
  </el-dialog>
</template>

<style lang="less" scoped>
.tree-content {
  width: 552px;
  height: 380px;
  border: 1px solid #dee0e3;
  border-radius: 4px;
  padding: 8px;
  overflow-y: auto;
  .custom-tree-node {
    display: flex;
    align-items: center;
    .node-text {
      margin-left: 8.75px;
      width: 120px;
      white-space: nowrap;
      text-overflow: ellipsis;
      overflow: hidden;
      :deep(.highLight) {
        color: var(--el-color-primary, #33BDFC);
      }
    }
  }

  .empty-search {
    width: 100%;
    margin-top: 57px;
    display: flex;
    flex-direction: column;
    align-items: center;
    img {
      width: 100px;
      height: 100px;
      margin-bottom: 8px;
    }
    span {
      font-family: var(--de-custom_font, 'PingFang');
      font-size: 14px;
      font-weight: 400;
      line-height: 22px;
      color: #646a73;
    }
  }
}
</style>
<style lang="less">
.dataset-tree-select {
  .ed-select-dropdown__item {
    display: flex;
    align-items: center;
    .ed-icon {
      margin-right: 5px;
    }
  }
}
</style>
