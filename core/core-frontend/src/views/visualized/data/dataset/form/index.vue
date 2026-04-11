<!-- eslint-disable -->
<script lang="tsx" setup>
/* eslint-disable */
import dvFolder from '@/assets/svg/dv-folder.svg'
import icon_left_outlined from '@/assets/svg/icon_left_outlined.svg'
import icon_right_outlined from '@/assets/svg/icon_right_outlined.svg'
import referenceTable from '@/assets/svg/reference-table.svg'
import icon_organization_outlined from '@/assets/svg/icon_organization_outlined.svg'
import icon_searchOutline_outlined from '@/assets/svg/icon_search-outline_outlined.svg'
import icon_sql_outlined_1 from '@/assets/svg/icon_sql_outlined_1.svg'
import icon_warning_colorful from '@/assets/svg/icon_warning_colorful.svg'
import icon_add_outlined from '@/assets/svg/icon_add_outlined.svg'
import icon_refresh_outlined from '@/assets/svg/icon_refresh_outlined.svg'
import icon_expandRight_filled from '@/assets/svg/icon_expand-right_filled.svg'
import icon_switch_outlined from '@/assets/svg/icon_switch_outlined.svg'
import icon_copy_outlined from '@/assets/svg/icon_copy_outlined.svg'
import icon_deleteTrash_outlined from '@/assets/svg/icon_delete-trash_outlined.svg'
import icon_edit_outlined from '@/assets/svg/icon_edit_outlined.svg'
import icon_info_outlined from '@/assets/svg/icon_info_outlined.svg'
import dayjs from 'dayjs'
import {
  iconFieldCalculatedMap,
  iconFieldCalculatedQMap
} from '@/components/icon-group/field-calculated-list'
import { enumValueDs } from '@/api/dataset'
import {
  ref,
  toRaw,
  unref,
  nextTick,
  reactive,
  shallowRef,
  computed,
  watch,
  provide,
  h,
  onMounted,
  onBeforeUnmount
} from 'vue'
import { useCache } from '@/hooks/web/useCache'
import { useI18n } from '@/hooks/web/useI18n'
import { useEmitt } from '@/hooks/web/useEmitt'
import { ElIcon, ElMessageBox, ElMessage } from 'element-plus-secondary'
import FixedSizeList from 'element-plus-secondary/es/components/virtual-list/src/components/fixed-size-list.mjs'
import type { Action } from 'element-plus-secondary'
import FieldMore from './FieldMore.vue'
import EmptyBackground from '@/components/empty-background/src/EmptyBackground.vue'
import { Icon } from '@/components/icon-custom'
import { useWindowSize } from '@vueuse/core'
import CalcFieldEdit from './CalcFieldEdit.vue'
import { useRoute, useRouter } from 'vue-router_2'
import UnionEdit from './UnionEdit.vue'
import type { FormInstance } from 'element-plus-secondary'
import type { BusiTreeNode } from '@/models/tree/TreeNode'
import CreatDsGroup from './CreatDsGroup.vue'
import CreatDsGroupDataSource from '../../datasource/form/CreatDsGroup.vue'
import { guid, getFieldName, timeTypes, type DataSource } from './util'
import { fieldType } from '@/utils/attr'
import { cancelMap } from '@/config/axios/service'
import { useEmbedded } from '@/store/modules/embedded'
import { useAppStoreWithOut } from '@/store/modules/app'
import {
  getDatasourceList,
  getTables,
  getPreviewData,
  getDatasetDetails,
  saveDatasetTree,
  barInfoApi,
  getDimensionList,
  getIndexList
} from '@/api/dataset'
import {
  isShowFinishPage
} from '@/api/datasource'
import type { Table } from '@/api/dataset'
import DatasetUnion from './DatasetUnion.vue'
import { cloneDeep, debounce } from 'lodash-es'
import { XpackComponent } from '@/components/plugin'
import { iconFieldMap } from '@/components/icon-group/field-list'
import { iconDatasourceMap } from '@/components/icon-group/datasource-list'
import ExcelDetail from '../../datasource/form/ExcelDetail.vue'
import type { Param } from '../../datasource/form/ExcelDetail.vue'
import watermark from '@/utils/waterMark'
interface DragEvent extends MouseEvent {
  dataTransfer: DataTransfer
}

interface Field {
  fieldShortName: string
  name: string
  dataeaseName: string
  originName: string
  deType: number
}
const { wsCache } = useCache()
const appStore = useAppStoreWithOut()
const embeddedStore = useEmbedded()
const { t } = useI18n()
const route = useRoute()
const { push } = useRouter() || {
  push: val => {
    if (embeddedStore.getToken) return
    window.location.href = val as string
  }
}
const quotaTableHeight = ref(238)
const creatDsFolder = ref()
const creatDsFolderDataSource = ref()
const editCalcField = ref(false)
const calcEdit = ref()
const editUnion = ref(false)
const datasetDrag = ref()
const excelVisible = ref(false)
const excel = ref()
const editDs = ref(false)
const isSupportSetKey = ref(false)
const showFinishPage = ref(false)
const pid = ref('0')
const isFullscreen = ref(false)
const defaultForm2 = {
  type: 'Excel',
  id: '0',
  editType: 0,
  name: '',
  creator: '',
  configuration: {}
}
const form2 = reactive<Param>(cloneDeep(defaultForm2))
const handleCloseIframe = () => {
  router.replace({
    path: '/loading'
  })
  nextTick(() => {
    parent.window.postMessage({type: 'closeBoard', data: {}}, '*')
  })
}
const beforeClose = () => {
  if (route.query.dialog === 'datasource') {
    handleCloseIframe()
  } else {
    excelVisible.value = false
  }
}

const complete = (params, successCb, finallyCb) => {
  excel.value.saveExcelDs(
    params,
    () => {
      pid.value = params.pid
      successCb()
    },
    finallyCb
  )
}

const saveDS = () => {
  excel.value.uploadStatus(false)
  if (!excel.value.sheetFile?.name) {
    excel.value.uploadStatus(true)
    return
  }
  const validate = excel.value.submitForm()
  validate(val => {
    if (val) {
      if (editDs.value) {
        complete(null, null, null)
      } else {
        creatDsFolderDataSource.value.createInit('datasource', { id: pid.value }, '', form2.name)
      }
    }
  })
  return
}
const datasetName = ref(t('data_set.unnamed_dataset'))
const tabActive = ref('preview')
const activeName = ref('')
const dataSource = ref('')
const searchTable = ref('')
const showInput = ref(false)
const dsLoading = ref(false)
const LeftWidth = ref(240)
const offsetX = ref(0)
const offsetY = ref(0)
const showLeft = ref(true)
const maskShow = ref(false)
const loading = ref(false)
const updateCustomTime = ref(false)
const editorName = ref()
const nameMap = ref({})
const currentField = ref({
  dateFormat: '',
  id: '',
  dateFormatType: '',
  name: '',
  idArr: []
})
const isCross = ref(false)
let isUpdate = false

const fieldTypes = index => {
  return [
    t('dataset.text'),
    t('dataset.time'),
    t('dataset.value'),
    t('dataset.value') + '(' + t('dataset.float') + ')',
    t('dataset.value'),
    t('dataset.location')
  ][index]
}

const changeUpdate = () => {
  isUpdate = true
}

const fieldOptions = [
  { label: t('dataset.text'), value: 0 },
  {
    label: t('dataset.time'),
    value: 1,
    children: [
      {
        value: 'yyyyMM',
        label: 'yyyyMM'
      },
      {
        value: 'yyyy-MM',
        label: 'yyyy-MM'
      },
      {
        value: 'yyyy/MM',
        label: 'yyyy/MM'
      },
      {
        value: 'yyyyMMdd',
        label: 'yyyyMMdd'
      },
      {
        value: 'yyyy-MM-dd',
        label: 'yyyy-MM-dd'
      },
      {
        value: 'yyyy/MM/dd',
        label: 'yyyy/MM/dd'
      },
      {
        value: 'yyyy-MM-dd HH:mm:ss',
        label: 'yyyy-MM-dd HH:mm:ss'
      },
      {
        value: 'yyyy/MM/dd HH:mm:ss',
        label: 'yyyy/MM/dd HH:mm:ss'
      },
      {
        value: 'custom',
        label: t('visualization.custom')
      }
    ]
  },
  { label: t('dataset.location'), value: 5 },
  { label: t('dataset.value'), value: 2 },
  {
    label: t('dataset.value') + '(' + t('dataset.float') + ')',
    value: 3
  },
  { label: 'URL', value: 7 }
]

const fieldOptionsText = [
  { label: t('dataset.text'), value: 0 },
  {
    label: t('dataset.time'),
    value: 1
  },
  { label: t('dataset.location'), value: 5 },
  { label: t('dataset.value'), value: 2 },
  {
    label: t('dataset.value') + '(' + t('dataset.float') + ')',
    value: 3
  },
  { label: 'URL', value: 7 }
]

const ruleFormRef = ref<FormInstance>()
const ruleFormFieldRef = ref<FormInstance>()

const rules = {
  name: [{ required: true, message: t('data_set.cannot_be_empty_time'), trigger: 'blur' }]
}

const fieldRules = {
  name: [{ required: true, message: t('dataset.input_edit_name'), trigger: 'blur' }]
}

const sqlNode = reactive<Table>({
  datasourceId: '',
  extDatasourceId: '',
  name: '',
  tableName: t('data_set.custom_sql'),
  type: 'sql'
})

let nodeInfo = {
  id: '',
  pid: '',
  name: ''
}

const defaultProps = {
  children: 'children',
  label: 'label'
}
const dragHeight = ref(260)

let tableList = []

const dfsName = (arr, id) => {
  let name = ''
  arr.some(ele => {
    if (ele.id === id) {
      name = ele.name
      return true
    }

    if (!!ele.children?.length) {
      name = dfsName(ele.children, id) || name
    }
    return false
  })

  return name
}

const { height } = useWindowSize()

const dfsChild = arr => {
  return arr.filter(ele => {
    if (ele.leaf) {
      return true
    }
    if (!!ele.children?.length) {
      ele.children = dfsChild(ele.children || [])
    }
    return !!ele.children?.length
  })
}

const getDsName = (id: string) => {
  return dfsName(state.dataSourceList, id)
}
const router = useRouter()
const pushDataset = () => {
  if (route.query.from && route.query.from === 'dashboard') {
    router.back()
  } else {
    var eventnData = {type: 'closeBoard', data: {}};
    parent.window.postMessage(eventnData, '*')
    wsCache.set(`dataset-info-id`, nodeInfo.id)
    if (appStore.isDataEaseBi) {
      embeddedStore.clearState()
      useEmitt().emitter.emit('changeCurrentComponent', 'Dataset')
      return
    }
    router.push({
      path: '/loading'
    })
  }

  // const routeName = embeddedStore.getToken && appStore.getIsIframe ? 'dataset-embedded' : 'dataset'
  // if (!!history.state.back && !appStore.getIsIframe) {
  //   history.back()
  // } else {
  //   push({
  //     name: routeName,
  //     params: {
  //       id: nodeInfo.id
  //     }
  //   })
  // }
}

const backToMain = () => {
  if (isUpdate) {
    ElMessageBox.confirm(t('data_set.want_to_exit'), {
      confirmButtonText: t('dataset.confirm'),
      cancelButtonText: t('common.cancel'),
      showCancelButton: true,
      confirmButtonType: 'primary',
      type: 'warning',
      autofocus: false,
      showClose: false
    }).then(() => {
      pushDataset()
    })
  } else {
    pushDataset()
  }
}

const closeCustomTime = () => {
  if (!!currentField.value.idArr.length) {
    const { idArr } = currentField.value
    allfields.value.forEach(ele => {
      if (idArr.includes(ele.id)) {
        Object.assign(ele, { deTypeArr: [...oldArrValue] })
      }
    })
    delete currentField.value.name
    recoverSelection()
  } else {
    dimensions.value.concat(quota.value).some(ele => {
      if (ele.id === currentField.value.id) {
        delete currentField.value.name
        Object.assign(ele, { deTypeArr: [...oldArrValue] })
        return true
      }
      return false
    })
  }
  currentField.value.idArr = []
  currentField.value.id = ''
  updateCustomTime.value = false
}

const confirmCustomTime = () => {
  if (!!currentField.value.idArr.length) {
    const { name, idArr } = currentField.value
    allfields.value.forEach(ele => {
      if (idArr.includes(ele.id)) {
        Object.assign(ele, {
          deType: 1,
          dateFormatType: 'custom',
          dateFormat: name,
          deTypeArr: [1, 'custom']
        })
      }
    })
    delete currentField.value.name
    recoverSelection()
    updateCustomTime.value = false
  } else {
    ruleFormRef.value.validate(valid => {
      if (valid) {
        dimensions.value.concat(quota.value).some(ele => {
          if (ele.id === currentField.value.id) {
            ele.dateFormat = currentField.value.name
            ele.deType = 1
            ele.dateFormatType = 'custom'
            return true
          }
          return false
        })
        updateCustomTime.value = false
      }
    })
  }
}

watch(searchTable, val => {
  datasourceTableData.value = tableList.filter(ele =>
    ele.tableName.toLowerCase().includes(val.toLowerCase())
  )
})
const editeSave = () => {
  const union = []
  loading.value = true
  dfsNodeList(union, datasetDrag.value.getNodeList())
  console.log('union', union)
  saveDatasetTree({
    ...nodeInfo,
    name: datasetName.value,
    union,
    isCross: isCross.value,
    allFields: allfields.value,
    nodeType: 'dataset'
  })
    .then(() => {
      isUpdate = false
      if (willBack) {
        pushDataset()
      } else {
        ElMessage.success(t('data_set.saved_successfully'))
      }
    })
    .finally(() => {
      loading.value = false
    })
}

const handleFieldMore = (ele, type) => {
  changeUpdate()
  if (tabActive.value === 'manage') {
    dimensionsSelection.value = dimensionsTable.value.getSelectionRows().map(ele => ele.id)
    quotaSelection.value = quotaTable.value.getSelectionRows().map(ele => ele.id)
  }
  const arr = ['text', 'time', 'value', 'float', 'value', 'location', 'binary', 'url']
  if (arr.includes(type as string)) {
    ele.deType = arr.indexOf(type)
    ele.dateFormat = ''
    return
  }
  if (timeTypes.includes(type as string)) {
    currentField.value.dateFormat = ele.dateFormat
    currentField.value.dateFormatType = ele.dateFormatType

    ele.deType = 1
    ele.dateFormatType = type
    ele.dateFormat = type
  }
  switch (type) {
    case 'copy':
      if (ele.extField === 3) {
        copyGroupField(ele)
      } else {
        copyField(ele)
      }
      break
    case 'delete':
      deleteField(ele)
      break
    case 'translate':
      dqTrans(ele.id)
      break
    case 'editor':
      if (ele.extField === 3) {
        initGroupField(ele)
      } else {
        editField(ele)
      }
      break
    case 'rename':
      renameField(ele)
      break
    case 'custom':
      currentField.value.id = ele.id
      updateCustomTime.value = true
      break
    default:
      break
  }

  if (tabActive.value === 'manage') {
    recoverSelection()
  }
}

const dqTrans = id => {
  const obj = allfields.value.find(ele => ele.id === id)
  obj.groupType = obj.groupType === 'd' ? 'q' : 'd'
}

const dqTransArr = groupType => {
  const idArr = fieldSelection.value.map(ele => ele.id)
  allfields.value.forEach(ele => {
    if (idArr.includes(ele.id)) {
      ele.groupType = groupType
    }
  })
  recoverSelection()
}

const copyField = item => {
  const param = cloneDeep(item)
  param.id = guid()
  param.extField = 2
  param.originName = item.extField === 2 ? item.originName : '[' + item.id + ']'
  param.name = getFieldName(dimensions.value.concat(quota.value), item.name)
  param.dataeaseName = null
  param.lastSyncTime = null
  const index = allfields.value.findIndex(ele => ele.id === item.id)
  allfields.value.splice(index + 1, 0, param)
}

const selectable = row => ![3].includes(row.extField)

const copyGroupField = item => {
  const param = cloneDeep(item)
  param.id = guid()
  param.name = getFieldName(dimensions.value.concat(quota.value), item.name)
  const index = allfields.value.findIndex(ele => ele.id === item.id)
  allfields.value.splice(index + 1, 0, param)
}

const delFieldById = arr => {
  const delId = [...arr]
  while (delId.length) {
    const [targetId] = delId
    delId.shift()
    allfields.value = allfields.value.filter(ele => ele.id !== targetId)
    const paramsId = allfields.value.reduce((pre, next) => {
      if (next.extField === 2) {
        pre = [...pre, ...(next.params || []).map(element => element.id)]
      }
      return pre
    }, [])
    const allfieldsId = allfields.value.map(ele => ele.id).concat(paramsId)
    allfields.value = allfields.value.filter(ele => {
      if (![2, 3].includes(ele.extField)) return true
      const idMap = ele.originName.match(/\[(.+?)\]/g) || []
      if (!idMap) return true
      const result = idMap.every(itm => {
        const id = itm.slice(1, -1)
        return allfieldsId.includes(id)
      })
      if (result) return true
      delId.push(ele.id)
      return false
    })
  }

  delGroupIds()
}

const delFieldByIdFake = (arr, fakeAllfields) => {
  const delId = [...arr]
  let idList = []
  while (delId.length) {
    const [targetId] = delId
    delId.shift()
    fakeAllfields = fakeAllfields.filter(ele => ele.id !== targetId)
    const allfieldsId = fakeAllfields.map(ele => ele.id)
    fakeAllfields = fakeAllfields.filter(ele => {
      if (![2, 3].includes(ele.extField)) return true
      const idMap = ele.originName.match(/\[(.+?)\]/g) || []
      if (
        !idMap ||
        idMap.every(itx => ele.params?.map(element => element.id).includes(itx.slice(1, -1)))
      )
        return true
      const result = idMap.every(itm => {
        const id = itm.slice(1, -1)
        return allfieldsId.includes(id)
      })
      if (result) return true
      delId.push(ele.id)
      idList.push(ele.id)
      return false
    })
  }

  return idList
}

const deleteField = item => {
  let tip = ''
  const idArr = allfields.value.reduce((pre, next) => {
    if (![2, 3].includes(next.extField)) return pre
    let idMap = next.originName.match(/\[(.+?)\]/g) || []
    idMap = idMap.filter(itx => !next.params?.map(element => element.id).includes(itx.slice(1, -1)))
    const result = idMap.map(itm => {
      return itm.slice(1, -1)
    })
    pre = [...result, ...pre]
    return pre
  }, [])
  tip = idArr.includes(item.id) ? t('data_set.deleted_confirm_deletion') : ''
  ElMessageBox.confirm(t('data_set.delete_field_a', { a: item.name }), {
    confirmButtonText: t('dataset.confirm'),
    tip,
    cancelButtonText: t('common.cancel'),
    showCancelButton: true,
    confirmButtonType: 'danger',
    type: 'warning',
    autofocus: false,
    showClose: false,
    callback: (action: Action) => {
      if (action === 'confirm') {
        delFieldById([item.id])
        datasetDrag.value.dfsNodeFieldBackReal(item)
        ElMessage({
          message: t('chart.delete_success'),
          type: 'success'
        })
      }
    }
  })
}

const addCalcField = groupType => {
  editCalcField.value = true
  calcTitle.value = t('dataset.add_calc_field')
  nextTick(() => {
    calcEdit.value.initEdit(
      { groupType, id: guid() },
      dimensions.value.filter(ele => ele.extField !== 3),
      quota.value.filter(ele => ele.extField !== 3)
    )
  })
}

const editNormalField = ref(false)
const currentNormalField = ref({
  id: '',
  name: ''
})

const renameField = item => {
  const { id, name } = item
  currentNormalField.value = {
    id,
    name
  }
  editNormalField.value = true
}

const calcTitle = ref('')

const editField = item => {
  editCalcField.value = true
  nextTick(() => {
    calcTitle.value = t('dataset.edit_calc_field')
    calcEdit.value.initEdit(item, dimensions.value, quota.value)
  })
}

const closeNormalField = () => {
  currentNormalField.value.id = ''
  currentNormalField.value.name = ''
  editNormalField.value = false
}

const confirmNormalField = () => {
  ruleFormFieldRef.value.validate(val => {
    if (val) {
      allfields.value.some(ele => {
        if (ele.id === currentNormalField.value.id) {
          ele.name = currentNormalField.value.name
          return true
        }
        return false
      })
      closeNormalField()
    }
  })
}

const closeEditCalc = () => {
  editCalcField.value = false
}

const confirmEditCalc = () => {
  calcEdit.value.formField.validate(val => {
    if (val) {
      calcEdit.value.setFieldForm()
      if (!calcEdit.value.fieldForm.originName.trim()) {
        ElMessage.error(t('data_set.cannot_be_empty_de_'))
        return
      }
      const obj = cloneDeep(calcEdit.value.fieldForm)
      const { deType, dateFormat, deExtractType } = obj
      obj.dateFormat = deType === 1 ? dateFormat : ''
      obj.dateFormatType = deType === 1 ? dateFormat : ''
      obj.deTypeArr = deType === 1 && deExtractType === 0 ? [deType, dateFormat] : [deType]
      const result = allfields.value.findIndex(ele => obj.id === ele.id)
      if (result !== -1) {
        allfields.value.splice(result, 1, obj)
      } else {
        allfields.value.push(obj)
      }
      editCalcField.value = false
    }
  })
}

const generateColumns = (arr: Field[]) =>
  arr.map(ele => ({
    key: ele.dataeaseName,
    deType: ele.deType,
    dataKey: ele.dataeaseName,
    title: ele.name,
    width: 150,
    headerCellRenderer: ({ column }) => (
      <div class="flex-align-center">
        <ElIcon>
          <Icon>
            {h(iconFieldMap[fieldType[column.deType]], {
              class: `svg-icon field-icon-${fieldType[column.deType]}`
            })}
          </Icon>
        </ElIcon>
        <span class="ellipsis" title={column.title} style={{ width: '120px', marginLeft: '4px' }}>
          {column.title}
        </span>
      </div>
    )
  }))

const dsChange = (val: string) => {
  dsLoading.value = true
  sqlNode.datasourceId = dataSource.value
  return getTables({ datasourceId: val })
    .then(res => {
      tableList = res || []
      datasourceTableData.value = [...tableList]
      sqlNode.extDatasourceId = tableList[0]?.extDatasourceId
      sqlNode.datasourceId = tableList[0]?.datasourceId
    })
    .finally(() => {
      dsLoading.value = false
    })
}

const getTableName = async (datasourceId, tableName) => {
  await dsChange(datasourceId)
  if (!!tableName) {
    searchTable.value = tableName
  }
}
const isEdit = ref(false)
const datasetCheckRef = ref()
const initEdite = async () => {
  let { id, datasourceId, tableName } = route.query
  let { id: copyId } = route.params
  if (appStore.getIsDataEaseBi) {
    id = embeddedStore.datasetId
    datasourceId = embeddedStore.datasourceId
    tableName = embeddedStore.tableName
    copyId = embeddedStore.datasetCopyId || copyId
  }
  isEdit.value = false
  if (copyId || id) {
    const barRes = await barInfoApi(copyId || id)
    if (!barRes || !barRes['id']) {
      return
    }
    isEdit.value = true
  }
  if (datasourceId) {
    dataSource.value = datasourceId as string
    getTableName(datasourceId as string, tableName)
  }
  if (!id && !copyId) return

  loading.value = true
  try {
    const res = await getDatasetDetails(copyId || id)
    loading.value = false
    let arr = []
    const { pid, name } = res || {}
    nodeInfo = {
      id: res?.id || null,
      pid,
      name: copyId ? t('data_set.copy_a_dataset') : name
    }
    if (copyId) {
      nodeInfo.id = ''
    }
    datasetName.value = nodeInfo.name
    allfields.value = res.allFields || []
    isCross.value = res.isCross || false
    dfsUnion(arr, res.union || [])
    const [fir] = res.union as { currentDs: { extDatasourceId: string } }[]
    dataSource.value = fir?.currentDs?.extDatasourceId
    dsChange(dataSource.value)
    datasetDrag.value.initState(arr)
  } catch (error) {
    console.error(error)
    loading.value = false
  }
}

const joinEditor = (arr: []) => {
  state.editArr = cloneDeep(arr)
  editUnion.value = true
  nextTick(() => {
    fieldUnion.value.initState()
  })
}

const columns = shallowRef([])
const tableData = shallowRef([])
const quota = computed(() => {
  return allfields.value.filter(ele => ele.groupType === 'q')
})

const dimensions = computed(() => {
  return allfields.value.filter(ele => ele.groupType === 'd')
})

type WarehouseDialogType = 'dimension' | 'quota'

interface WarehouseRelationItem {
  id: string
  name: string
  creator: string
  status: string
  projectSource: string
  category?: string
  enumValues?: string
  hiveTableName?: string
  measureType?: string
  atomName?: string
  driveName?: string
}

const warehouseRelationMockMap: Record<WarehouseDialogType, WarehouseRelationItem[]> = {
  dimension: [
    {
      id: 'DIM_001',
      name: '省份维度',
      category: '地域',
      enumValues: '四川、上海、北京……',
      hiveTableName: 'table_area',
      status: '启用',
      creator: 'admin',
      projectSource: '测试项目'
    },
    {
      id: 'DIM_002',
      name: '城市维度',
      category: '地域',
      enumValues: '成都、上海、北京……',
      hiveTableName: 'table_city',
      status: '启用',
      creator: 'admin',
      projectSource: '测试项目'
    },
    {
      id: 'DIM_003',
      name: '渠道维度',
      category: '经营',
      enumValues: '直营网、代理商、电商……',
      hiveTableName: 'table_channel',
      status: '草稿',
      creator: 'zhangsan',
      projectSource: '营销项目'
    },
    {
      id: 'DIM_004',
      name: '客户等级维度',
      category: '客户',
      enumValues: 'A、B、C、D',
      hiveTableName: 'table_customer_level',
      status: '启用',
      creator: 'lisi',
      projectSource: '客户画像'
    },
    {
      id: 'DIM_005',
      name: '品牌维度',
      category: '商品',
      enumValues: '品牌A、品牌B、品牌C',
      hiveTableName: 'table_brand',
      status: '启用',
      creator: 'admin',
      projectSource: '商品中心'
    },
    {
      id: 'DIM_006',
      name: '门店维度',
      category: '组织',
      enumValues: '一店、二店、三店……',
      hiveTableName: 'table_store',
      status: '停用',
      creator: 'wangwu',
      projectSource: '门店经营'
    },
    {
      id: 'DIM_007',
      name: '产品线维度',
      category: '商品',
      enumValues: '终端、宽带、家庭云……',
      hiveTableName: 'table_product_line',
      status: '启用',
      creator: 'admin',
      projectSource: '商品中心'
    },
    {
      id: 'DIM_008',
      name: '账期维度',
      category: '财务',
      enumValues: '202401、202402、202403……',
      hiveTableName: 'table_billing_period',
      status: '启用',
      creator: 'finance',
      projectSource: '财务项目'
    },
    {
      id: 'DIM_009',
      name: '套餐维度',
      category: '商品',
      enumValues: '基础版、标准版、旗舰版',
      hiveTableName: 'table_package',
      status: '草稿',
      creator: 'product',
      projectSource: '产品运营'
    },
    {
      id: 'DIM_010',
      name: '用户类型维度',
      category: '客户',
      enumValues: '个人、家庭、企业',
      hiveTableName: 'table_user_type',
      status: '启用',
      creator: 'admin',
      projectSource: '客户画像'
    },
    {
      id: 'DIM_011',
      name: '是否活跃维度',
      category: '行为',
      enumValues: '是、否',
      hiveTableName: 'table_active_flag',
      status: '启用',
      creator: 'operation',
      projectSource: '运营项目'
    },
    {
      id: 'DIM_012',
      name: '终端品牌维度',
      category: '设备',
      enumValues: '华为、小米、苹果……',
      hiveTableName: 'table_device_brand',
      status: '启用',
      creator: 'admin',
      projectSource: '终端中心'
    }
  ],
  quota: [
    {
      id: 'MEA_001',
      name: '销售额指标',
      measureType: '收入类',
      atomName: '订单金额',
      driveName: '月累计销售额',
      status: '启用',
      creator: 'admin',
      projectSource: '测试项目'
    },
    {
      id: 'MEA_002',
      name: '订购用户数指标',
      measureType: '用户类',
      atomName: '订购用户数',
      driveName: '月累计订购用户数',
      status: '启用',
      creator: 'admin',
      projectSource: '用户增长'
    },
    {
      id: 'MEA_003',
      name: '活跃用户数指标',
      measureType: '用户类',
      atomName: '活跃用户数',
      driveName: '周活跃用户数',
      status: '草稿',
      creator: 'operation',
      projectSource: '运营项目'
    },
    {
      id: 'MEA_004',
      name: 'ARPU指标',
      measureType: '收入类',
      atomName: '用户收入',
      driveName: '月ARPU',
      status: '启用',
      creator: 'finance',
      projectSource: '财务项目'
    },
    {
      id: 'MEA_005',
      name: '离网率指标',
      measureType: '质量类',
      atomName: '离网用户数',
      driveName: '月离网率',
      status: '启用',
      creator: 'admin',
      projectSource: '经营分析'
    },
    {
      id: 'MEA_006',
      name: '新增用户数指标',
      measureType: '用户类',
      atomName: '新增用户数',
      driveName: '日新增用户数',
      status: '启用',
      creator: 'zhangsan',
      projectSource: '用户增长'
    },
    {
      id: 'MEA_007',
      name: '投诉工单量指标',
      measureType: '服务类',
      atomName: '投诉工单数',
      driveName: '周投诉工单量',
      status: '停用',
      creator: 'service',
      projectSource: '客服中心'
    },
    {
      id: 'MEA_008',
      name: '宽带装机量指标',
      measureType: '安装类',
      atomName: '装机单量',
      driveName: '月宽带装机量',
      status: '启用',
      creator: 'admin',
      projectSource: '宽带项目'
    },
    {
      id: 'MEA_009',
      name: '流量消耗指标',
      measureType: '使用类',
      atomName: '总流量',
      driveName: '月人均流量',
      status: '启用',
      creator: 'product',
      projectSource: '产品运营'
    },
    {
      id: 'MEA_010',
      name: '套餐转化率指标',
      measureType: '转化类',
      atomName: '转化订单数',
      driveName: '套餐转化率',
      status: '草稿',
      creator: 'marketing',
      projectSource: '营销项目'
    },
    {
      id: 'MEA_011',
      name: '终端销量指标',
      measureType: '销售类',
      atomName: '销量',
      driveName: '月终端销量',
      status: '启用',
      creator: 'admin',
      projectSource: '终端中心'
    },
    {
      id: 'MEA_012',
      name: '回款金额指标',
      measureType: '财务类',
      atomName: '回款金额',
      driveName: '月回款金额',
      status: '启用',
      creator: 'finance',
      projectSource: '财务项目'
    }
  ]
}

const warehouseRelationDialog = reactive({
  visible: false,
  loading: false,
  type: 'dimension' as WarehouseDialogType,
  searchField: 'creator',
  keyword: '',
  currentPage: 1,
  pageSize: 10
})

const warehouseRelationList = ref<WarehouseRelationItem[]>([])
const warehouseRelationTargetField = shallowRef<any>(null)

const warehouseDialogTitle = computed(() => {
  return warehouseRelationDialog.type === 'dimension' ? '选择维度' : '选择指标'
})

const warehouseRelationSearchOptions = computed(() => {
  if (warehouseRelationDialog.type === 'dimension') {
    return [
      { label: '按维度名称搜索', value: 'name' },
      { label: '按维度分类搜索', value: 'category' },
      { label: '按创建人搜索', value: 'creator' },
    ]
  }
  return [
    { label: '按指标名称搜索', value: 'name' },
    { label: '按指标分类搜索', value: 'measureType' },
    { label: '按创建人搜索', value: 'creator' },
  ]
})

const warehouseRelationSearchPlaceholder = computed(() => {
  const option = warehouseRelationSearchOptions.value.find(
    ele => ele.value === warehouseRelationDialog.searchField
  )
  return option?.label || '请输入搜索内容'
})

const warehouseRelationPagedList = computed(() => {
  const start = (warehouseRelationDialog.currentPage - 1) * warehouseRelationDialog.pageSize
  const end = start + warehouseRelationDialog.pageSize
  return warehouseRelationList.value.slice(start, end)
})

const getWarehouseRelationRowClassName = ({ row }) => {
  if (row.id === warehouseRelationTargetField.value?.warehouseFieldId) {
    return 'warehouse-relation-selected-row'
  }
  return ''
}

const toWarehouseRelationItem = (item, type: WarehouseDialogType): WarehouseRelationItem => {
  const getValue = (keys: string[]) => {
    const key = keys.find(it => item?.[it] !== undefined && item?.[it] !== null)
    return key ? item[key] : ''
  }

  const isDimension = type === 'dimension'
  return {
    id: `${getValue(['id', 'dimensionId', 'measureId', 'warehouseId'])}`,
    name: `${getValue(['name', 'dimensionName', 'measureName', 'indexName'])}`,
    creator: `${getValue(['creator', 'createBy', 'createUser', 'operator'])}`,
    status: `${getValue(['status', 'state'])}`,
    projectSource: `${getValue(['projectSource', 'projectName', 'sourceProject'])}`,
    category: isDimension ? `${getValue(['category', 'dimensionCategory'])}` : undefined,
    enumValues: isDimension ? `${getValue(['enumValues', 'dimensionEnumValues'])}` : undefined,
    hiveTableName: isDimension ? `${getValue(['hiveTableName', 'hiveName'])}` : undefined,
    measureType: !isDimension ? `${getValue(['measureType', 'indexType', 'category'])}` : undefined,
    atomName: !isDimension ? `${getValue(['atomName', 'atomMeasureName'])}` : undefined,
    driveName: !isDimension ? `${getValue(['driveName', 'derivedMeasureName'])}` : undefined
  }
}

const parseWarehouseApiList = (resData, type: WarehouseDialogType): WarehouseRelationItem[] => {
  const payload = resData?.data ?? resData ?? {}
  const rawList = Array.isArray(payload)
    ? payload
    : payload?.list ||
      payload?.rows ||
      payload?.records ||
      payload?.items ||
      payload?.content ||
      payload?.data ||
      []
  if (!Array.isArray(rawList)) return []
  return rawList.map(item => toWarehouseRelationItem(item, type)).filter(ele => !!ele.id || !!ele.name)
}

const loadWarehouseRelationData = async () => {
  warehouseRelationDialog.loading = true
  const { keyword, searchField, type } = warehouseRelationDialog
  const text = keyword.trim().toLowerCase()
  const source = warehouseRelationMockMap[type]
  const fallbackList = source.filter(ele => {
    if (!text) return true
    const value = `${ele[searchField] || ''}`.toLowerCase()
    return value.includes(text)
  })
  const requestData = {
    currentPage: warehouseRelationDialog.currentPage,
    numberPerPage: warehouseRelationDialog.pageSize,
    searchField,
    keyword,
    [searchField]: keyword
  }
  try {
    const resData =
      type === 'dimension' ? await getDimensionList(requestData) : await getIndexList(requestData)
    const apiList = parseWarehouseApiList(resData, type)
    warehouseRelationList.value = apiList.length ? apiList : fallbackList
  } catch (error) {
    warehouseRelationList.value = fallbackList
  } finally {
    warehouseRelationDialog.loading = false
  }
}

const openWarehouseRelationDialog = async (row, type: WarehouseDialogType) => {
  warehouseRelationTargetField.value = row
  warehouseRelationDialog.type = type
  warehouseRelationDialog.searchField = 'name'
  warehouseRelationDialog.keyword = row.name || ''
  warehouseRelationDialog.currentPage = 1
  warehouseRelationDialog.visible = true
  await loadWarehouseRelationData()
}

const closeWarehouseRelationDialog = () => {
  warehouseRelationDialog.visible = false
  warehouseRelationTargetField.value = null
}

const searchWarehouseRelation = async () => {
  warehouseRelationDialog.currentPage = 1
  await loadWarehouseRelationData()
}

const resetWarehouseRelationSearch = async () => {
  warehouseRelationDialog.searchField = 'name'
  warehouseRelationDialog.keyword = ''
  warehouseRelationDialog.currentPage = 1
  await loadWarehouseRelationData()
}

const handleWarehouseRelationSizeChange = (size: number) => {
  warehouseRelationDialog.pageSize = size
  warehouseRelationDialog.currentPage = 1
}

const handleWarehouseRelationCurrentChange = (page: number) => {
  warehouseRelationDialog.currentPage = page
}

const clearWarehouseRelation = row => {
  row.warehouseFieldId = ''
  row.warehouseFieldName = ''
  row.warehouseFieldType = ''
}

const clearWarehouseRelationByAction = row => {
  changeUpdate()
  clearWarehouseRelation(row)
}

const selectWarehouseRelation = row => {
  if (!warehouseRelationTargetField.value) return
  changeUpdate()
  warehouseRelationTargetField.value.name = row.name
  warehouseRelationTargetField.value.warehouseFieldId = row.id
  warehouseRelationTargetField.value.warehouseFieldName = row.name
  warehouseRelationTargetField.value.warehouseFieldType = warehouseRelationDialog.type
  closeWarehouseRelationDialog()
}

const dfsGetName = (list, name) => {
  list.forEach(ele => {
    name[ele.id] = ele.tableName
    if (ele.children?.length) {
      dfsGetName(ele.children, name)
    }
  })
}

const tabChange = val => {
  if (val === 'preview') return
  reGetName()
  allfields.value.forEach(ele => {
    if (!Array.isArray(ele.deTypeArr)) {
      ele.deTypeArr =
        ele.deType === 1 && ele.deExtractType === 0
          ? [ele.deType, ele.dateFormatType]
          : [ele.deType]
    } else {
      const [type] = ele.deTypeArr
      if (ele.deTypeArr.length && type !== ele.deType) {
        ele.deTypeArr.splice(0, 1, ele.deType)
      }
    }
  })
}

const addComplete = () => {
  state.nodeNameList = [...datasetDrag.value.nodeNameList]
  changeUpdate()
  if (!state.nodeNameList?.length) {
    columns.value = []
    tableData.value = []
  }
  cancelMap['/datasetData/previewData']?.()
  datasetPreviewLoading.value = false
  reGetName()
}

const reGetName = () => {
  dfsGetName(datasetDrag.value.getNodeList(), nameMap.value)
}

const state = reactive({
  nodeNameList: [],
  editArr: [],
  dataSourceList: [],
  fieldCollapse: ['dimension', 'quota']
})

const datasourceTableData = shallowRef([])
const getIconName = (type: number) => {
  if (type === 1) {
    return 'time'
  }

  if (type === 0) {
    return 'text'
  }

  if ([2, 3, 4].includes(type)) {
    return 'value'
  }
  if (type === 5) {
    return 'location'
  }
  if (type === 7) {
    return 'url'
  }
}

const allfields = ref([])

provide('allfields', allfields)
provide('isCross', isCross)

let num = +new Date()

const expandedD = ref(true)
const expandedQ = ref(true)
const setGuid = (arr, id, datasourceId, oldArr) => {
  arr.forEach(ele => {
    if (!ele.id) {
      ele.id = oldArr.find(itx => itx.originName === ele.originName)?.id || `${++num}`
      ele.datasetTableId = id
      ele.datasourceId = datasourceId
    }
  })
}

const dfsFields = (arr, list) => {
  list.forEach(ele => {
    if (ele.children?.length) {
      dfsFields(arr, ele.children)
    }
    const { currentDsFields } = ele
    arr.push(...cloneDeep(currentDsFields))
  })
}

const getDelIdArr = (newArr, oldArr) => {
  const idMapNew = newArr.map(ele => ele.id)
  return [
    ...oldArr
      .filter(ele => ![2, 3].includes(ele.extField))
      .filter(ele => !idMapNew.includes(ele.id)),
    ...oldArr.filter(ele => [2, 3].includes(ele.extField))
  ]
}

const diffArr = (newArr, oldArr) => {
  const idMapNew = newArr.map(ele => ele.id)
  const idMapOld = oldArr.map(ele => ele.id)
  const arr = newArr.filter(ele => !idMapOld.includes(ele.id))
  return cloneDeep([
    ...oldArr.filter(ele => [2, 3].includes(ele.extField)),
    ...arr,
    ...oldArr.filter(ele => idMapNew.includes(ele.id))
  ])
}

const closeEditUnion = () => {
  notConfirmEditUnion()
  fieldUnion.value.clearState()
  editUnion.value = false
}
const fieldUnion = ref()

const setFieldAll = () => {
  const arr = []
  dfsFields(arr, datasetDrag.value.getNodeList())
  const delIdArr = getDelIdArr(arr, allfields.value)
  allfields.value = diffArr(arr, allfields.value)
  delFieldById(delIdArr)
  tabChange('manage')
  fieldUnion.value?.clearState()
}

const delGroupIds = () => {
  const delIds = []
  const fields = allfields.value.map(ele => ele.id)
  const groupIds = allfields.value.filter(ele => ele.extField === 3)
  groupIds.forEach(ele => {
    if (!fields.includes(ele.originName)) {
      delIds.push(ele.id)
    }
  })
  allfields.value = allfields.value.filter(ele => !delIds.includes(ele.id))
}

const dfsNode = (arr, id) => {
  return arr.reduce((pre, next) => {
    if (next.id === id) {
      pre = [...next.currentDsFields]
    } else if (next.children?.length) {
      pre = dfsNode(next.children, id)
    }
    return pre
  }, [])
}

const dfsFieldsTips = (arr, list, idArr) => {
  list.forEach(ele => {
    if (ele.children?.length) {
      dfsFieldsTips(arr, ele.children, idArr)
    }
    if (!idArr.includes(ele.id)) {
      const { currentDsFields } = ele
      arr.push(...cloneDeep(currentDsFields))
    }
  })
}
const confirmEditUnion = () => {
  const { node, parent } = fieldUnion.value
  const to = node.id
  const from = parent.id
  let unionFieldsLost = node.unionFields.some(ele => {
    const { currentField, parentField } = ele
    return !currentField || !parentField
  })

  if (unionFieldsLost) {
    ElMessage.error(t('data_set.cannot_be_empty_de_field'))
    return
  }

  const nodeOldCurrentDsFields = dfsNode(datasetDrag.value.getNodeList(), to)
  const parentOldCurrentDsFields = dfsNode(datasetDrag.value.getNodeList(), from)

  setGuid(node.currentDsFields, node.id, node.datasourceId, nodeOldCurrentDsFields)
  setGuid(parent.currentDsFields, parent.id, parent.datasourceId, parentOldCurrentDsFields)
  const top = cloneDeep(node)
  const bottom = cloneDeep(parent)

  let arr = []
  dfsFieldsTips(arr, datasetDrag.value.getNodeList(), [node.id, parent.id])
  arr = [...arr, ...node.currentDsFields, ...parent.currentDsFields]
  const delIdArr = getDelIdArr(arr, allfields.value)
  let fakeAllfields = diffArr(arr, allfields.value)
  const idList = delFieldByIdFake(delIdArr, fakeAllfields)
  if (!!idList.length) {
    const idArr = allfields.value.reduce((pre, next) => {
      if (idList.includes(next.id)) {
        const idMap = next.originName.match(/\[(.+?)\]/g) || []
        const result = idMap.map(itm => {
          return itm.slice(1, -1)
        })
        pre = [...result, ...pre]
      }
      return pre
    }, [])

    ElMessageBox.confirm(t('data_set.field_selection'), {
      confirmButtonText: t('dataset.confirm'),
      cancelButtonText: t('common.cancel'),
      showCancelButton: true,
      tip: `${t('data_set.field')}: ${allfields.value
        .filter(ele => [...new Set(idArr)].includes(ele.id) && ![2, 3].includes(ele.extField))
        .map(ele => ele.name)
        .join(',')}, ${t('data_set.confirm_the_deletion')}`,
      confirmButtonType: 'danger',
      type: 'warning',
      autofocus: false,
      showClose: false,
      callback: (action: Action) => {
        if (action === 'confirm') {
          datasetDrag.value.setStateBack(top, bottom)
          setFieldAll()
          editUnion.value = false
          addComplete()
          datasetDrag.value.setChangeStatus(to, from)
        }
      }
    })
    return
  }

  datasetDrag.value.setStateBack(top, bottom)
  setFieldAll()
  editUnion.value = false
  addComplete()
  datasetDrag.value.setChangeStatus(to, from)
}

const updateAllfields = () => {
  setFieldAll()
}

const equalMin = [
  {
    value: 'lt',
    label: '<'
  },
  {
    value: 'le',
    label: '<='
  }
]

const validatePass = (_: any, value: any, callback: any) => {
  if (!value || !value.length) {
    callback(new Error(t('chart.value_can_not_empty')))
  } else {
    callback()
  }
}
const refsForm = ref([])

const fieldGroupRules = {
  name: [{ required: true, message: t('dataset.input_edit_name'), trigger: 'blur' }]
}

const defaultObj = {
  name: '',
  id: +new Date(),
  datasourceId: '',
  datasetTableId: '',
  datasetGroupId: '',
  originName: '',
  otherGroup: '',
  groupType: 'd',
  deType: 0,
  type: 'ANY',
  deExtractType: 0,
  extField: 3,
  deTypeOrigin: null,
  groupList: [
    {
      name: '',
      text: [],
      time: '',
      minTerm: 'lt',
      maxTerm: 'lt',
      min: null,
      max: null
    }
  ]
}
const currentGroupField = reactive(cloneDeep(defaultObj))
const ruleGroupFieldRef = ref()
const editGroupField = ref(false)
const enumValueLoading = ref(false)
const groupFields = shallowRef([])
const enumValue = shallowRef([])
const addGroupField = () => {
  groupFields.value = allfields.value.filter(ele => ![2, 3].includes(ele.extField))
  Object.assign(currentGroupField, cloneDeep(defaultObj))
  currentGroupField.id = guid()
  titleForGroup.value = t('dataset.create_grouping_field')
  editGroupField.value = true
}
const handleFieldschange = val => {
  const field = groupFields.value.find(ele => ele.id === val)
  const { deType } = field
  if (deType !== currentGroupField.deExtractType || deType === 0) {
    refsForm.value = []
    currentGroupField.groupList = [
      {
        name: '',
        text: [],
        time: '',
        minTerm: 'lt',
        maxTerm: 'lt',
        min: null,
        max: null
      }
    ]
  }
  currentGroupField.deTypeOrigin = deType
  if (deType !== 0) return
  enumValueLoading.value = true
  const arr = []
  const allfieldsCopy = cloneDeep(unref(allfields))
  dfsNodeList(arr, datasetDrag.value.getNodeList())
  enumValueDs({ dataset: { union: arr, allFields: allfieldsCopy, isCross: isCross.value }, field })
    .then(res => {
      enumValue.value = res || []
    })
    .finally(() => {
      enumValueLoading.value = false
    })
}
const closeGroupField = () => {
  editGroupField.value = false
}

const disabledEnumArr = computed(() => {
  return currentGroupField.groupList?.map(ele => ele.text).flat()
})

const disabledEnum = (item, arr) => {
  return disabledEnumArr.value.includes(item) && !arr.includes(item)
}

const titleForGroup = ref(t('dataset.create_grouping_field'))

const initGroupField = val => {
  groupFields.value = allfields.value.filter(ele => ![2, 3].includes(ele.extField))
  Object.assign(currentGroupField, val)
  const groupList = []
  val.groupList.forEach(ele => {
    const { name, text = [], startTime, endTime, min, max, minTerm, maxTerm } = ele
    const obj = {
      name,
      text,
      min,
      max,
      minTerm,
      maxTerm,
      time: []
    }
    if (startTime && endTime) {
      obj.time = [startTime, endTime]
    }
    groupList.push(obj)
  })

  handleFieldschange(currentGroupField.originName)

  currentGroupField.groupList = groupList
  titleForGroup.value = t('dataset.editing_grouping_field')
  editGroupField.value = true
}

const confirmGroupField = () => {
  ruleGroupFieldRef.value.validate(val => {
    let count = 0
    let time
    refsForm.value.forEach(ele => {
      ele?.validate(val => {
        if (val) {
          count++
        }
      })
    })
    time = setTimeout(() => {
      clearTimeout(time)
      time = null
      if (val && count === currentGroupField.groupList.length) {
        const groupList = []
        currentGroupField.groupList.forEach(ele => {
          const { name, text = [], time, min, max, minTerm, maxTerm } = ele
          const obj = {
            name,
            text,
            min,
            max,
            minTerm,
            maxTerm,
            startTime: '',
            endTime: ''
          }
          if (currentGroupField.deTypeOrigin === 1) {
            const [startTime, endTime] = time
            obj.startTime = dayjs(startTime).format('YYYY-MM-DD HH:mm:ss')
            obj.endTime = dayjs(endTime).format('YYYY-MM-DD HH:mm:ss')
          }
          groupList.push(obj)
        })
        const index = allfields.value.findIndex(ele => ele.id === currentGroupField.id)
        if (index !== -1) {
          allfields.value.splice(index, 1, { ...currentGroupField, groupList })
        } else {
          allfields.value.push({ ...currentGroupField, groupList })
        }
        editGroupField.value = false
      }
    }, 1000)
  })
}

const notConfirmEditUnion = () => {
  datasetDrag.value.notConfirm()
}

const addGroupFields = () => {
  currentGroupField.groupList.push({
    name: '',
    text: [],
    time: '',
    minTerm: 'lt',
    maxTerm: 'lt',
    min: null,
    max: null
  })
}

const removeGroupFields = index => {
  currentGroupField.groupList.splice(index, 1)
  refsForm.value.splice(index, 1)
}

const dragstart = (e: DragEvent, ele) => {
  offsetX.value = e.offsetX
  offsetY.value = e.offsetY
  e.dataTransfer.setData('text/plain', JSON.stringify(ele))
  maskShow.value = true
}
const setActiveName = (data: Table) => {
  if (data.unableCheck) return
  activeName.value = data.tableName
}

const verify = () => {
  if (datasetPreviewLoading.value) return
  calcEdit.value.formField.validate(val => {
    if (val) {
      calcEdit.value.setFieldForm()
      if (!calcEdit.value.fieldForm.originName.trim()) {
        ElMessage.error(t('data_set.cannot_be_empty_de_'))
        return
      }
      const obj = cloneDeep(calcEdit.value.fieldForm)
      const { deType, dateFormat, deExtractType } = obj
      obj.dateFormat = deType === 1 ? dateFormat : ''
      obj.dateFormatType = deType === 1 ? dateFormat : ''
      obj.deTypeArr = deType === 1 && deExtractType === 0 ? [deType, dateFormat] : [deType]
      const result = allfields.value.findIndex(ele => obj.id === ele.id)
      const allfieldsCopy = cloneDeep(unref(allfields))
      if (result !== -1) {
        allfieldsCopy.splice(result, 1, obj)
      } else {
        allfieldsCopy.push(obj)
      }
      const arr = []
      dfsNodeList(arr, datasetDrag.value.getNodeList())
      datasetPreviewLoading.value = true
      getPreviewData({ union: arr, allFields: allfieldsCopy, isCross: isCross.value })
        .then(() => {
          ElMessage.success(t('data_set.validation_succeeded'))
        })
        .finally(() => {
          datasetPreviewLoading.value = false
        })
    }
  })
}

const isDragging = ref(false)

const mousedownDrag = () => {
  isDragging.value = true
  document.querySelector('body').style.userSelect = 'none'
  document.querySelector('.dataset-db').addEventListener('mousemove', calculateWidth)
}
const mouseupDrag = () => {
  isDragging.value = false
  document.querySelector('body').style.userSelect = 'auto'
  const dom = document.querySelector('.dataset-db')
  dom.removeEventListener('mousemove', calculateWidth)
  dom.removeEventListener('mousemove', calculateHeight)
}

const crossDatasources = computed(() => {
  return datasetDrag.value?.crossDatasources
})
const calculateWidth = (e: MouseEvent) => {
  if (e.pageX < 240) {
    LeftWidth.value = 240
    return
  }
  if (e.pageX > 500) {
    LeftWidth.value = 500
    return
  }
  LeftWidth.value = e.pageX
}

const mousedownDragH = () => {
  document.querySelector('.dataset-db').addEventListener('mousemove', calculateHeight)
}
const calculateHeight = (e: MouseEvent) => {
  const clientHeight = document.documentElement.clientHeight
  if (e.pageY - 56 < 64) {
    dragHeight.value = 64
    sqlResultHeight.value = clientHeight - dragHeight.value - 56
    return
  }
  if (e.pageY > clientHeight - 57) {
    dragHeight.value = clientHeight - 113
    sqlResultHeight.value = clientHeight - dragHeight.value - 56
    return
  }
  dragHeight.value = e.pageY - 56
  sqlResultHeight.value = clientHeight - dragHeight.value - 56
  quotaTableHeight.value = sqlResultHeight.value - 242
}

const sqlResultHeight = ref(0)
const handleResize = debounce(() => {
  const clientHeight = document.documentElement.clientHeight
  if (clientHeight - sqlResultHeight.value - 56 < 64) {
    dragHeight.value = 64
    sqlResultHeight.value = clientHeight - dragHeight.value - 56
    return
  }
  dragHeight.value = clientHeight - sqlResultHeight.value - 56
}, 60)
let willBack = false
const saveAndBack = () => {
  if (willBack) {
    pushDataset()
  } else {
    ElMessage.success(t('data_set.saved_successfully'))
  }
}

let p = null
const XpackLoaded = () => p(true)
onMounted(async () => {
  if (route.query.dialog === 'datasource') {
    isFullscreen.value = true
    handleShowCreateDataSource(null, null)
  }
  isEdit.value = false
  await new Promise(r => (p = r))
  await initEdite()
  getDatasource(isEdit.value ? 0 : 2)
  window.addEventListener('resize', handleResize)
  getSqlResultHeight()
  quotaTableHeight.value = sqlResultHeight.value - 242
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
})
const getSqlResultHeight = () => {
  sqlResultHeight.value = (document.querySelector('.sql-result') as HTMLElement).offsetHeight
}
const getDatasource = (weight?: number) => {
  getDatasourceList(weight).then(res => {
    const _list = (res as unknown as DataSource[]) || []
    if (_list && _list.length > 0 && _list[0].id === '0' && _list[0].children?.length) {
      state.dataSourceList = dfsChild(_list[0].children)
    } else {
      state.dataSourceList = dfsChild(_list)
    }
    nextTick(() => {
      const param = {
        methodName: 'execute',
        args: null
      }
      datasetCheckRef.value?.invokeMethod(param)
    })
  })
}

const resetDfsFields = (arr, idMap) => {
  for (let i in arr) {
    const id = guid()
    idMap[arr[i].currentDs.id] = id
    arr[i].currentDs.id = id
    if (!!arr[i].childrenDs?.length) {
      resetDfsFields(arr[i].childrenDs, idMap)
    }
  }
}

const resetAllfieldsId = arr => {
  const idMap = {}
  for (let i in allfields.value) {
    const id = guid()
    idMap[allfields.value[i].id] = id
    allfields.value[i].id = id
    allfields.value[i].datasetGroupId = ''
  }
  resetDfsFields(arr, idMap)
  return idMap
}

const resetAllfieldsUnionId = (arr, idMap) => {
  let strUnion = JSON.stringify(arr) as string
  let strNodeList = JSON.stringify(toRaw(datasetDrag.value.getNodeList())) as string
  let strAllfields = JSON.stringify(unref(allfields.value)) as string
  Object.entries(idMap).forEach(([key, value]) => {
    strUnion = strUnion.replaceAll(key, value as string)
    strAllfields = strAllfields.replaceAll(key, value as string)
    strNodeList = strNodeList.replaceAll(key, value as string)
  })
  allfields.value = JSON.parse(strAllfields)
  datasetDrag.value.initState(JSON.parse(strNodeList))
  return JSON.parse(strUnion)
}

const datasetSave = () => {
  if (nodeInfo.id) {
    editeSave()
    return
  }
  let union = []
  dfsNodeList(union, datasetDrag.value.getNodeList())
  console.log('union', union)
  const pid = appStore.getIsDataEaseBi ? embeddedStore.datasetPid : route.query.pid || nodeInfo.pid
  if (!union.length) {
    ElMessage.error(t('data_set.dataset_cannot_be'))
    return
  }
  if (nodeInfo.pid && !nodeInfo.id) {
    union = resetAllfieldsUnionId(union, resetAllfieldsId(union))
  }

  creatDsFolder.value.createInit(
    'dataset',
    { id: pid || '0', union, allfields: allfields.value, isCross: isCross.value },
    '',
    datasetName.value
  )
}
const datasetSaveAndBack = () => {
  willBack = true
  datasetSave()
}

const datasetPreviewLoading = ref(false)

const datasetPreview = () => {
  if (datasetPreviewLoading.value) return
  const arr = []
  dfsNodeList(arr, datasetDrag.value.getNodeList())
  datasetPreviewLoading.value = true
  getPreviewData({ union: arr, allFields: allfields.value, isCross: isCross.value })
    .then(res => {
      columns.value = generateColumns((res.data.fields as Field[]) || [])
      tableData.value = (res.data.data as Array<{}>) || []
    })
    .finally(() => {
      datasetPreviewLoading.value = false
    })
}

const dfsNodeList = (arr, list) => {
  list.forEach(ele => {
    const childrenDs = []
    if (ele.children?.length) {
      dfsNodeList(childrenDs, ele.children)
    }
    const {
      tableName,
      type,
      datasourceId,
      extDatasourceId,
      id,
      info,
      unionType,
      unionFields,
      currentDsFields,
      sqlVariableDetails
    } = ele
    arr.push({
      currentDs: {
        sqlVariableDetails,
        tableName,
        type,
        datasourceId,
        extDatasourceId,
        id,
        info
      },
      currentDsFields,
      childrenDs,
      unionToParent: {
        unionType,
        unionFields
      }
    })
  })
}

const quotaTable = ref()
const dimensionsTable = ref()

const dimensionsSelection = ref([])
const quotaSelection = ref([])

const deTypeSelection = ref([])
const fieldSelection = ref([])

const showCascaderBatch = computed(() => {
  return !!deTypeSelection.value.length && Array.from(new Set(deTypeSelection.value)).length === 1
})

const clearSelection = () => {
  dimensionsTable.value.clearSelection()
  quotaTable.value.clearSelection()
}
const deTypeArr = ref([])

const setDeTypeSelection = () => {
  fieldSelection.value = [
    ...dimensionsTable.value.getSelectionRows(),
    ...quotaTable.value.getSelectionRows()
  ]
  deTypeSelection.value = fieldSelection.value.map(ele => ele.deExtractType)
  let deTypes = fieldSelection.value.map(ele => ele.deType)
  const [obj] = fieldSelection.value
  nextTick(() => {
    dimensionsSelection.value = dimensionsTable.value.getSelectionRows().map(ele => ele.id)
    quotaSelection.value = quotaTable.value.getSelectionRows().map(ele => ele.id)
  })
  if (Array.from(new Set(deTypes)).length !== 1) {
    deTypeArr.value = []
    return
  }
  deTypeArr.value =
    obj.deType === 1 && obj.deExtractType === 0 ? [1, obj.dateFormatType] : [obj.deType]
}

const rowClick = (_, __, event) => {
  const element = event.target.parentNode.parentNode
  if ([...element.classList].includes('no-hide')) {
    element.classList.remove('no-hide')
    return
  }
  element.classList.add('no-hide')
}

let oldArrValue = []

const cascaderChangeArr = val => {
  const [deType, dateFormat] = val
  dimensionsSelection.value = dimensionsTable.value.getSelectionRows().map(ele => ele.id)
  quotaSelection.value = quotaTable.value.getSelectionRows().map(ele => ele.id)

  const arr = [...quotaSelection.value, ...dimensionsSelection.value]
  if (dateFormat === 'custom') {
    const [obj] = allfields.value.filter(ele => arr.includes(ele.id))
    oldArrValue = obj.deType === 1 ? [1, obj.dateFormatType] : [obj.deType]
    currentField.value.id = ''
    currentField.value.idArr = [...arr]
    currentField.value.dateFormat = ''
    currentField.value.dateFormatType = dateFormat
    updateCustomTime.value = true
    recoverSelection()
    return
  }
  allfields.value.forEach(ele => {
    if (arr.includes(ele.id)) {
      ele.deType = deType
      ele.dateFormat = deType === 1 ? dateFormat : ''
      ele.dateFormatType = deType === 1 ? dateFormat : ''
      ele.deTypeArr = deType === 1 && ele.deExtractType === 0 ? [deType, dateFormat] : [deType]
    }
  })
  recoverSelection()
}

const filterNode = (value: string, data: BusiTreeNode) => {
  if (!value) return true
  return data.name?.toLowerCase().includes(value.toLowerCase())
}
const recoverSelection = () => {
  nextTick(() => {
    quota.value.forEach(ele => {
      if (quotaSelection.value.includes(ele.id)) {
        quotaTable.value.toggleRowSelection(ele, true)
      }
    })
    dimensions.value.forEach(ele => {
      if (dimensionsSelection.value.includes(ele.id)) {
        dimensionsTable.value.toggleRowSelection(ele, true)
      }
    })
  })
}

const dragEnd = () => {
  maskShow.value = false
}

const cascaderChange = (row, val) => {
  const [deType, dateFormat] = val
  if (dateFormat === 'custom') {
    oldArrValue = row.deType === 1 ? [1, row.dateFormatType] : [row.deType]
    currentField.value.id = row.id
    updateCustomTime.value = true
    return
  }
  row.deType = deType
  row.dateFormat = deType === 1 ? dateFormat : ''
  row.dateFormatType = deType === 1 ? dateFormat : ''
}

const dfsUnion = (arr, list) => {
  list.forEach(ele => {
    const children = []
    if (ele.childrenDs?.length) {
      dfsUnion(children, ele.childrenDs)
    }
    const { unionToParent, currentDsFields, currentDs } = ele
    const { tableName, type, datasourceId, extDatasourceId, id, info, sqlVariableDetails } = currentDs || {}
    const { unionType, unionFields } = unionToParent || {}
    arr.push({
      sqlVariableDetails,
      tableName,
      type,
      datasourceId,
      extDatasourceId,
      id,
      info,
      currentDsFields,
      children,
      unionType,
      unionFields
    })
  })
}
// 记录编辑前的名称，用于校验失败时还原
const prevDatasetName = ref(datasetName.value)
const handleClick = () => {
  showInput.value = true
  // 进入编辑时记录当前名称
  prevDatasetName.value = datasetName.value
  nextTick(() => {
    editorName.value.focus()
  })
}

const sourceChange = val => {
  if (val) return
  if (crossDatasources.value) {
    isCross.value = !val
    ElMessageBox.confirm(t('common.source_tips'), {
      confirmButtonText: t('dataset.confirm'),
      cancelButtonText: t('common.cancel'),
      showCancelButton: true,
      confirmButtonType: 'primary',
      type: 'warning',
      autofocus: false,
      showClose: false
    }).then(() => {
      isCross.value = val
    })
  }
}

const finish = res => {
  const { id, pid, name } = res
  datasetName.value = name
  nodeInfo = {
    id,
    pid,
    name
  }
  allfields.value = res.allFields || []
  isUpdate = false
}

// const errorTips = ref('')

const handleDatasetName = () => {
  const NAME_REG = /^[\u4E00-\u9FA5A-Za-z0-9_]{1,50}$/
  // if (datasetName.value.trim().length < 1) {
  //   errorTips.value = t('datasource.input_limit_1_64', [1, 64])
  // }
  if (!NAME_REG.test(datasetName.value.trim())) {
    // errorTips.value = '请填写1~50位名称，允许汉字、字母、下划线、数字'
    ElMessage.warning('请填写1~50位名称，允许汉字、字母、下划线、数字')
    datasetName.value = prevDatasetName.value
    showInput.value = true
  } else {
    datasetName.value = datasetName.value.trim()
    showInput.value = false
  }
  // showInput.value = !!errorTips.value
}

const treeProps = {
  children: 'children',
  label: 'name',
  disabled: data => {
    return (!data.children?.length && !data.leaf) || (data.extraFlag < 0 && data.type !== 'API')
  }
}

const pluginDs = ref([])
const loadDsPlugin = data => {
  pluginDs.value = data
}
const getDsIcon = data => {
  if (pluginDs?.value.length === 0) return null
  if (!data.leaf) return null

  const arr = pluginDs.value.filter(ele => {
    return ele.type === data.type
  })
  return arr && arr.length > 0 ? arr[0].icon : null
}

const getDsIconName = data => {
  if (!data.leaf) return dvFolder
  return iconDatasourceMap[data.type]
}

const getIconNameCalc = (deType, extField, dimension = false) => {
  if (extField === 2) {
    const iconFieldCalculated = dimension ? iconFieldCalculatedMap : iconFieldCalculatedQMap
    return iconFieldCalculated[deType]
  }
  return iconFieldMap[fieldType[deType]]
}

const handleShowCreateDataSource = (nodeInfo: Param, id?: string) => {
  editDs.value = !!nodeInfo
  if (!!nodeInfo) {
    Object.assign(form2, cloneDeep(nodeInfo))
    pid.value = nodeInfo.pid || '0'
  } else {
    Object.assign(form2, cloneDeep(defaultForm2))
    pid.value = id || '0'
  }

  excelVisible.value = true
}

const handleShowFinishPage = ({ id, name, pid }) => {
  if (route.query.dialog === 'datasource') {
    handleCloseIframe()
  } else {
    excelVisible.value = false
    // 更新数据集列表
    console.log('更新数据集列表')
    getDatasource(isEdit.value ? 0 : 2)
  }
}
useEmitt().emitter.on('showFinishPage', handleShowFinishPage)

const addWatermark = () => {
  function getProjectIdNameByUrl(url = window.top.location.href) {
    const match = url.match(/#\/([^/]+\/[^/]+\/[^/]+)/)
    if (!match) return null
    const key = `${match[1]}/projectIdName`
    return localStorage.getItem(key)
  }
  const name = localStorage.getItem('userName') || '未获取到用户'
  const phone = localStorage.getItem('securityPhone') || '未获取到手机号'
  const project = getProjectIdNameByUrl() || '未获取到项目名称'
  const waterMarkData = {
    name,
    phone,
    project
  }
  watermark('watermark', {
    ...waterMarkData,
    isCopyable: false,
    fontSize: 13, // 字体大小
    color: 'rgba(150, 150, 150, 0.4)', // 颜色
    rotate: 0, // 旋转角度
    width: 400, // 水印单元宽度（适配多行文本）
    height: 400 // 水印单元高度
  })
}

onMounted(() => {
  addWatermark()
})

</script>

<template>
  <div class="de-dataset-form watermark" v-loading="loading">
    <div class="top">
      <span class="name">
        <el-icon @click="backToMain">
          <Icon name="icon_left_outlined"><icon_left_outlined class="svg-icon" /></Icon>
        </el-icon>
        <template v-if="showInput">
          <el-input
            maxlength="50"
            ref="editorName"
            v-model="datasetName"
            @blur="handleDatasetName"
          />
        </template>
        <template v-else>
          <span @click="handleClick" class="dataset-name ellipsis" style="margin-left: 12px">{{
            datasetName
          }}</span>
        </template>
      </span>
      <span class="operate">
        <el-tooltip
          placement="bottom"
          effect="light"
          raw-content
        >
          <el-link
            type="primary"
            href="https://spms.migu.cn:8090/pages/viewpage.action?pageId=505226283"
            target="_blank"
            style="margin-right: 12px"
          >
            视频教程
          </el-link>
          <template #content>
            <p style="line-height: 20px">观看此教程需Confluence权限，<br>若无权限<el-link type="primary" href="https://spms.migu.cn/spms/static/permissionplus/index.html#/permission/01/create/10066/6962" target="_blank" style="font-size: 12px; vertical-align: top;">点此提交申请</el-link>。</p>
          </template>
        </el-tooltip>
        <el-button :disabled="showInput" type="primary" @click="datasetSaveAndBack">{{
          t('data_set.save_and_return')
        }}</el-button>
        <el-button :disabled="showInput" type="primary" @click="datasetSave">{{
          t('data_set.save')
        }}</el-button>
      </span>
    </div>
    <div class="container dataset-db" @mouseup="mouseupDrag">
      <p v-show="!showLeft" class="arrow-right" @click="showLeft = true">
        <el-icon>
          <Icon><icon_right_outlined class="svg-icon" /></Icon>
        </el-icon>
      </p>
      <div
        v-show="showLeft"
        :style="{ left: LeftWidth + 'px' }"
        class="drag-left"
        :class="isDragging && 'is-dragging'"
        @mousedown="mousedownDrag"
      />
      <div
        v-loading="dsLoading"
        v-show="showLeft"
        class="table-list"
        :style="{ width: LeftWidth + 'px' }"
      >
        <div class="table-list-top">
          <el-switch
            style="margin-bottom: 8px"
            v-model="isCross"
            @change="sourceChange"
            :active-text="$t('common.cross_source')"
            :inactive-text="$t('common.single_source')"
          />

          <p class="select-ds">
            {{ t('data_set.select_data_source') }}
            <el-button link type="primary" size="small" @click="handleShowCreateDataSource(null, null)">新建文件数据源</el-button>
            <span class="left-outlined">
              <el-icon style="color: #1f2329" @click="showLeft = false">
                <Icon name="icon_left_outlined"><icon_left_outlined class="svg-icon" /></Icon>
              </el-icon>
            </span>
          </p>
          <el-tree-select
            :check-strictly="false"
            @change="dsChange"
            :placeholder="t('dataset.pls_slc_data_source')"
            class="ds-list"
            :filter-node-method="filterNode"
            filterable
            popper-class="tree-select-ds_popper"
            v-model="dataSource"
            node-key="id"
            :props="treeProps"
            :data="state.dataSourceList"
            :render-after-expand="false"
          >
            <template #default="{ data: { name, leaf, type, extraFlag } }">
              <div class="flex-align-center icon">
                <el-icon>
                  <icon :static-content="getDsIcon({ leaf, type })"
                    ><component class="svg-icon" :is="getDsIconName({ leaf, type })"></component
                  ></icon>
                </el-icon>
                <span v-if="!leaf || extraFlag > -1">{{ name }}</span>
                <el-tooltip
                  effect="dark"
                  v-else
                  :content="`${t('data_set.invalid_data_source')}:${name}`"
                  placement="top"
                >
                  <span>{{ name }}</span>
                </el-tooltip>
              </div>
            </template>
          </el-tree-select>
          <p class="select-ds table-num">
            {{ t('datasource.data_table') }}
            <span class="num">
              <el-icon class="icon-color">
                <Icon name="reference-table"><referenceTable class="svg-icon" /></Icon>
              </el-icon>
              {{ datasourceTableData.length }}
            </span>
          </p>
          <el-input
            v-model="searchTable"
            class="search"
            :placeholder="t('deDataset.by_table_name')"
            clearable
          >
            <template #prefix>
              <el-icon>
                <Icon name="icon_search-outline_outlined"
                  ><icon_searchOutline_outlined class="svg-icon"
                /></Icon>
              </el-icon>
            </template>
          </el-input>
        </div>
        <div v-if="!datasourceTableData.length && searchTable !== ''" class="el-empty">
          <div
            class="el-empty__description"
            style="margin-top: 80px; color: #5e6d82; text-align: center"
          >
            {{ t('data_set.relevant_content_found') }}
          </div>
        </div>
        <div v-else class="table-checkbox-list">
          <div
            class="list-item_primary"
            v-if="dataSource"
            @dragstart="$event => dragstart($event, sqlNode)"
            @dragend="dragEnd"
            :draggable="true"
            @click="setActiveName(sqlNode)"
          >
            <el-icon class="icon-color">
              <Icon name="icon_sql_outlined_1"><icon_sql_outlined_1 class="svg-icon" /></Icon>
            </el-icon>
            <span class="label">{{ t('data_set.custom_sql') }}</span>
          </div>
          <FixedSizeList
            :itemSize="40"
            :data="datasourceTableData"
            :total="datasourceTableData.length"
            :width="LeftWidth - 17"
            :height="height - 305"
            :scrollbarAlwaysOn="false"
            class-name="el-select-dropdown__list"
            layout="vertical"
          >
            <template #default="{ index, style }">
              <div
                class="list-item_primary"
                :style="style"
                :title="datasourceTableData[index].tableName"
                @dragstart="$event => dragstart($event, datasourceTableData[index])"
                @dragend="maskShow = false"
                :draggable="true"
                @click="setActiveName(datasourceTableData[index])"
              >
                <el-icon class="icon-color">
                  <Icon name="reference-table"><referenceTable class="svg-icon" /></Icon>
                </el-icon>
                <span class="label">{{ datasourceTableData[index].tableName }}</span>
              </div>
            </template>
          </FixedSizeList>
        </div>
      </div>
      <div class="drag-right" :style="{ width: `calc(100vw - ${showLeft ? LeftWidth : 0}px)` }">
        <div v-if="crossDatasources" class="different-datasource">
          <el-icon>
            <Icon name="icon_warning_colorful"><icon_warning_colorful class="svg-icon" /></Icon>
          </el-icon>
          {{ t('data_set.be_reported_incorrectly') }}
        </div>
        <dataset-union
          @reGetName="reGetName"
          @join-editor="joinEditor"
          @changeUpdate="changeUpdate"
          :maskShow="maskShow"
          :dragHeight="dragHeight"
          :getDsName="getDsName"
          :offsetX="offsetX"
          :offsetY="offsetY"
          ref="datasetDrag"
          @updateAllfields="updateAllfields"
          @addComplete="addComplete"
        ></dataset-union>
        <div
          class="sql-result"
          :style="{
            height: sqlResultHeight
              ? `${crossDatasources ? sqlResultHeight - 40 : sqlResultHeight}px`
              : `calc(100% - ${crossDatasources ? dragHeight + 40 : dragHeight}px)`
          }"
        >
          <div class="sql-title">
            <span class="drag" @mousedown="mousedownDragH" />
            <div class="field-data">
              <el-button :disabled="!allfields.length" @click="addCalcField('q')" secondary>
                <template #icon>
                  <el-icon>
                    <Icon name="icon_add_outlined"><icon_add_outlined class="svg-icon" /></Icon>
                  </el-icon>
                </template>
                {{ t('dataset.add_calc_field') }}
              </el-button>
              <el-button :disabled="!allfields.length" @click="addGroupField" secondary>
                <template #icon>
                  <el-icon>
                    <Icon><icon_organization_outlined class="svg-icon" /></Icon>
                  </el-icon>
                </template>
                {{ t('dataset.create_grouping_field') }}
              </el-button>
              <el-button
                style="min-width: 70px"
                :disabled="!allfields.length"
                v-loading="datasetPreviewLoading"
                @click="datasetPreview"
                secondary
              >
                <template #icon>
                  <el-icon>
                    <Icon name="icon_refresh_outlined"
                      ><icon_refresh_outlined class="svg-icon"
                    /></Icon>
                  </el-icon>
                </template>
                {{ t('data_set.refresh_data') }}
              </el-button>
            </div>
          </div>
          <el-tabs class="padding-24" v-model="tabActive" @tab-change="tabChange">
            <el-tab-pane :label="t('chart.data_preview')" name="preview" />
            <el-tab-pane :label="t('dataset.batch_manage')" name="manage" />
          </el-tabs>
          <div v-show="tabActive === 'preview' && !!allfields.length" class="table-preview">
            <div class="preview-field">
              <div :class="['field-d', { open: expandedD }]">
                <div :class="['title', { expanded: expandedD }]" @click="expandedD = !expandedD">
                  <ElIcon class="expand">
                    <Icon name="icon_expand-right_filled"
                      ><icon_expandRight_filled class="svg-icon"
                    /></Icon>
                  </ElIcon>
                  &nbsp;{{ t('chart.dimension') }}
                </div>
                <el-tree v-if="expandedD" :data="dimensions" :props="defaultProps">
                  <template #default="{ data }">
                    <span class="custom-tree-node father">
                      <el-icon>
                        <Icon
                          ><component
                            class="svg-icon"
                            :class="`field-icon-${fieldType[[2, 3].includes(data.deType) ? 2 : 0]}`"
                            :is="getIconNameCalc(data.deType, data.extField)"
                          ></component
                        ></Icon>
                      </el-icon>
                      <span :title="data.name" class="label-tooltip">{{ data.name }}</span>
                      <div class="operate child">
                        <field-more
                          :extField="data.extField"
                          :trans-type="t('data_set.convert_to_indicator')"
                          :show-time="data.deExtractType === 0"
                          @handle-command="type => handleFieldMore(data, type)"
                        ></field-more>
                      </div>
                    </span>
                  </template>
                </el-tree>
              </div>
              <div :class="['field-q', { open: expandedQ }]">
                <div :class="['title', { expanded: expandedQ }]" @click="expandedQ = !expandedQ">
                  <ElIcon class="expand">
                    <Icon name="icon_expand-right_filled"
                      ><icon_expandRight_filled class="svg-icon"
                    /></Icon>
                  </ElIcon>
                  &nbsp;{{ t('chart.quota') }}
                </div>
                <el-tree v-if="expandedQ" :data="quota" :props="defaultProps">
                  <template #default="{ data }">
                    <span class="custom-tree-node father">
                      <el-icon>
                        <Icon
                          ><component
                            class="svg-icon"
                            :class="`field-icon-${fieldType[[2, 3].includes(data.deType) ? 2 : 0]}`"
                            :is="getIconNameCalc(data.deType, data.extField, true)"
                          ></component
                        ></Icon>
                      </el-icon>
                      <span :title="data.name" class="label-tooltip">{{ data.name }}</span>
                      <div class="operate child">
                        <field-more
                          :trans-type="t('data_set.convert_to_dimension')"
                          typeColor="green-color"
                          :show-time="data.deExtractType === 0"
                          :extField="data.extField"
                          @handle-command="type => handleFieldMore(data, type)"
                        ></field-more>
                      </div>
                    </span>
                  </template>
                </el-tree>
              </div>
            </div>
            <div class="preview-data">
              <el-table
                class="dataset-preview_table"
                @row-click="rowClick"
                v-loading="datasetPreviewLoading"
                header-class="header-cell"
                :data="tableData"
                border
                style="width: 100%; height: 100%"
              >
                <el-table-column
                  :key="column.dataKey + column.deType"
                  v-for="(column, index) in columns"
                  :prop="column.dataKey"
                  :label="column.title"
                  :width="columns.length - 1 === index ? 150 : 'auto'"
                  :fixed="columns.length - 1 === index ? 'right' : false"
                >
                  <template #header>
                    <div class="flex-align-center">
                      <ElIcon style="margin-right: 6px">
                        <Icon
                          ><component
                            class="svg-icon"
                            :class="`field-icon-${
                              fieldType[[2, 3].includes(column.deType) ? 2 : 0]
                            }`"
                            :is="iconFieldMap[fieldType[column.deType]]"
                          ></component
                        ></Icon>
                      </ElIcon>
                      <span class="ellipsis" :title="column.title" style="width: 120px">
                        {{ column.title }}
                      </span>
                    </div>
                  </template>
                </el-table-column>
                <template #empty>
                  <empty-background :description="t('data_set.no_data')" img-type="noneWhite" />
                </template>
              </el-table>
            </div>
          </div>
          <div v-show="tabActive !== 'preview' && !!allfields.length" class="batch-area">
            <div class="manage-container">
              <el-collapse v-model="state.fieldCollapse" class="style-collapse">
                <el-collapse-item
                  name="dimension"
                  :title="t('chart.dimension')"
                  class="dimension-manage-header manage-header"
                >
                  <el-table
                    @selection-change="setDeTypeSelection"
                    ref="dimensionsTable"
                    :data="dimensions"
                    :height="quotaTableHeight"
                    style="width: 100%"
                  >
                    <el-table-column :selectable="selectable" type="selection" width="40" />
                    <el-table-column prop="name" :label="t('dataset.field_name')" width="264">
                      <template #default="scope">
                        <div class="column-style">
                          <el-input
                            v-model="scope.row.name"
                            :disabled="!!scope.row.warehouseFieldId"
                            :placeholder="t('commons.input_content')"
                          />
                          <el-tooltip effect="dark" content="关联维度" placement="top">
                            <el-button
                              v-if="scope.row.extField === 0"
                              text
                              class="warehouse-relation-trigger"
                              @click.stop="openWarehouseRelationDialog(scope.row, 'dimension')"
                            >
                              <svg viewBox="0 0 16 16" aria-hidden="true">
                                <path
                                  d="M3.5 2.5h4.086c.398 0 .78.158 1.06.44l3.414 3.414a1.5 1.5 0 0 1 0 2.121l-3.586 3.586a1.5 1.5 0 0 1-2.121 0L2.94 8.646A1.5 1.5 0 0 1 2.5 7.586V3.5a1 1 0 0 1 1-1Z"
                                />
                                <circle cx="5.5" cy="5.5" r="1" />
                              </svg>
                            </el-button>
                          </el-tooltip>
                          <el-tooltip effect="dark" content="清空关联" placement="top">
                            <el-button
                              v-if="scope.row.extField === 0 && !!scope.row.warehouseFieldId"
                              text
                              class="warehouse-relation-clear-trigger"
                              @click.stop="clearWarehouseRelationByAction(scope.row)"
                            >
                              <svg viewBox="0 0 16 16" aria-hidden="true">
                                <circle cx="8" cy="8" r="5.5" />
                                <path d="M6.2 6.2L9.8 9.8M9.8 6.2L6.2 9.8" />
                              </svg>
                            </el-button>
                          </el-tooltip>
                        </div>
                      </template>
                    </el-table-column>

                    <el-table-column
                      prop="originName"
                      :label="t('dataset.origin_name')"
                      width="240"
                    >
                      <template #default="scope">
                        <div class="column-style">
                          <span style="color: #8d9199" v-if="scope.row.extField === 2">{{
                            t('dataset.calc_field')
                          }}</span>
                          <span style="color: #8d9199" v-else-if="scope.row.extField === 3">{{
                            t('dataset.grouping_field')
                          }}</span>
                          <span v-else>{{ scope.row.originName }}</span>
                        </div>
                      </template>
                    </el-table-column>

                    <el-table-column
                      prop="description"
                      :label="t('deDataset.description')"
                      width="240"
                    >
                      <template #default="scope">
                        <div class="column-style">
                          <span v-if="scope.row.extField === 0">{{ scope.row.description }}</span>
                          <span style="color: #8d9199" v-else>&nbsp;</span>
                        </div>
                      </template>
                    </el-table-column>
                    <el-table-column
                      prop="datasetTableId"
                      :label="t('data_set.table_name_de')"
                      width="240"
                    >
                      <template #default="scope">
                        {{ scope.row.extField === 0 ? nameMap[scope.row.datasetTableId] : '' }}
                      </template>
                    </el-table-column>
                    <el-table-column prop="deType" :label="t('dataset.field_type')" width="200">
                      <template #default="scope">
                        <el-cascader
                          :class="
                            !!scope.row.deTypeArr && !!scope.row.deTypeArr.length && 'select-type'
                          "
                          v-if="scope.row.extField !== 3"
                          popper-class="cascader-panel"
                          v-model="scope.row.deTypeArr"
                          @change="val => cascaderChange(scope.row, val)"
                          :options="scope.row.deExtractType === 0 ? fieldOptions : fieldOptionsText"
                        >
                          <template v-slot="{ data }">
                            <el-icon>
                              <Icon
                                ><component
                                  class="svg-icon"
                                  :class="`field-icon-${
                                    fieldType[[2, 3].includes(data.value) ? 2 : 0]
                                  }`"
                                  :is="iconFieldMap[getIconName(data.value)]"
                                ></component
                              ></Icon>
                            </el-icon>
                            <span>{{ data.label }}</span>
                          </template>
                        </el-cascader>
                        <div style="padding-left: 30px" v-else>{{ $t('data_set.text') }}</div>
                        <span class="select-svg-icon">
                          <el-icon>
                            <Icon
                              ><component
                                class="svg-icon"
                                :class="`field-icon-${
                                  fieldType[[2, 3].includes(scope.row.deType) ? 2 : 0]
                                }`"
                                :is="iconFieldMap[getIconName(scope.row.deType)]"
                              ></component
                            ></Icon>
                          </el-icon>
                        </span>
                      </template>
                    </el-table-column>

                    <el-table-column
                      prop="deExtraType"
                      :label="t('dataset.origin_type')"
                      width="168"
                    >
                      <template #default="scope">
                        <div class="column-style">
                          <span style="color: #8d9199" v-if="scope.row.extField === 2">{{
                            t('dataset.calc_field')
                          }}</span>
                          <span style="color: #8d9199" v-else-if="scope.row.extField === 3">{{
                            t('dataset.grouping_field')
                          }}</span>
                          <span class="flex-align-center icon" v-else-if="scope.row.extField === 0">
                            <el-icon>
                              <Icon className="primary-color"
                                ><component
                                  class="svg-icon primary-color"
                                  :is="iconFieldMap[getIconName(scope.row.deExtractType)]"
                                ></component
                              ></Icon>
                            </el-icon>
                            {{ fieldTypes(scope.row.deExtractType) }}
                          </span>
                        </div>
                      </template>
                    </el-table-column>

                    <el-table-column fixed="right" :label="t('chart.dimension')">
                      <template #default="scope">
                        <el-tooltip
                          effect="dark"
                          :content="t('data_set.convert_to_indicator')"
                          placement="top"
                        >
                          <template #default>
                            <el-button
                              v-if="![3].includes(scope.row.extField)"
                              text
                              @click="handleFieldMore(scope.row, 'translate')"
                            >
                              <template #icon>
                                <Icon name="icon_switch_outlined"
                                  ><icon_switch_outlined class="svg-icon"
                                /></Icon>
                              </template>
                            </el-button>
                          </template>
                        </el-tooltip>
                      </template>
                    </el-table-column>

                    <el-table-column fixed="right" width="168" :label="t('dataset.operator')">
                      <template #default="scope">
                        <el-tooltip effect="dark" :content="t('dataset.copy')" placement="top">
                          <template #default>
                            <el-button text @click="handleFieldMore(scope.row, 'copy')">
                              <template #icon>
                                <Icon name="icon_copy_outlined"
                                  ><icon_copy_outlined class="svg-icon"
                                /></Icon>
                              </template>
                            </el-button>
                          </template>
                        </el-tooltip>

                        <el-tooltip effect="dark" :content="t('dataset.delete')" placement="top">
                          <template #default>
                            <el-button text @click="handleFieldMore(scope.row, 'delete')">
                              <template #icon>
                                <Icon name="icon_delete-trash_outlined"
                                  ><icon_deleteTrash_outlined class="svg-icon"
                                /></Icon>
                              </template>
                            </el-button>
                          </template>
                        </el-tooltip>

                        <el-tooltip effect="dark" :content="t('dataset.edit')" placement="top">
                          <template #default>
                            <el-button
                              v-if="[2, 3].includes(scope.row.extField)"
                              text
                              @click="handleFieldMore(scope.row, 'editor')"
                            >
                              <template #icon>
                                <Icon name="icon_edit_outlined"
                                  ><icon_edit_outlined class="svg-icon"
                                /></Icon>
                              </template>
                            </el-button>
                          </template>
                        </el-tooltip>
                      </template>
                    </el-table-column>
                  </el-table>
                </el-collapse-item>
                <el-collapse-item
                  name="quota"
                  :title="t('chart.quota')"
                  class="quota-manage-header manage-header"
                >
                  <el-table
                    @selection-change="setDeTypeSelection"
                    ref="quotaTable"
                    :height="quotaTableHeight"
                    :data="quota"
                    style="width: 100%"
                  >
                    <el-table-column type="selection" width="40" />
                    <el-table-column prop="name" :label="t('dataset.field_name')" width="264">
                      <template #default="scope">
                        <div class="column-style">
                          <el-input
                            v-model="scope.row.name"
                            :disabled="!!scope.row.warehouseFieldId"
                            :placeholder="t('commons.input_content')"
                          />
                          <el-tooltip effect="dark" content="关联指标" placement="top">
                            <el-button
                              v-if="scope.row.extField === 0"
                              text
                              class="warehouse-relation-trigger"
                              @click.stop="openWarehouseRelationDialog(scope.row, 'quota')"
                            >
                              <svg viewBox="0 0 16 16" aria-hidden="true">
                                <path
                                  d="M3.5 2.5h4.086c.398 0 .78.158 1.06.44l3.414 3.414a1.5 1.5 0 0 1 0 2.121l-3.586 3.586a1.5 1.5 0 0 1-2.121 0L2.94 8.646A1.5 1.5 0 0 1 2.5 7.586V3.5a1 1 0 0 1 1-1Z"
                                />
                                <circle cx="5.5" cy="5.5" r="1" />
                              </svg>
                            </el-button>
                          </el-tooltip>
                          <el-tooltip effect="dark" content="清空关联" placement="top">
                            <el-button
                              v-if="scope.row.extField === 0 && !!scope.row.warehouseFieldId"
                              text
                              class="warehouse-relation-clear-trigger"
                              @click.stop="clearWarehouseRelationByAction(scope.row)"
                            >
                              <svg viewBox="0 0 16 16" aria-hidden="true">
                                <circle cx="8" cy="8" r="5.5" />
                                <path d="M6.2 6.2L9.8 9.8M9.8 6.2L6.2 9.8" />
                              </svg>
                            </el-button>
                          </el-tooltip>
                        </div>
                      </template>
                    </el-table-column>

                    <el-table-column
                      prop="originName"
                      :label="t('dataset.origin_name')"
                      width="240"
                    >
                      <template #default="scope">
                        <div class="column-style">
                          <span v-if="scope.row.extField === 0">{{ scope.row.originName }}</span>
                          <span v-else style="color: #8d9199">{{ t('dataset.calc_field') }}</span>
                        </div>
                      </template>
                    </el-table-column>

                    <el-table-column
                      prop="description"
                      :label="t('deDataset.description')"
                      width="240"
                    >
                      <template #default="scope">
                        <div class="column-style">
                          <span v-if="scope.row.extField === 0">{{ scope.row.description }}</span>
                          <span style="color: #8d9199" v-else>&nbsp;</span>
                        </div>
                      </template>
                    </el-table-column>

                    <el-table-column
                      prop="datasetTableId"
                      :label="t('data_set.table_name_de')"
                      width="240"
                    >
                      <template #default="scope">
                        {{ scope.row.extField === 0 ? nameMap[scope.row.datasetTableId] : '' }}
                      </template>
                    </el-table-column>

                    <el-table-column prop="deType" :label="t('dataset.field_type')" width="200">
                      <template #default="scope">
                        <el-cascader
                          :class="
                            !!scope.row.deTypeArr && !!scope.row.deTypeArr.length && 'select-type'
                          "
                          popper-class="cascader-panel"
                          v-model="scope.row.deTypeArr"
                          @change="val => cascaderChange(scope.row, val)"
                          :options="scope.row.deExtractType === 0 ? fieldOptions : fieldOptionsText"
                        >
                          <template v-slot="{ data }">
                            <el-icon>
                              <Icon
                                ><component
                                  class="svg-icon"
                                  :class="`field-icon-${
                                    fieldType[[2, 3].includes(data.value) ? 2 : 0]
                                  }`"
                                  :is="iconFieldMap[getIconName(data.value)]"
                                ></component
                              ></Icon>
                            </el-icon>
                            <span>{{ data.label }}</span>
                          </template>
                        </el-cascader>
                        <span class="select-svg-icon">
                          <el-icon>
                            <Icon
                              ><component
                                class="svg-icon"
                                :class="`field-icon-${
                                  fieldType[[2, 3].includes(scope.row.deType) ? 2 : 0]
                                }`"
                                :is="iconFieldMap[getIconName(scope.row.deType)]"
                              ></component
                            ></Icon>
                          </el-icon>
                        </span>
                      </template>
                    </el-table-column>

                    <el-table-column
                      prop="deExtraType"
                      :label="t('dataset.origin_type')"
                      width="168"
                    >
                      <template #default="scope">
                        <div class="column-style">
                          <span style="color: #8d9199" v-if="scope.row.extField === 2">{{
                            t('dataset.calc_field')
                          }}</span>
                          <span style="color: #8d9199" v-else-if="scope.row.extField === 3">{{
                            t('dataset.grouping_field')
                          }}</span>
                          <span class="flex-align-center icon" v-else-if="scope.row.extField === 0">
                            <el-icon>
                              <Icon className="green-color"
                                ><component
                                  class="svg-icon green-color"
                                  :is="iconFieldMap[getIconName(scope.row.deExtractType)]"
                                ></component
                              ></Icon>
                            </el-icon>
                            {{ fieldTypes(scope.row.deExtractType) }}
                          </span>
                        </div>
                      </template>
                    </el-table-column>

                    <el-table-column fixed="right" :label="t('chart.quota')">
                      <template #default="scope">
                        <el-tooltip
                          effect="dark"
                          :content="t('data_set.convert_to_dimension')"
                          placement="top"
                        >
                          <template #default>
                            <el-button text @click="handleFieldMore(scope.row, 'translate')">
                              <template #icon>
                                <Icon name="icon_switch_outlined"
                                  ><icon_switch_outlined class="svg-icon"
                                /></Icon>
                              </template>
                            </el-button>
                          </template>
                        </el-tooltip>
                      </template>
                    </el-table-column>

                    <el-table-column fixed="right" width="168" :label="t('dataset.operator')">
                      <template #default="scope">
                        <el-tooltip effect="dark" :content="t('dataset.copy')" placement="top">
                          <template #default>
                            <el-button text @click="handleFieldMore(scope.row, 'copy')">
                              <template #icon>
                                <Icon name="icon_copy_outlined"
                                  ><icon_copy_outlined class="svg-icon"
                                /></Icon>
                              </template>
                            </el-button>
                          </template>
                        </el-tooltip>

                        <el-tooltip effect="dark" :content="t('dataset.delete')" placement="top">
                          <template #default>
                            <el-button text @click="handleFieldMore(scope.row, 'delete')">
                              <template #icon>
                                <Icon name="icon_delete-trash_outlined"
                                  ><icon_deleteTrash_outlined class="svg-icon"
                                /></Icon>
                              </template>
                            </el-button>
                          </template>
                        </el-tooltip>

                        <el-tooltip effect="dark" :content="t('dataset.edit')" placement="top">
                          <template #default>
                            <el-button
                              v-if="scope.row.extField === 2"
                              text
                              @click="handleFieldMore(scope.row, 'editor')"
                            >
                              <template #icon>
                                <Icon name="icon_edit_outlined"
                                  ><icon_edit_outlined class="svg-icon"
                                /></Icon>
                              </template>
                            </el-button>
                          </template>
                        </el-tooltip>
                      </template>
                    </el-table-column>
                  </el-table>
                </el-collapse-item>
              </el-collapse>
            </div>
            <div class="batch-operate flex-align-center" v-if="!!deTypeSelection.length">
              <div class="flex-align-center">
                {{ t('data_set.selected') }}
                <span class="num">{{ deTypeSelection.length }}</span>
                {{ t('data_set.bar') }}
                <el-button @click="clearSelection" text style="margin-left: 16px">{{
                  t('commons.clear')
                }}</el-button>
              </div>
              <div class="cascader-batch">
                <el-cascader
                  :disabled="!showCascaderBatch"
                  :class="!!deTypeArr.length && 'select-type'"
                  v-model="deTypeArr"
                  @change="cascaderChangeArr"
                  popper-class="cascader-panel"
                  :options="
                    deTypeSelection.every(ele => ele === 0) ? fieldOptions : fieldOptionsText
                  "
                >
                  <template v-slot="{ data }">
                    <el-icon>
                      <Icon
                        ><component
                          class="svg-icon"
                          :class="`field-icon-${fieldType[[2, 3].includes(data.value) ? 2 : 0]}`"
                          :is="iconFieldMap[getIconName(data.value)]"
                        ></component
                      ></Icon>
                    </el-icon>
                    <span>{{ data.label }}</span>
                  </template>
                </el-cascader>
                <span class="select-svg-icon">
                  <el-icon>
                    <Icon :className="`field-icon-${getIconName(deTypeArr[0])}`"
                      ><component
                        class="svg-icon"
                        :class="`field-icon-${getIconName(deTypeArr[0])}`"
                        :is="iconFieldMap[getIconName(deTypeArr[0])]"
                      ></component
                    ></Icon>
                  </el-icon>
                </span>
                <el-tooltip class="item" effect="dark" placement="top">
                  <template #content>
                    <div>{{ t('dataset.field_diff') }}</div>
                  </template>
                  <el-icon size="16px" style="margin-left: 6px" v-show="!showCascaderBatch">
                    <Icon name="icon_info_outlined"
                      ><icon_info_outlined class="svg-icon tip-icon"
                    /></Icon>
                  </el-icon>
                </el-tooltip>
              </div>
              <el-button
                @click="dqTransArr('q')"
                v-if="fieldSelection.every(ele => ele.groupType === 'd')"
                plain
                style="margin-left: 200px"
              >
                {{ t('data_set.convert_to_indicator') }}
              </el-button>
              <el-button
                @click="dqTransArr('d')"
                v-else-if="fieldSelection.every(ele => ele.groupType === 'q')"
                plain
                style="margin-left: 200px"
              >
                {{ t('data_set.convert_to_dimension') }}
              </el-button>
            </div>
          </div>
        </div>
      </div>
    </div>
    <el-drawer
      :title="t('dataset.edit_union_relation')"
      v-model="editUnion"
      modal-class="union-dataset-drawer"
      size="840px"
      :before-close="closeEditUnion"
      direction="rtl"
    >
      <union-edit ref="fieldUnion" :editArr="state.editArr" />
      <template #footer>
        <el-button secondary @click="closeEditUnion">{{ t('dataset.cancel') }} </el-button>
        <el-button type="primary" @click="confirmEditUnion">{{ t('dataset.confirm') }} </el-button>
      </template>
    </el-drawer>
    <el-dialog
      v-model="warehouseRelationDialog.visible"
      class="warehouse-select-dialog"
      :title="warehouseDialogTitle"
      width="1280px"
      @closed="closeWarehouseRelationDialog"
    >
      <div class="warehouse-select-toolbar">
        <el-select v-model="warehouseRelationDialog.searchField" style="width: 180px">
          <el-option
            v-for="item in warehouseRelationSearchOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
        <el-input
          v-model="warehouseRelationDialog.keyword"
          :placeholder="warehouseRelationSearchPlaceholder"
          clearable
          @keyup.enter="searchWarehouseRelation"
        >
          <template #prefix>
            <el-icon>
              <Icon name="icon_search-outline_outlined"
                ><icon_searchOutline_outlined class="svg-icon"
              /></Icon>
            </el-icon>
          </template>
        </el-input>
        <el-button @click="resetWarehouseRelationSearch">{{ t('commons.reset') }}</el-button>
      </div>
      <el-table
        :data="warehouseRelationPagedList"
        :row-class-name="getWarehouseRelationRowClassName"
        v-loading="warehouseRelationDialog.loading"
        border
        style="width: 100%"
      >
        <template v-if="warehouseRelationDialog.type === 'dimension'">
          <el-table-column prop="name" label="维度名称" min-width="180" />
          <el-table-column prop="category" label="维度分类" min-width="140" />
          <el-table-column prop="enumValues" label="维度枚举值" min-width="220" show-overflow-tooltip />
          <el-table-column prop="hiveTableName" label="维度HIVE表名" min-width="180" />
        </template>
        <template v-else>
          <el-table-column prop="name" label="指标名称" min-width="180" />
          <el-table-column prop="measureType" label="指标分类" min-width="140" />
          <el-table-column prop="atomName" label="原子指标" min-width="160" />
          <el-table-column prop="driveName" label="派生指标" min-width="180" />
        </template>
        <el-table-column prop="status" :label="t('datasource.status')" min-width="120" />
        <el-table-column prop="creator" :label="t('visualization.creator')" min-width="120" />
        <el-table-column prop="projectSource" label="项目来源" min-width="140" />
        <el-table-column fixed="right" label="操作" width="88">
          <template #default="scope">
            <el-button text type="primary" @click="selectWarehouseRelation(scope.row)">
              选择
            </el-button>
          </template>
        </el-table-column>
        <template #empty>
          <empty-background :description="t('data_set.no_data')" img-type="noneWhite" />
        </template>
      </el-table>
      <div class="warehouse-select-pagination">
        <el-pagination
          background
          layout="prev, pager, next, sizes, total"
          :current-page="warehouseRelationDialog.currentPage"
          :page-size="warehouseRelationDialog.pageSize"
          :page-sizes="[10, 20, 50]"
          :total="warehouseRelationList.length"
          @size-change="handleWarehouseRelationSizeChange"
          @current-change="handleWarehouseRelationCurrentChange"
        />
      </div>
    </el-dialog>
  </div>
  <creat-ds-group
    @finish="finish"
    @onDatasetSave="saveAndBack"
    ref="creatDsFolder"
  ></creat-ds-group>
  <creat-ds-group-data-source
    @handle-show-finish-page="handleShowFinishPage"
    @finish-ds="complete"
    ref="creatDsFolderDataSource"
  ></creat-ds-group-data-source>
  <el-dialog
    modal-class="calc-field-edit-dialog"
    v-model="editCalcField"
    width="1000px"
    :title="calcTitle"
  >
    <calc-field-edit ref="calcEdit" :crossDs="crossDatasources" />
    <template #footer>
      <el-button secondary @click="closeEditCalc()">{{ t('dataset.cancel') }} </el-button>
      <el-button secondary @click="verify">{{ t('datasource.validate') }} </el-button>
      <el-button type="primary" @click="confirmEditCalc()">{{ t('dataset.confirm') }} </el-button>
    </template>
  </el-dialog>
  <el-dialog
    class="create-dialog"
    :title="t('data_set.format_edit')"
    v-model="updateCustomTime"
    width="1000px"
  >
    <el-form ref="ruleFormRef" :rules="rules" :model="currentField" label-width="120px">
      <el-form-item prop="name" :label="t('data_set.custom_time_format')">
        <el-input v-model="currentField.name" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button secondary @click="closeCustomTime()">{{ t('dataset.cancel') }} </el-button>
      <el-button type="primary" @click="confirmCustomTime()">{{ t('dataset.confirm') }} </el-button>
    </template>
  </el-dialog>
  <el-dialog
    class="create-dialog"
    :title="t('datasource.field_rename')"
    v-model="editNormalField"
    width="420px"
  >
    <el-form
      ref="ruleFormFieldRef"
      :rules="fieldRules"
      :model="currentNormalField"
      require-asterisk-position="right"
      label-position="top"
      label-width="120px"
    >
      <el-form-item prop="name" :label="t('dataset.field_name')">
        <el-input v-model="currentNormalField.name" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button secondary @click="closeNormalField()">{{ t('dataset.cancel') }} </el-button>
      <el-button type="primary" @click="confirmNormalField()"
        >{{ t('dataset.confirm') }}
      </el-button>
    </template>
  </el-dialog>
  <el-dialog
    class="create-dialog group-fields_dialog"
    :title="titleForGroup"
    v-model="editGroupField"
    width="1000px"
  >
    <el-form
      ref="ruleGroupFieldRef"
      :rules="fieldGroupRules"
      :model="currentGroupField"
      require-asterisk-position="right"
      label-position="top"
      label-width="120px"
      v-loading="enumValueLoading"
    >
      <el-row :gutter="24">
        <el-col :span="12">
          <el-form-item prop="name" :label="t('dataset.field_name')">
            <el-input
              :placeholder="t('dataset.input_edit_name')"
              v-model="currentGroupField.name"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item prop="originName" :label="t('dataset.grouping_field')">
            <el-select
              @change="handleFieldschange"
              v-model="currentGroupField.originName"
              style="width: 100%"
            >
              <el-option
                v-for="item in groupFields"
                :key="item.id"
                :label="item.name"
                :value="item.id"
              />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <el-form-item style="margin-top: 16px">
        <template v-slot:label>
          <div class="grouping_settings_label">
            {{ t('dataset.grouping_settings') }}
          </div>
        </template>
        <div style="width: 100%">
          <el-scrollbar max-height="393px"
            ><div
              class="group-fields_item"
              v-for="(domain, index) in currentGroupField.groupList"
              :key="index"
            >
              <el-form
                :ref="el => (refsForm[index] = el)"
                :model="domain"
                inline
                :key="index"
                label-width="auto"
                class="form-dynamic"
              >
                <el-form-item
                  :key="index + 'name'"
                  prop="name"
                  :rules="{
                    required: true,
                    message: t('chart.value_can_not_empty'),
                    trigger: 'blur'
                  }"
                  ><el-input
                    style="width: 278px"
                    v-model="domain.name"
                    :placeholder="t('common.inputText')"
                /></el-form-item>
                <el-form-item
                  :key="index + 'text'"
                  v-if="[0, null].includes(currentGroupField.deTypeOrigin)"
                  prop="text"
                  style="width: 100%; margin-left: 24px"
                  :rules="{
                    validator: validatePass,
                    required: true,
                    trigger: 'change'
                  }"
                  ><el-select
                    style="width: 100%"
                    multiple
                    collapse-tags
                    filterable
                    collapse-tags-tooltip
                    :max-collapse-tags="2"
                    v-model="domain.text"
                  >
                    <el-option
                      v-for="item in enumValue"
                      :key="item"
                      :label="item"
                      :disabled="disabledEnum(item, domain.text)"
                      :value="item"
                    />
                  </el-select>
                </el-form-item>
                <div
                  class="group-fields_num"
                  v-else-if="[2, 3, 4].includes(currentGroupField.deTypeOrigin)"
                >
                  <el-form-item
                    :key="index + 'min'"
                    prop="min"
                    :rules="{
                      required: true,
                      message: t('chart.value_can_not_empty'),
                      trigger: 'blur'
                    }"
                    ><el-input-number
                      :placeholder="t('dataset.please_enter_number')"
                      v-model="domain.min"
                      controls-position="right"
                  /></el-form-item>
                  <el-form-item :key="index + 'minTerm'"
                    ><el-select v-model="domain.minTerm">
                      <el-option
                        v-for="item in equalMin"
                        :key="item.value"
                        :label="item.label"
                        :value="item.value"
                      />
                    </el-select>
                  </el-form-item>
                  <div class="name">
                    {{ t('dataset.field_value') }}
                  </div>
                  <el-form-item :key="index + 'maxTerm'"
                    ><el-select v-model="domain.maxTerm">
                      <el-option
                        v-for="item in equalMin"
                        :key="item.value"
                        :label="item.label"
                        :value="item.value"
                      />
                    </el-select>
                  </el-form-item>
                  <el-form-item
                    :key="index + 'max'"
                    prop="max"
                    :rules="{
                      required: true,
                      message: t('chart.value_can_not_empty'),
                      trigger: 'blur'
                    }"
                    ><el-input-number
                      :placeholder="t('dataset.please_enter_number')"
                      v-model="domain.max"
                      :validate-even="false"
                      controls-position="right"
                  /></el-form-item>
                </div>
                <el-form-item
                  :key="index + 'time'"
                  prop="time"
                  class="group-fields_num"
                  v-else-if="[1].includes(currentGroupField.deTypeOrigin)"
                  :rules="{
                    required: true,
                    validator: validatePass,
                    trigger: 'change'
                  }"
                  ><el-date-picker
                    :end-placeholder="t('commons.date.end_date')"
                    :start-placeholder="t('commons.date.start_date')"
                    v-model="domain.time"
                    type="daterange" />
                  </el-form-item>
                </el-form>
              <el-button
                class="variable_del"
                text
                v-if="currentGroupField.groupList.length !== 1"
                @click="removeGroupFields(index)">
                <template #icon>
                  <Icon><icon_deleteTrash_outlined class="svg-icon" /></Icon>
                </template>
              </el-button>
            </div>
          </el-scrollbar>
        </div>
      </el-form-item>
      <el-button style="margin-top: -20px" @click="addGroupFields" text>
        <template #icon>
          <icon><icon_add_outlined class="svg-icon" /></icon>
        </template>
        {{ t('auth.add_condition') }}
      </el-button>
      <div class="line"></div>
      <div class="group-fields_item" style="align-items: center">
        <el-input
          :placeholder="t('common.inputText')"
          style="width: 278px; margin-right: 24px"
          v-model="currentGroupField.otherGroup"
        />
        {{ t('dataset.ungrouped_value') }}
      </div>
    </el-form>
    <template #footer>
      <el-button secondary @click="closeGroupField">{{ t('dataset.cancel') }} </el-button>
      <el-button type="primary" @click="confirmGroupField">{{ t('dataset.confirm') }} </el-button>
    </template>
  </el-dialog>
  <el-dialog
    v-model="excelVisible"
    title="新建文件数据源"
    :width="isFullscreen ? '100%' : '1000px'"
    :fullscreen="isFullscreen"
    :close-on-click-modal="false"
    :append-to-body="true"
    :before-close="beforeClose"
  >
    <div class="datasource-new">
      <div class="ds-editor" :class="editDs && 'edit-ds'">
        <excel-detail
          v-if="excelVisible"
          :editDs="editDs"
          :is-supportSetKey="isSupportSetKey"
          ref="excel"
          :param="form2"
        ></excel-detail>
      </div>
      <div class="editor-footer">
        <el-button secondary @click="beforeClose"> {{ t('common.cancel') }}</el-button>
        <el-button type="primary" @click="saveDS">{{ t('common.save') }}</el-button>
      </div>
    </div>
  </el-dialog>
  <XpackComponent
    jsname="L2NvbXBvbmVudC9lbWJlZGRlZC1pZnJhbWUvTmV3V2luZG93SGFuZGxlcg=="
    @loaded="XpackLoaded"
    @load-fail="XpackLoaded"
  />
  <XpackComponent
    jsname="L2NvbXBvbmVudC9wbHVnaW5zLWhhbmRsZXIvRHNDYXRlZ29yeUhhbmRsZXI="
    @load-ds-plugin="loadDsPlugin"
  />
  <XpackComponent
    v-if="state.dataSourceList"
    ref="datasetCheckRef"
    :is-edit="isEdit"
    :ds-list="state.dataSourceList"
    :ds-id="dataSource"
    @back="pushDataset"
    jsname="L2NvbXBvbmVudC9kYXRhc2V0L2luZGV4"
  />
</template>

<style lang="less" scoped>
@import '@/style/mixin.less';

:deep(.dataset-preview_table) {
  .ed-table__body {
    .ed-table__row:not(.no-hide) {
      .cell {
        white-space: nowrap;
      }
    }
  }
}

.ed-table {
  --ed-table-header-bg-color: #f5f6f7;
}

.de-dataset-form {
  color: #1f2329;

  :deep(.ed-table__border-left-patch),
  :deep(.ed-table--border .ed-table__inner-wrapper::after) {
    display: none !important;
  }

  --ed-border-color-lighter: #1f232926 !important;
  .top {
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 24px;
    background: #fff;
    border-bottom: 1px solid var(--ed-border-color-lighter, #1f232926);
    box-shadow: none;

    .name {
      color: #1f2329;
      font-family: var(--de-custom_font, 'PingFang');
      font-size: 16px;
      font-weight: 400;
      display: flex;
      align-items: center;
      width: 50%;
      position: relative;

      .ed-form-item__error {
        top: 19px !important;
        left: 16px !important;
      }
      .dataset-name {
        cursor: pointer;
        width: 294px;
      }

      .ed-input {
        width: 302px;
        line-height: 24px;
        height: 24px;
        :deep(.ed-input__wrapper) {
          background-color: #fff;
          box-shadow: 0 0 0 1px var(--ed-border-color-lighter, #1f232926);
          padding: 0 4px;
        }
        :deep(.ed-input__inner) {
          color: #1f2329;
          font-size: 16px;
        }
      }
      i {
        cursor: pointer;
      }
    }
  }

  .container {
    width: 100%;
    height: calc(100vh - 48px);
    position: relative;
    .drag-left {
      position: absolute;
      height: calc(100vh - 48px);
      width: 4px;
      top: 0;
      z-index: 2;
      cursor: col-resize;

      &.is-dragging::after,
      &:hover::after {
        width: 1px;
        height: 100%;
        content: '';
        position: absolute;
        left: -1px;
        top: 0;
        background: var(--ed-color-primary);
      }
    }

    .arrow-right {
      position: absolute;
      top: 15px;
      z-index: 2;
      cursor: pointer;
      margin: 0;
      display: flex;
      align-items: center;
      left: 0;
      height: 24px;
      width: 20px;
      box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.1);
      border: 1px solid var(--deCardStrokeColor, #dee0e3);
      display: flex;
      align-items: center;
      padding-left: 2px;
      border-top-right-radius: 12px;
      border-bottom-right-radius: 12px;
      background: #fff;
      font-size: 12px;

      &:hover {
        padding-left: 4px;
        width: 24px;
        .ed-icon {
          color: var(--ed-color-primary, #33BDFC);
        }
      }
    }

    .table-list {
      .list-item_primary {
        padding: 8px;
      }
      .table-list-top {
        padding: 16px;
        padding-bottom: 0;
      }

      height: 100%;
      width: 240px;
      padding-bottom: 16px;

      font-family: var(--de-custom_font, 'PingFang');
      border-right: 1px solid rgba(31, 35, 41, 0.15);

      .select-ds {
        font-size: 14px;
        font-weight: 500;
        display: flex;
        justify-content: space-between;
        align-items: center;
        color: var(--deTextPrimary, #1f2329);
        position: relative;

        i {
          cursor: pointer;
          font-size: 12px;
          color: var(--deTextPlaceholder, rgba(31, 35, 41, 0.15));
        }

        .left-outlined {
          position: absolute;
          font-size: 12px;
          right: -30px;
          top: -5px;
          height: 24px;
          border: 1px solid #dee0e3;
          width: 24px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #fff;
          box-shadow: 0px 5px 10px 0px #1f23291a;
          z-index: 10;
          &:hover {
            .ed-icon {
              color: var(--ed-color-primary, #33BDFC) !important;
            }
          }
        }
      }

      .table-num {
        .num {
          display: flex;
          align-items: center;
          font-weight: 400;
          font-size: 14px;
          color: #646a73;
          .ed-icon {
            margin-right: 5.33px;
          }
        }

        i {
          cursor: auto;
          font-size: 16px;
          color: var(--deTextPlaceholder, #646a73);
        }
      }

      .search {
        margin: 12px 0;
      }

      .ds-list {
        margin: 12px 0 24px 0;
        width: 100%;
      }

      .table-checkbox-list {
        height: calc(100% - 190px);
        overflow-y: auto;
        padding: 0 8px;

        .not-allow {
          cursor: not-allowed;
          color: var(--deTextDisable, #bbbfc4);
        }
      }
    }
  }

  .dataset-db {
    display: flex;
    .drag-right {
      height: calc(100vh - 56px);
      .different-datasource {
        height: 40px;
        width: 100%;
        background: #ffe7cc;
        color: #1f2329;
        font-size: 14px;
        font-weight: 400;
        line-height: 22px;
        display: flex;
        align-items: center;
        padding: 0 16px;

        .ed-icon {
          font-size: 16px;
          margin-right: 8px;
        }
      }
      .sql-result {
        font-family: var(--de-custom_font, 'PingFang');
        font-size: 14px;
        overflow-y: auto;
        box-sizing: border-box;
        :deep(.ed-tabs) {
          position: relative;
          z-index: 4;
        }

        .sql-title {
          user-select: none;
          height: 10px;
          position: relative;
          z-index: 5;
          color: var(--deTextPrimary, #1f2329);

          .field-data {
            position: absolute;
            right: 24px;
            top: 13px;
            width: 50%;
            z-index: 2;
            text-align: right;
          }

          .drag {
            position: absolute;
            top: 4px;
            left: 0;
            height: 7px;
            width: 100%;
            cursor: row-resize;
            &::after {
              content: '';
              height: 7px;
              width: 100px;
              border-radius: 3.5px;
              position: absolute;
              left: 50%;
              top: 0;
              transform: translateX(-50%);
              background: rgba(31, 35, 41, 0.1);
            }
          }
        }

        .padding-24 {
          .border-bottom-tab(24px);
          :deep(.ed-tabs__header::after) {
            display: none;
          }
        }

        .table-preview {
          height: calc(100% - 56px);
          box-sizing: border-box;

          .preview-data {
            float: right;
            height: 100%;
            width: calc(100% - 260px);

            :deep(.ed-table-v2__header-cell) {
              background-color: #f5f6f7 !important;
            }

            :deep(.header-cell) {
              border-top: none;
            }
          }

          .preview-field {
            float: left;
            width: 260px;
            height: 100%;
            position: relative;

            :deep(.ed-tree-node__content) {
              border-radius: 4px;
              &:hover {
                background: rgba(31, 35, 41, 0.1);
              }
            }

            :deep(.ed-tree-node.is-current > .ed-tree-node__content:not(.is-menu):after) {
              display: none;
            }

            .custom-tree-node {
              width: calc(100% - 32px);
              display: flex;
              align-items: center;
              padding-right: 8px;
              box-sizing: content-box;

              .label-tooltip {
                margin-left: 5.33px;
                width: 70%;
                overflow: hidden;
                white-space: nowrap;
                text-overflow: ellipsis;
              }

              .operate {
                margin-left: auto;
                position: relative;
                z-index: 5;
              }
            }

            .field-d,
            .field-q {
              padding: 0 8px;
              position: relative;
              height: 49px;

              &.open {
                height: 50%;
              }
              .title {
                cursor: pointer;
                position: sticky;
                margin: 1px;
                top: 1px;
                height: 49px;
                font-family: var(--de-custom_font, 'PingFang');
                font-style: normal;
                font-weight: 500;
                font-size: 14px;
                line-height: 22px;
                color: #1f2329;
                display: flex;
                align-items: center;
                z-index: 10;
                background: #fff;

                .add {
                  margin-left: auto;
                }
                i {
                  color: #646a73;
                }

                .expand {
                  font-size: 10px;
                }

                &.expanded {
                  .expand {
                    transform: rotate(90deg);
                  }
                }
              }
              overflow-y: auto;
            }

            .field-d {
              max-height: calc(100% - 50px);
              border-bottom: 1px solid rgba(31, 35, 41, 0.15);
            }
          }
        }
      }
    }
  }
}
.icon-color {
  color: #646a73;
}

.ed-button.is-secondary.is-disabled {
  color: #bbbfc4 !important;
  border-color: #bbbfc4 !important;
}

.father .child {
  visibility: hidden;
}

.father:hover .child {
  visibility: visible;
}

.manage-container {
  padding: 12px 24px 0;
  flex: 1;
  overflow: auto;
}

.style-collapse {
  :deep(.ed-collapse-item__header),
  :deep(.ed-collapse-item__wrap) {
    border-bottom: none !important;
  }
  :deep(.ed-collapse-item__content) {
    padding: 0 !important;
  }

  &.data-tab-collapse {
    border-bottom: none;
    border-top: 1px solid var(--ed-collapse-border-color);

    :deep(.ed-collapse-item.ed-collapse--dark .ed-collapse-item__wrap) {
      background-color: #1a1a1a;
    }

    :deep(.ed-collapse-item__wrap) {
      border-top: none !important;
    }
    :deep(.ed-collapse-item__content) {
      padding: 0 !important;
      border-top: none !important;
    }
    :deep(.ed-collapse-item__header) {
      background-color: transparent;
      border-bottom: none !important;
    }
  }
}

.column-style {
  display: flex;
  align-items: center;

  .ed-input {
    flex: 1;
  }
}

.warehouse-relation-trigger {
  margin-left: 8px;
  padding: 0;
  color: var(--ed-color-primary, #33bdfc);

  svg {
    width: 20px;
    height: 20px;
    stroke: currentColor;
    fill: none;
    stroke-width: 1.6;
    stroke-linejoin: round;
  }

  circle {
    fill: currentColor;
    stroke: none;
  }
}

.warehouse-relation-clear-trigger {
  margin-left: 4px;
  padding: 0;
  color: var(--ed-color-primary, #33bdfc);

  svg {
    width: 20px;
    height: 20px;
    fill: none;
    stroke: currentColor;
    stroke-width: 1.5;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
}

.select-svg-icon {
  position: absolute;
  left: 24px;
  top: 50%;
  height: 14px;
  transform: translateY(-50%);
  line-height: 14px;
}

.batch-operate {
  width: 100%;
  height: 64px;
  padding: 0 24px;
  z-index: 2;
  box-shadow: 0px -2px 4px rgba(31, 35, 41, 0.08);

  .select-svg-icon {
    left: 11px;
  }

  .flex-align-center {
    white-space: nowrap;
    .num {
      margin: 0 4px;
    }
    .is-text {
      margin-left: 16px;
    }
  }

  .cascader-batch {
    position: relative;
    margin-left: 30%;
    width: 176px;
    display: flex;
    align-items: center;
  }

  .tip-icon {
    color: #f54a45;
  }
}

.batch-area {
  display: flex;
  flex-direction: column;
  height: calc(100% - 55px);
}

.dimension-manage-header {
  :deep(.ed-collapse-item__header) {
    background: #ebf1ff;
  }
}
.quota-manage-header {
  :deep(.ed-collapse-item__header) {
    background: #e6f7f5;
  }
}
.manage-header {
  :deep(.ed-collapse-item__header) {
    height: 30px;
  }
  :deep(.ed-table th.ed-table__cell) {
    background: #f5f6f7;
  }
}
</style>

<style lang="less">
.cascader-panel {
  .ed-scrollbar__wrap {
    height: 210px !important;
  }
  .ed-cascader-node__label {
    display: flex;
    align-items: center;
    .ed-icon {
      margin-right: 5px;
    }
  }
}
.select-type {
  .ed-input__wrapper {
    padding-left: 32px;
  }
}
.green-color {
  color: #04b49c;
}
.ed-select-dropdown__item {
  display: flex;
  align-items: center;
  .ed-icon {
    font-size: 14px;
    margin-right: 5.25px;
  }
}
.tree-select-ds_popper {
  .ed-tree-node.is-current > .ed-tree-node__content:not(.is-menu):after {
    display: none !important;
  }

  .flex-align-center {
    padding-right: 15px;
  }
}
.calc-field-edit-dialog {
  .ed-dialog__footer {
    padding-top: 24px;
    border: 1px solid rgba(31, 35, 41, 0.15);
  }
}
.group-fields_dialog {
  .group-fields_item {
    padding: 16px;
    background: #f5f6f7;
    border-radius: 4px;
    display: flex;

    & + .group-fields_item {
      margin-top: 8px;
    }

    .form-dynamic {
      display: flex;
      width: 100%;
      align-items: center;
      .ed-form-item {
        margin: 0;
      }
      &:has(.is-error) {
        .ed-form-item {
          margin-bottom: 24px;
        }
      }
    }

    .variable_del {
      color: #646a73;
      margin-left: 4px;
      margin-right: -4px;

      .ed-icon {
        font-size: 16px;
      }

      &:hover {
        background: rgba(31, 35, 41, 0.1) !important;
      }
      &:focus {
        background: rgba(31, 35, 41, 0.1) !important;
      }
      &:active {
        background: rgba(31, 35, 41, 0.2) !important;
      }
    }

    .group-fields_num {
      flex: 1;
      display: flex;
      gap: 8px;
      margin-left: 24px;
      .name {
        white-space: nowrap;
      }
    }
  }

  .line {
    background: #1f232926;
    height: 1px;
    width: 100%;
    margin-bottom: 16px;
    margin-top: 8px;
  }

  .grouping_settings_label:after {
    content: '*';
    color: var(--ed-color-danger);
    margin-left: 2px;
    font-family: var(--de-custom_font, 'PingFang');
    font-size: 14px;
    font-style: normal;
    font-weight: 400;
  }
}
.warehouse-select-dialog {
  .warehouse-relation-selected-row > td,
  .warehouse-relation-selected-row .ed-table__cell,
  .warehouse-relation-selected-row:hover > td,
  .warehouse-relation-selected-row:hover .ed-table__cell {
    background: #f0f9ff !important;
  }

  .warehouse-select-toolbar {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 16px;

    .ed-input {
      width: 320px;
    }
  }

  .warehouse-select-pagination {
    display: flex;
    justify-content: flex-end;
    margin-top: 16px;
  }
}
.datasource-new {
  width: 100%;
  height: 100%;
  background: #fff;
  position: relative;
  .ds-editor {
    width: 100%;
    height: calc(100% - 64px);

    &.edit-ds {
      width: 100%;
    }

    .excel-detail {
      width: 95%;
      margin: 0 0 0 30px;
      justify-content: inherit;
      .detail-inner {
        width: 100%;
        max-width: 1800px;
        padding-top: 0;
      }
    }

    .ds-type-title {
      width: 100%;
      padding: 16px 24px;
      color: #1f2329;
      font-family: var(--de-custom_font, 'PingFang');
      font-size: 16px;
      font-style: normal;
      font-weight: 500;
      line-height: 24px;
      border-bottom: 1px solid rgba(31, 35, 41, 0.15);
    }

    .editor-content {
      padding: 16px 24px;
      height: calc(100vh - 278px);
      overflow-y: auto;

      &.type-title {
        height: calc(100vh - 221px);
      }
    }
  }
  .editor-footer {
    height: 64px;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    width: 100%;
    padding-right: 24px;
    float: left;
    border-top: 1px solid rgba(31, 35, 41, 0.15);
    position: relative;
    z-index: 10;
    background: #fff;
  }
}
</style>
