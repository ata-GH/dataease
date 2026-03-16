<!-- eslint-disable -->
<script setup lang="ts">
/* eslint-disable */
// 核心Vue模块
import { computed, nextTick, onMounted, onUnmounted, reactive, ref } from 'vue'
import { storeToRefs } from 'pinia'
import router from '@/router'

// 状态管理相关
import { dvMainStoreWithOut } from '@/store/modules/data-visualization/dvMain'
import { snapshotStoreWithOut } from '@/store/modules/data-visualization/snapshot'
import { interactiveStoreWithOut } from '@/store/modules/interactive'
import { useAppStoreWithOut } from '@/store/modules/app'
import { useEmbedded } from '@/store/modules/embedded'

// UI组件
import DvSidebar from '../../components/visualization/DvSidebar.vue'
import DbToolbar from '@/components/dashboard/DbToolbarNew.vue'
import ViewEditor from '@/views/chart/components/editor-new/index.vue'
import DbCanvasAttr from '@/components/dashboard/DbCanvasAttr.vue'
import ChartStyleBatchSet from '@/views/chart/components/editor/editor-style/ChartStyleBatchSet.vue'
// import DeCanvas from '@/views/canvas/DeCanvas.vue'
import MobileConfigPanel from './MobileConfigPanel.vue'
import CanvasCacheDialog from '@/components/visualization/CanvasCacheDialog.vue'
import { XpackComponent } from '@/components/plugin'
import { ElMessage, ElTreeSelect } from 'element-plus-secondary'
import ComponentWrapper from '@/components/data-visualization/canvas/ComponentWrapper.vue'

// API和工具函数
import { getDatasetTree } from '@/api/dataset'
import { watermarkFind } from '@/api/watermark'
import { decompressionPre, initCanvasData, onInitReady } from '@/utils/canvasUtils'
import { check, compareStorage } from '@/utils/CrossPermission'
import { useCache } from '@/hooks/web/useCache'
import { useEmitt } from '@/hooks/web/useEmitt'
import { findComponentAttr } from '../../utils/components'
import { deepCopy } from '@/utils/utils'
import findComponent from '@/utils/components'
import { findNewComponentFromList } from '@/custom-component/component-list' // 左侧列表数据

import { syncShapeItemStyle, getStyle} from '@/utils/style'
import { adaptCurThemeCommonStyle } from '@/utils/canvasStyle'
import { guid } from '@/views/visualized/data/dataset/form/util.js'

// 第三方库
import { cloneDeep, concat } from 'lodash-es'
import { Base64 } from 'js-base64'

// 类型导入
import { Tree } from '@/views/visualized/data/dataset/form/CreatDsGroup.vue'
// 状态管理初始化
const interactiveStore = interactiveStoreWithOut()
import { useRequestStoreWithOut } from '@/store/modules/request'
import { usePermissionStoreWithOut } from '@/store/modules/permission'
import eventBus from '@/utils/eventBus'
import { useI18n } from '@/hooks/web/useI18n'
import DashboardHiddenComponent from '@/components/dashboard/DashboardHiddenComponent.vue'
import { recoverToPublished } from '@/api/visualization/dataVisualization'
// import SqlAssistant from '@/views/sqlbot/assistant.vue'
const embeddedStore = useEmbedded()
const dvMainStore = dvMainStoreWithOut()
const snapshotStore = snapshotStoreWithOut()
const requestStore = useRequestStoreWithOut()
const permissionStore = usePermissionStoreWithOut()
const appStore = useAppStoreWithOut()

// 工具函数和hooks
const { wsCache } = useCache()
const { t } = useI18n()

// 响应式状态
const {
  fullscreenFlag,
  componentData,
  curComponent,
  canvasStyleData,
  canvasViewInfo,
  editMode,
  batchOptStatus,
  hiddenListStatus,
  lastHiddenComponent,
  dvInfo,
  mobileInPc,
  curOriginThemes
} = storeToRefs(dvMainStore)

// 本地状态
const canvasCacheOutRef = ref(null)
const deCanvasRef = ref(null)
const snapshotTimer = ref<any>(null)
const dataInitState = ref(false)
const mobileConfig = ref(false)
const loadFinish = ref(false)
const newWindowFromDiv = ref(false)
const showAreaRef = ref(null)
let p = null

// 共享状态
const state = reactive({
  datasetTree: [],
  dimensionData: [],
  quotaData: [],
  sourcePid: null,
  canvasId: 'canvas-main',
  opt: null,
  resourceId: null
})

const commonFilterAttrs = ['width', 'height', 'top', 'left', 'rotate']
const commonFilterAttrsFilterBorder = [
  'width',
  'height',
  'top',
  'left',
  'rotate',
  'borderActive',
  'borderWidth',
  'borderRadius',
  'borderStyle',
  'borderColor'
]

// 计算属性
const isDataEaseBi = computed(() => appStore.getIsDataEaseBi)

// 方法
const initDataset = () => {
  getDatasetTree({}).then(res => {
    state.datasetTree = (res as unknown as Tree[]) || []
  })
}
const eventCheck = e => {
  if (e.key === 'panel-weight' && !compareStorage(e.oldValue, e.newValue)) {
    const resourceId = embeddedStore.resourceId || router.currentRoute.value.query.resourceId
    const opt = embeddedStore.opt || router.currentRoute.value.query.opt
    if (!(opt && opt === 'create')) {
      check(wsCache.get('panel-weight'), resourceId as string, 4)
    }
  }
}

const otherEditorShow = computed(() => {
  return Boolean(
    curComponent.value &&
      (!['UserView', 'VQuery'].includes(curComponent.value?.component) ||
        (curComponent.value?.component === 'UserView' &&
          curComponent.value?.innerType === 'picture-group')) &&
      !batchOptStatus.value &&
      !hiddenListStatus.value
  )
})

const otherEditorTitle = computed(() => {
  return curComponent.value?.component === 'UserView'
    ? t('visualization.attribute')
    : curComponent.value?.label || t('visualization.attribute')
})

const viewEditorShow = computed(() => {
  const rid = embeddedStore.resourceId || router.currentRoute.value.query.resourceId
  if (rid) {
    // 如果 URL 携带 resourceId，编辑区域应显示
    return true
  }
  return Boolean(
    curComponent.value &&
      ['UserView', 'VQuery'].includes(curComponent.value.component) &&
      curComponent.value.innerType !== 'picture-group' &&
      !batchOptStatus.value &&
      !hiddenListStatus.value
  )
})
const checkPer = async resourceId => {
  if (!window.DataEaseBi || !resourceId) {
    return true
  }
  const request = { busiFlag: 'chart', resourceTable: 'core' }
  await interactiveStore.setInteractive(request)
  return check(wsCache.get('panel-weight'), resourceId, 4)
}


const onMobileConfig = () => {
  const canvasStyleDataCopy = cloneDeep(canvasStyleData.value)
  if (!canvasStyleDataCopy.mobileSetting) {
    canvasStyleDataCopy.mobileSetting = {
      backgroundColorSelect: false,
      background: '',
      color: '#ffffff',
      backgroundImageEnable: false,
      customSetting: false
    }
  }
  dvMainStore.setCanvasStyle(canvasStyleDataCopy)
  nextTick(() => {
    mobileConfig.value = true
    dvMainStore.setCurComponent({ component: null, index: null })
  })
}

const XpackLoaded = () => p(true)

const doUseCache = flag => {
  const canvasCache = state.resourceId ? wsCache.get('DE-DV-CATCH-' + state.resourceId) : undefined
  if (flag && canvasCache) {
    const canvasCacheSeries = deepCopy(canvasCache)
    snapshotStore.snapshotPublish(canvasCacheSeries)
    // 数据准备完成，允许计入镜像
    dvMainStore.setDataPrepareState(true)
    dvMainStore.setEditMode('edit')
    dataInitState.value = true
    setTimeout(() => {
      snapshotStore.recordSnapshotCache('doUseCache')
      // 使用缓存时，初始化的保存按钮为激活状态
      snapshotStore.recordSnapshotCache('renderChart')
    }, 1500)
  } else {
    // 新建模式下不使用缓存，走新建设计初始化；否则走常规初始化
    if (!state.resourceId && state.opt === 'create') {
      initDashboardCreateMode(state.sourcePid, router.currentRoute.value.query.createType, router.currentRoute.value.query.templateParams)
    } else {
      initLocalCanvasData(()=>{})
    }
    // 不使用缓存时也保留本地存储，避免刷新导致缓存被清空
    // wsCache.delete('DE-DV-CATCH-' + state.resourceId)
  }
}

// 新建设计页初始化（含模板）
const initDashboardCreateMode = async (pid, createType, templateParams) => {
  dataInitState.value = false
  let watermarkBaseInfo
  try {
    await watermarkFind().then(rsp => {
      watermarkBaseInfo = rsp.data
      watermarkBaseInfo.settingContent = JSON.parse(watermarkBaseInfo.settingContent)
    })
  } catch (e) {
    console.error('can not find watermark info')
  }
  let deTemplateData
  let preName
  if (createType === 'template' && templateParams) {
    const templateParamsApply = JSON.parse(Base64.decode(decodeURIComponent(templateParams + '')))
    await decompressionPre(templateParamsApply, result => {
      deTemplateData = result
      preName = deTemplateData.baseInfo?.preName
    })
  }
  nextTick(() => {
    dvMainStore.createInit('dashboard', null, pid, watermarkBaseInfo, preName)
    // 从模板新建
    if (createType === 'template' && deTemplateData) {
      wsCache.delete('de-template-data')
      dvMainStore.setComponentData(deTemplateData['componentData'])
      dvMainStore.setCanvasStyle(deTemplateData['canvasStyleData'])
      dvMainStore.setCanvasViewInfo(deTemplateData['canvasViewInfo'])
      dvMainStore.setAppDataInfo(deTemplateData['appData'])
      setTimeout(() => {
        snapshotStore.recordSnapshotCache('template')
      }, 1500)
      if (dvMainStore.getAppDataInfo()) {
        eventBus.emit('save')
      }
    } else {
      // 新建组件
      // 同时默认添加查询组件与明细表
      handleNewFromCanvasMain({ componentName: 'VQuery', innerType: 'VQuery' })
      handleNewFromCanvasMain({ componentName: 'UserView', innerType: 'table-info' })
    }
    dataInitState.value = true
    dvMainStore.setEditMode('edit')
    // 数据准备完成，允许计入镜像
    dvMainStore.setDataPrepareState(true)
    // preOpt
    canvasStyleData.value.component.chartTitle.color = '#000000'
  })
}

const initLocalCanvasData = callBack => {
  const { resourceId, opt, sourcePid } = state
  const busiFlag = opt === 'copy' ? 'dashboard-copy' : 'chart'
  initCanvasData(
    resourceId,
    { busiFlag, resourceTable: 'snapshot', source: 'main-edit' },
    function () {
      dataInitState.value = true
      // 数据准备完成，允许计入镜像
      dvMainStore.setDataPrepareState(true)
      if (dvInfo.value && opt === 'copy') {
        dvInfo.value.dataState = 'prepare'
        dvInfo.value.optType = 'copy'
        dvInfo.value.pid = sourcePid
        setTimeout(() => {
          snapshotStore.recordSnapshotCache('initLocalCanvasData')
        }, 1500)
      }
      onInitReady({ resourceId: resourceId })
      callBack && callBack()
    }
  )
}

const allFields = computed(() => {
  return concat(state.quotaData, state.dimensionData)
})
const getComponentStyle = style => {
  return getStyle(style, style.borderActive ? commonFilterAttrs : commonFilterAttrsFilterBorder)
}
const calcData = (view, resetDrill = false, updateQuery = '') => {
  if (
    view.refreshTime === '' ||
    parseFloat(view.refreshTime).toString() === 'NaN' ||
    parseFloat(view.refreshTime) < 1
  ) {
    ElMessage.error(t('chart.only_input_number'))
    return
  }
  if (resetDrill) {
    useEmitt().emitter.emit('resetDrill-' + view.id, 0)
  } else {
    if (mobileInPc.value) {
      //移动端设计
      useEmitt().emitter.emit('onMobileStatusChange', {
        type: 'componentStyleChange',
        value: { type: 'calcData', component: JSON.parse(JSON.stringify(view)) }
      })
    } else {
      useEmitt().emitter.emit('calcData-' + view.id, view)
      snapshotStore.recordSnapshotCache('renderChart', view.id)
    }
  }
  snapshotStore.recordSnapshotCache('calcData', view.id)
  // if (updateQuery === 'updateQuery') {
  //   queryList.value.forEach(ele => {
  //     useEmitt().emitter.emit(`updateQueryCriteria${ele.id}`)
  //   })
  // }
}
const updateChartData = view => {
  curComponent.value['state'] = 'ready'
  useEmitt().emitter.emit('checkShowEmpty', { allFields: allFields.value, view: view })
  calcData(view, true, 'updateQuery')
}
// 通过实时监听的方式直接添加组件
const handleNewFromCanvasMain = newComponentInfo => {
  const { componentName, innerType, staticMap } = newComponentInfo
  if (componentName) {
    const component = findNewComponentFromList(componentName, innerType, curOriginThemes, staticMap)
    syncShapeItemStyle(component, 300, 300)
    component.id = guid()
    dvMainStore.addComponent({
      component: component,
      index: undefined
    })
    adaptCurThemeCommonStyle(component)
    snapshotStore.recordSnapshotCacheWithPositionChange('renderChart', component.id)
  }
}
onMounted(async () => {
  document.body.style.overflow = 'hidden'
  dvMainStore.setCurComponent({ component: null, index: null })
  dvMainStore.setHiddenListStatus(false)
  snapshotStore.initSnapShot()
  // 启动快照定时器，将缓存计数定期落入镜像
  snapshotTimer.value = setInterval(() => {
    snapshotStore.snapshotCatchToStore()
  }, 1000)
  if (window.location.hash.includes('#/dashboard')) {
    newWindowFromDiv.value = true
  }
  await new Promise(r => (p = r))
  loadFinish.value = true
  useEmitt({
    name: 'mobileConfig',
    callback: () => {
      onMobileConfig()
    }
  })
  window.addEventListener('storage', eventCheck)
  window.addEventListener('message', winMsgHandle)
  const resourceId = embeddedStore.resourceId || router.currentRoute.value.query.resourceId
  const pid = embeddedStore.pid || router.currentRoute.value.query.pid
  const opt = embeddedStore.opt || router.currentRoute.value.query.opt
  const createType = embeddedStore.createType || router.currentRoute.value.query.createType
  const templateParams =
    embeddedStore.templateParams || router.currentRoute.value.query.templateParams
  const checkResult = await checkPer(resourceId)
  if (!checkResult) {
    return
  }
  initDataset()

  state.sourcePid = pid
  state.opt = opt
  state.resourceId = resourceId
  // 刷新后清空历史，重新开始记录
  if (resourceId) {
    snapshotStore.clearPersistHistory(resourceId)
  }
  snapshotStore.initSnapShot()
  if (resourceId) {
    dataInitState.value = false
    initLocalCanvasData(() => {
      // do init
      dvMainStore.setCurComponent({ component: componentData.value[1], index: 1 })
      // 编辑页加载完成后执行一次更新数据
      nextTick(() => {
        updateChartData(canvasViewInfo.value[curComponent.value ? curComponent.value?.id : 'default'])
      })
    })
    // const canvasCache = wsCache.get('DE-DV-CATCH-' + resourceId)
    // if (canvasCache) {
    //   // canvasCacheOutRef.value?.dialogInit({ canvasType: 'dashboard', resourceId: resourceId })
    //   doUseCache(true)
    // } else {
    //   initLocalCanvasData(() => {
    //     // do init
    //     dvMainStore.setCurComponent({ component: componentData.value[1], index: 1 })
    //   })
    // }
  } else {
  // } else if (opt && opt === 'create') {
    dataInitState.value = false
    let watermarkBaseInfo
    try {
      await watermarkFind().then(rsp => {
        watermarkBaseInfo = rsp.data
        watermarkBaseInfo.settingContent = JSON.parse(watermarkBaseInfo.settingContent)
      })
    } catch (e) {
      console.error('can not find watermark info')
    }
    let deTemplateData
    let preName
    if (createType === 'template') {
      const templateParamsApply = JSON.parse(Base64.decode(decodeURIComponent(templateParams + '')))
      await decompressionPre(templateParamsApply, result => {
        deTemplateData = result
        preName = deTemplateData.baseInfo?.preName
      })
    }
    nextTick(() => {
      dvMainStore.createInit('dashboard', null, pid, watermarkBaseInfo, preName)
      // 从模板新建
      if (createType === 'template') {
        wsCache.delete('de-template-data')
        dvMainStore.setComponentData(deTemplateData['componentData'])
        dvMainStore.setCanvasStyle(deTemplateData['canvasStyleData'])
        dvMainStore.setCanvasViewInfo(deTemplateData['canvasViewInfo'])
        dvMainStore.setAppDataInfo(deTemplateData['appData'])
        setTimeout(() => {
          snapshotStore.recordSnapshotCache('template')
        }, 1500)
        if (dvMainStore.getAppDataInfo()) {
          eventBus.emit('save')
        }
      } else {
        // 新建组件
        handleNewFromCanvasMain({ componentName: 'VQuery', innerType: 'VQuery' })
        handleNewFromCanvasMain({ componentName: 'UserView', innerType: 'table-info' })
      }
      dataInitState.value = true
      dvMainStore.setEditMode('edit')
      // 数据准备完成，允许计入镜像
      dvMainStore.setDataPrepareState(true)
      // preOpt
      canvasStyleData.value.component.chartTitle.color = '#000000'
    })
  }
  //  else {
  //   let url = '#/panel/index'
  //   window.open(url, '_self')
  // }
  // 监听展示区域尺寸变化：当从隐藏（高度≈0）变为可见时，触发一次全量重绘
  nextTick(() => {
    const el = showAreaRef.value as unknown as HTMLElement
    if (!el) return
    let hasRedrawnAfterShow = false
    const observer = new ResizeObserver(([entry] = []) => {
      const height = (entry as any)?.contentRect?.height ?? el.offsetHeight
      if (height > 1 && !hasRedrawnAfterShow) {
        useEmitt().emitter.emit('calcData-all')
        hasRedrawnAfterShow = true
      } else if (height <= 1) {
        hasRedrawnAfterShow = false
      }
    })
    observer.observe(el)
    // 在组件卸载时清理
    onUnmounted(() => observer.disconnect())
  })
})

// 目标校验： 需要校验targetSourceId 是否是当前可视化资源ID
const winMsgHandle = event => {
  const msgInfo = event.data
  if (msgInfo?.targetSourceId === dvInfo.value.id + '')
    if (msgInfo.type === 'webParams') {
      // 网络消息处理
      winMsgWebParamsHandle(msgInfo)
    }
}

const winMsgWebParamsHandle = msgInfo => {
  const params = msgInfo.params
  dvMainStore.addWebParamsFilter(params)
}

const dashboardComponentData = computed(() =>
  componentData.value.filter(item => !item.dashboardHidden)
)

const cancelHidden = item => {
  if (deCanvasRef.value) {
    if (!(lastHiddenComponent.value?.length && lastHiddenComponent.value.includes(item.id))) {
      item.y = undefined
    }
    deCanvasRef.value.addItemBox(item)
    nextTick(() => {
      deCanvasRef.value.canvasInit(false)
    })
    snapshotStore.recordSnapshotCache('cancelHidden')
  }
}

const doRecoverToPublished = () => {
  recoverToPublished({ id: dvInfo.value.id, type: 'chart', name: dvInfo.value.name }).then(
    () => {
      state.resourceId = dvInfo.value.id
      state.sourcePid = dvInfo.value.pid
      state.opt = null
      initLocalCanvasData(() => {
        nextTick(() => {
          deCanvasRef.value.canvasInit(false)
          dvMainStore.updateDvInfoCall(1)
          useEmitt().emitter.emit('calcData-all')
        })
      })
    }
  )
}

// 计算ComponentData中的style
const calcComponentItemStyle = (item) => {
  const styleObj = {
    VQuery: { height: '100px', width: '100%', overflowY: 'auto' },
    UserView: { flex: 1, minHeight: 0, width: '100%' }
  }
  return styleObj[item.component] || {}
}

const calcWrapperStyle = item => {
  return {
    ...calcComponentItemStyle(item),
    position: 'relative'
  }
}

const wrapperScale = computed(() => {
  const currentScale = Number(canvasStyleData.value?.scale)
  if (!Number.isFinite(currentScale) || currentScale <= 0) {
    return 100
  }
  return Math.max(currentScale, 100)
})

onUnmounted(() => {
  document.body.style.overflow = ''
  window.removeEventListener('storage', eventCheck)
  window.removeEventListener('message', winMsgHandle)
  if (snapshotTimer.value) {
    clearInterval(snapshotTimer.value)
    snapshotTimer.value = null
  }
})

window.addEventListener('message', (event: MessageEvent<any>) => {
  const data = event?.data
  if (data?.type === 'dashboardClose') {
    // 清空localstorage里的DashboardCache
    wsCache.delete('DE-DV-CATCH-' + (dvInfo.value.id ?? 'null'))
    wsCache.delete('DE-DV-HISTORY-' + (dvInfo.value.pid ?? 'null'))
  }
})
</script>

<template>
  <!-- 初始加载居中 Loading 覆盖层：在页面未完成初始化时显示 -->
  <div v-if="!loadFinish" class="initial-loading-overlay">
    <div class="loader"></div>
    <div class="loading-text">加载中...</div>
  </div>
  <div
    class="dv-common-layout dv-teleport-query"
    :class="isDataEaseBi && !newWindowFromDiv && 'dataease-w-h'"
    v-loading="requestStore.loadingMap[permissionStore.currentPath]"
    v-if="loadFinish && !mobileConfig"
  >
    <DbToolbar @recoverToPublished="doRecoverToPublished" />
    <div style="position: relative; height: 0;">
      <div class="button-area">
        <!-- <el-button size="small" class="arco-btn fullscreen-btn">全屏</el-button> -->
        <el-button ref="buttonAreaRef" class="arco-btn data-view-btn" @click="updateChartData(canvasViewInfo[curComponent ? curComponent.id : 'default'])">更新图表数据</el-button>
      </div>
    </div>
    <el-container
      class="dv-layout-container"
      :class="{ 'preview-content': editMode === 'preview' }"
      element-loading-background="rgba(0, 0, 0, 0)"
    >
      <!--      <SqlAssistant></SqlAssistant>-->
      <!-- 右侧侧组件列表 -->
      <dv-sidebar
        v-if="otherEditorShow"
        :theme-info="'light'"
        :title="otherEditorTitle"
        :width="420"
        :side-name="'componentProp'"
        :aside-position="'right'"
        :view="canvasViewInfo[curComponent.id]"
        :element="curComponent"
        class="left-sidebar"
      >
        <component :is="findComponentAttr(curComponent)" :themes="'light'" />
      </dv-sidebar>
      <!-- 隐藏仪表板配置 -->
      <dv-sidebar
        v-show="false && !curComponent && !batchOptStatus && !hiddenListStatus"
        :theme-info="'light'"
        :title="t('visualization.dashboard_configuration')"
        :width="420"
        aside-position="right"
        side-name="canvas"
        class="left-sidebar"
      >
        <DbCanvasAttr></DbCanvasAttr>
      </dv-sidebar>
      <div v-show="viewEditorShow" style="height: 100%">
        <view-editor
          :themes="'light'"
          :view="canvasViewInfo[curComponent ? curComponent.id : 'default']"
          :dataset-tree="state.datasetTree"
        ></view-editor>
      </div>
      <dv-sidebar
        v-if="batchOptStatus"
        :theme-info="'light'"
        :title="t('visualization.batch_style_set')"
        :width="280"
        aside-position="right"
        class="left-sidebar"
        :side-name="'batchOpt'"
      >
        <chart-style-batch-set></chart-style-batch-set>
      </dv-sidebar>
      <dv-sidebar
        v-if="hiddenListStatus"
        :theme-info="'light'"
        :title="t('visualization.hidden_components')"
        :width="280"
        aside-position="right"
        class="left-sidebar"
      >
        <DashboardHiddenComponent @cancel-hidden="cancelHidden"></DashboardHiddenComponent>
      </dv-sidebar>
      <!-- 中间画布 -->
      <main v-show="viewEditorShow" class="center" :class="{ 'de-screen-full': fullscreenFlag }" style="padding-top: 135px; overflow: hidden;">
        <!-- <de-canvas
          style="display: none;"
          v-if="dataInitState"
          ref="deCanvasRef"
          :canvas-id="state.canvasId"
          :component-data="dashboardComponentData"
          :canvas-style-data="canvasStyleData"
          :canvas-view-info="canvasViewInfo"
          :font-family="canvasStyleData.fontFamily"
        ></de-canvas> -->


          <div class="show-area" ref="showAreaRef">
            <div
              v-for="(item, index) in componentData"
              :key="item.id"
              class="show-item"
              :style="calcWrapperStyle(item)"
            >
              <component-wrapper
                class="show-item-wrapper"
                canvas-id="canvas-main"
                :canvas-style-data="canvasStyleData"
                :dv-info="dvInfo"
                :canvas-view-info="canvasViewInfo"
                :view-info="canvasViewInfo[item.id]"
                :config="item"
                :index="index"
                show-position="canvas"
                :search-count="0"
                :scale="wrapperScale"
              />
            </div>
          </div>
      </main>
    </el-container>
  </div>
  <MobileConfigPanel
    @pcMode="mobileConfig = false"
    v-else-if="loadFinish && mobileConfig"
  ></MobileConfigPanel>
  <XpackComponent
    jsname="L2NvbXBvbmVudC9lbWJlZGRlZC1pZnJhbWUvTmV3V2luZG93SGFuZGxlcg=="
    @loaded="XpackLoaded"
    @load-fail="XpackLoaded"
  />
  <xpack-component jsname="L2NvbXBvbmVudC90aHJlc2hvbGQtd2FybmluZy9UaHJlc2hvbGREaWFsb2c=" />
  <canvas-cache-dialog ref="canvasCacheOutRef" @doUseCache="doUseCache"></canvas-cache-dialog>
</template>

<style lang="less">
.initial-loading-overlay {
  position: fixed;
  inset: 0;
  z-index: 999;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  background: rgba(255, 255, 255, 0.92);
  .loader {
    width: 48px;
    height: 48px;
    border: 4px solid #e5e5e5;
    border-top-color: #409eff;
    border-radius: 50%;
    animation: de-spin 0.8s linear infinite;
    margin-bottom: 10px;
  }
  .loading-text {
    color: #666;
    font-size: 14px;
  }
}

@keyframes de-spin {
  to {
    transform: rotate(360deg);
  }
}
.button-area {
  position: absolute;
  top: -40px;
  right: 100px;
}
.dv-common-layout {
  height: 100vh;
  width: 100vw;

  .dv-layout-container {
    height: calc(100vh - 48px)!important;
    .left-sidebar {
      height: 100%;
    }
    .center {
      display: flex;
      flex-direction: column;
      height: 100%;
      flex: 1;
      position: relative;
      overflow: auto;
      background: #fff;
      .show-area {
        display: flex;
        flex-direction: column;
        flex: 1;
        min-height: 0;
        .show-item {
          position: relative;
          width: 100%;
          .show-item-wrapper {
            width: 100%;
            height: 100%;
            display: block;
          }
          .wrapper-outer {
            position: absolute;
            inset: 0;
            width: 100%;
            height: 100%;
          }
        }
      }
      .content {
        flex: 1;
        width: 100%;
        // margin-top: 250px;
        .db-canvas {
          padding: 2px;
          background-size: 100% 100% !important;
          overflow-y: auto;
          width: 100%;
          height: 100%;
        }
      }
    }
    .right-sidebar {
      height: 100%;
    }
  }

  &.dataease-w-h {
    height: 100%;
    width: 100%;
    .dv-layout-container {
      height: calc(100% - 48px);
    }
  }
}

.preview-aside {
  border: 0px !important;
  width: 0px !important;
  overflow: hidden;
  padding: 0px;
}

.preview-content {
  :deep(.editor-light) {
    border: 0 !important;
  }
}
</style>
