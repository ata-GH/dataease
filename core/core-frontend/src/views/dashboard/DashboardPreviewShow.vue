<script setup lang="ts">
import icon_add_outlined from '@/assets/svg/icon_add_outlined.svg'
import DeResourceTree from '@/views/common/DeResourceTree.vue'
import { dvMainStoreWithOut } from '@/store/modules/data-visualization/dvMain'
import { reactive, nextTick, ref, toRefs, onBeforeMount, computed, onMounted, watch } from 'vue'
import DePreview from '@/components/data-visualization/canvas/DePreview.vue'
import PreviewHead from '@/views/data-visualization/PreviewHead.vue'
import EmptyBackground from '@/components/empty-background/src/EmptyBackground.vue'
import ArrowSide from '@/views/common/DeResourceArrow.vue'
import { initCanvasData, initCanvasDataPrepare, onInitReady } from '@/utils/canvasUtils'
import { useAppStoreWithOut } from '@/store/modules/app'
import { useMoveLine } from '@/hooks/web/useMoveLine'
import { Icon } from '@/components/icon-custom'
import { download2AppTemplate, generateCanvasFile } from '@/utils/imgUtils'
import { storeToRefs } from 'pinia'
import { ElMessage } from 'element-plus-secondary'
import AppExportForm from '@/components/de-app/AppExportForm.vue'
import ExportApplicationDialog from '@/components/common/ExportApplicationDialog.vue'
import { useEmitt } from '@/hooks/web/useEmitt'
import { useUserStoreWithOut } from '@/store/modules/user'
import { useI18n } from '@/hooks/web/useI18n'
import { useRoute } from 'vue-router_2'
import CanvasOptBar from '@/components/visualization/CanvasOptBar.vue'
import {
  exportLogApp,
  exportLogImg,
  exportLogPDF,
  exportLogTemplate
} from '@/api/visualization/dataVisualization'
import { submitExportFiles } from '@/api/chart'
import { InfoFilled } from '@element-plus/icons-vue'
const userStore = useUserStoreWithOut()

const userName = computed(() => userStore.getName)
const appExportFormRef = ref(null)

const dvMainStore = dvMainStoreWithOut()
const previewCanvasContainer = ref(null)
const dashboardPreview = ref(null)
const slideShow = ref(true)
const appStore = useAppStoreWithOut()
const dataInitState = ref(true)
const downloadStatus = ref(false)
const exportApplicationDialogRef = ref(null)
const downloadTypeTemp = ref('')

const state = reactive({
  canvasDataPreview: null,
  canvasStylePreview: null,
  canvasViewInfoPreview: null,
  dvInfo: null,
  curPreviewGap: 0,
  showOffset: {
    top: 110,
    left: 280
  }
})

const { fullscreenFlag, canvasViewDataInfo } = storeToRefs(dvMainStore)

const { width, node } = useMoveLine('DASHBOARD')
const { t } = useI18n()
const route = useRoute()
const isPanel = computed(() => !!route.path && route.path.includes('panel'))

const props = defineProps({
  showPosition: {
    required: false,
    type: String,
    default: 'preview'
  },
  noClose: {
    required: false,
    type: Boolean,
    default: false
  },
  resourceTable: {
    required: false,
    type: String,
    default: 'core'
  }
})

const { showPosition, resourceTable } = toRefs(props)

const curCanvasType = ref('dashboard')
const tabList = [
  { label: '仪表盘', value: 'dashboard' },
  { label: '单图表', value: 'chart' }
]

watch(curCanvasType, () => {
  state.canvasDataPreview = null
  state.canvasStylePreview = null
  state.canvasViewInfoPreview = null
  state.dvInfo = null
})



const resourceTreeRef = ref()

const hasTreeData = computed(() => {
  return resourceTreeRef.value?.hasData
})
const isDataEaseBi = computed(() => appStore.getIsDataEaseBi)

const rootManage = computed(() => {
  return resourceTreeRef.value?.rootManage
})
const mounted = computed(() => {
  return resourceTreeRef.value?.mounted
})

onMounted(() => {
  useEmitt({
    name: 'canvasDownload',
    callback: function () {
      downloadH2('img')
    }
  })
})

function createNew() {
  resourceTreeRef.value?.createNewObject()
}

const loadCanvasData = (dvId, weight?) => {
  // 复用不设置 dvMain 中的componentData 等画布信息
  const initMethod = showPosition.value === 'multiplexing' ? initCanvasDataPrepare : initCanvasData
  dataInitState.value = false
  initMethod(
    dvId,
    { busiFlag: 'dashboard', resourceTable: 'core' },
    function ({
      canvasDataResult,
      canvasStyleResult,
      dvInfo,
      canvasViewInfoPreview,
      curPreviewGap
    }) {
      if (typeof weight !== 'undefined') {
        dvInfo['weight'] = weight
      }
      state.canvasDataPreview = canvasDataResult
      state.canvasStylePreview = canvasStyleResult
      state.canvasViewInfoPreview = canvasViewInfoPreview
      state.dvInfo = dvInfo
      state.curPreviewGap = curPreviewGap
      dataInitState.value = true
      nextTick(() => {
        dashboardPreview.value.restore()
        onInitReady({ resourceId: dvId })
      })
    }
  )
}

watch(
  () => route.query.dvId,
  (val: any) => {
    if (val && (showPosition.value === 'preview' || isPanel.value) && state.dvInfo?.id !== val) {
      loadCanvasData(val)
    }
  },
  { immediate: true }
)

// 地图类图表，需要预先准备图片
const mapChartTypes = ['bubble-map', 'flow-map', 'heat-map', 'map', 'symbolic-map']
const downloadH2 = type => {
  downloadTypeTemp.value = type
  exportApplicationDialogRef.value.open()
}

const downloadDirect = type => {
  executeDirectDownload(type)
}

const handleExportConfirm = formData => {
  executeDownload(downloadTypeTemp.value, formData)
}

const executeDirectDownload = (type) => {
  downloadStatus.value = true
  const mapElementIds =
    state.canvasDataPreview
      ?.filter(ele => mapChartTypes.includes(ele.innerType))
      .map(ele => ele.id) || []
  mapElementIds.forEach(id => useEmitt().emitter.emit('l7-prepare-picture', id))
  nextTick(() => {
    const vueDom = previewCanvasContainer.value.querySelector('.canvas-container')
    generateCanvasFile(type, vueDom, state.dvInfo.name, (file) => {
      downloadStatus.value = false
      const blobUrl = window.URL.createObjectURL(file)
      const a = document.createElement('a')
      a.style.display = 'none'
      a.href = blobUrl
      a.download = file.name || (state.dvInfo.name + (type === 'img' ? '.png' : '.pdf'))
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(blobUrl)
      mapElementIds.forEach(id => useEmitt().emitter.emit('l7-unprepare-picture', id))
    })
  })
}

const executeDownload = (type, formData) => {
  downloadStatus.value = true
  const mapElementIds =
    state.canvasDataPreview
      ?.filter(ele => mapChartTypes.includes(ele.innerType))
      .map(ele => ele.id) || []
  mapElementIds.forEach(id => useEmitt().emitter.emit('l7-prepare-picture', id))
  nextTick(() => {
    const vueDom = previewCanvasContainer.value.querySelector('.canvas-container')
    generateCanvasFile(type, vueDom, state.dvInfo.name, (file) => {
      downloadStatus.value = false
      const param = {
        id: state.dvInfo.id,
        type: state.dvInfo.type === 'dashboard' ? 'panel' : 'screen'
      }
      type === 'img' ? exportLogImg(param) : exportLogPDF(param)
      const form = new FormData()
      const jsonBlob = new Blob([JSON.stringify({
        'dvId': state.dvInfo.id,
        'busiFlag': 'dashboard',
        'fileType': type === 'img' ? 'png' : 'pdf',
        'viewName': state.dvInfo.name,
        'reason': formData.reason,
        'desc': formData.desc
      })], { type: 'application/json' })
      form.append('request', jsonBlob)
      form.append('file', file)
      submitExportFiles(form).then(() => {
        ElMessage.success('申请发送成功')
        formData.callback && formData.callback()
      }).catch(() => {
        formData.callback && formData.callback()
      })
      mapElementIds.forEach(id => useEmitt().emitter.emit('l7-unprepare-picture', id))
    })
  })
}

const downloadAsAppTemplate = downloadType => {
  if (downloadType === 'template') {
    fileDownload(downloadType, null)
  } else if (downloadType === 'app') {
    downLoadToAppPre()
  }
}

const downLoadToAppPre = () => {
  const result = checkTemplate()
  if (result && result.length > 0) {
    ElMessage.warning(t('visualization.export_tips', [result]))
  } else {
    appExportFormRef.value.init({
      appName: state.dvInfo.name,
      icon: null,
      version: '2.0',
      creator: userName.value,
      required: '2.9.0',
      description: null
    })
  }
}

const checkTemplate = () => {
  let templateViewNames = ','
  Object.keys(canvasViewDataInfo.value).forEach(key => {
    const viewInfo = canvasViewDataInfo.value[key]
    if (viewInfo && viewInfo?.dataFrom === 'template') {
      templateViewNames = templateViewNames + viewInfo.title + ','
    }
  })
  return templateViewNames.slice(1)
}

const fileDownload = (downloadType, attachParams) => {
  downloadStatus.value = true
  nextTick(() => {
    const vueDom = previewCanvasContainer.value.querySelector('.canvas-container')
    download2AppTemplate(downloadType, vueDom, state.dvInfo.name, attachParams, () => {
      downloadStatus.value = false
      const param = {
        id: state.dvInfo.id,
        type: state.dvInfo.type === 'dashboard' ? 'panel' : 'screen'
      }
      downloadType === 'app' ? exportLogApp(param) : exportLogTemplate(param)
    })
  })
}

const slideOpenChange = () => {
  slideShow.value = !slideShow.value
}

const getPreviewStateInfo = () => {
  return state
}

const reload = id => {
  loadCanvasData(id, state.dvInfo.weight)
}

const resourceNodeClick = data => {
  loadCanvasData(data.id, data.weight)
  if (showPosition.value === 'multiplexing') {
    dvMainStore.initCurMultiplexingComponents()
  }
}

const previewShowFlag = computed(() => !!dvMainStore.dvInfo?.name)

onBeforeMount(() => {
  if (showPosition.value === 'preview') {
    dvMainStore.canvasDataInit()
  }
})
const sideTreeStatus = ref(true)
const changeSideTreeStatus = val => {
  sideTreeStatus.value = val
}

const mouseenter = () => {
  appStore.setArrowSide(true)
}

const mouseleave = () => {
  appStore.setArrowSide(false)
}

const downLoadApp = appAttachInfo => {
  fileDownload('app', appAttachInfo)
}

const freezeStyle = computed(() => [
  { '--top-show-offset': state.showOffset.top },
  { '--left-show-offset': state.showOffset.left }
])

const closePage = () => {
  try {
    parent.window.postMessage({ type: 'closeBoard', data: {} }, '*')
  } catch (e) {
    window.parent?.postMessage({ type: 'closeBoard', data: {} }, '*')
  }
}

defineExpose({
  getPreviewStateInfo
})
</script>

<template>
  <div class="dv-preview dv-teleport-query" :style="freezeStyle">
    <ArrowSide
      v-if="!noClose"
      :style="{ left: (sideTreeStatus ? width - 12 : 0) + 'px' }"
      @change-side-tree-status="changeSideTreeStatus"
      :isInside="!sideTreeStatus"
    ></ArrowSide>
    <el-aside
      @mouseenter="mouseenter"
      @mouseleave="mouseleave"
      class="resource-area"
      :class="{ 'close-side': !slideShow, retract: !sideTreeStatus }"
      ref="node"
      :style="{ width: width + 'px', display: isPanel ? 'none' : 'block' }"
    >
      <ArrowSide
        v-if="!noClose"
        :isInside="!sideTreeStatus"
        :style="{ left: (sideTreeStatus ? width - 12 : 0) + 'px' }"
        @change-side-tree-status="changeSideTreeStatus"
      ></ArrowSide>
      <div class="canvas-type-tab" v-if="slideShow">
        <div
          v-for="tab in tabList"
          :key="tab.value"
          class="tab-item"
          :class="{ active: curCanvasType === tab.value }"
          @click="curCanvasType = tab.value"
        >
          {{ tab.label }}
          <el-tooltip
            v-if="tab.value === 'dashboard'"
            content="仅支持选择拥有查看权限、管理权限的图表仪表盘"
            placement="right"
          >
            <el-icon class="info-icon"><InfoFilled /></el-icon>
          </el-tooltip>
        </div>
      </div>
      <de-resource-tree
        ref="resourceTreeRef"
        v-show="slideShow"
        v-if="!isPanel"
        :cur-canvas-type="curCanvasType"
        :show-position="showPosition"
        :resource-table="resourceTable"
        @node-click="resourceNodeClick"
      />
    </el-aside>
    <el-container
      class="preview-area"
      :class="{ 'no-data': !state.dvInfo?.id }"
      v-loading="!dataInitState"
    >
      <div
        @click="slideOpenChange"
        v-if="showPosition === 'preview' && false"
        class="flexible-button-area"
      >
        <el-icon v-if="slideShow"><ArrowLeft /></el-icon>
        <el-icon v-else><ArrowRight /></el-icon>
      </div>
      <!--从store中判断当前是否有点击仪表板 复用时也符合-->
      <template v-if="previewShowFlag">
        <preview-head
          v-if="showPosition === 'preview'"
          @reload="reload"
          @download="downloadH2"
          @downloadDirect="downloadDirect"
          @downloadAsAppTemplate="downloadAsAppTemplate"
        />
        <div
          ref="previewCanvasContainer"
          class="content"
          id="de-preview-content"
          :class="{ 'de-screen-full': fullscreenFlag }"
        >
          <canvas-opt-bar
            canvas-id="canvas-main"
            :canvas-style-data="state.canvasStylePreview || {}"
            :component-data="state.canvasDataPreview || []"
          ></canvas-opt-bar>
          <de-preview
            ref="dashboardPreview"
            v-if="state.canvasStylePreview && dataInitState"
            :dv-info="state.dvInfo"
            :cur-gap="state.curPreviewGap"
            :component-data="state.canvasDataPreview"
            :canvas-style-data="state.canvasStylePreview"
            :canvas-view-info="state.canvasViewInfoPreview"
            :show-position="showPosition"
            :download-status="downloadStatus"
            :show-linkage-button="false"
            :cur-canvas-type="curCanvasType"
          ></de-preview>
        </div>
      </template>
      <template v-else-if="hasTreeData && mounted">
        <empty-background description="找不到该仪表盘的数据，请关闭页面重新选择" img-type="select">
          <button class="close-btn" @click="closePage" aria-label="关闭">关闭</button>
        </empty-background>
      </template>
      <template v-else-if="mounted">
        <empty-background :description="t('visualization.have_none_resource')" img-type="none">
          <el-button v-if="rootManage && !isDataEaseBi" @click="createNew" type="primary">
            <template #icon>
              <Icon name="icon_add_outlined"><icon_add_outlined class="svg-icon" /></Icon>
            </template>
            {{ t('commons.create') }}{{ t('chart.dashboard') }}
          </el-button>
        </empty-background>
      </template>
    </el-container>
  </div>
  <app-export-form
    ref="appExportFormRef"
    :dv-info="state.dvInfo"
    :component-data="state.canvasDataPreview"
    :canvas-view-info="state.canvasViewInfoPreview"
    @downLoadApp="downLoadApp"
  ></app-export-form>
  <export-application-dialog
    ref="exportApplicationDialogRef"
    @confirm="handleExportConfirm"
  />
</template>

<style lang="less">
.dv-preview {
  width: 100%;
  height: 100%;
  overflow: hidden;
  display: flex;
  background: #ffffff;
  position: relative;
  .resource-area {
    position: relative;
    height: 100%;
    width: 279px;
    padding: 0;
    border-right: 1px solid #d7d7d7;
    overflow: visible;

    .canvas-type-tab {
      display: flex;
      width: 100%;
      height: 40px;
      border-bottom: 1px solid #dcdfe6;
      background: #fff;

      .tab-item {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
        color: #646a73;
        cursor: pointer;
        position: relative;

        .info-icon {
          margin-left: 4px;
          color: #646a73;
        }

        &.active {
          color: var(--ed-color-primary);
          font-weight: 500;

          .info-icon {
            color: var(--ed-color-primary);
          }

          &::after {
            content: '';
            position: absolute;
            bottom: -1px;
            left: 0;
            width: 100%;
            height: 2px;
            background-color: var(--ed-color-primary);
          }
        }

        &:hover:not(.active) {
          color: var(--ed-color-primary);
        }
      }
    }

    &.retract {
      display: none;
    }
  }
  .preview-area {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow-x: hidden;
    overflow-y: auto;
    position: relative;
    //transition: 0.5s;

    &.no-data {
      background-color: rgba(245, 246, 247, 1);
    }

    .content {
      position: relative;
      display: flex;
      width: 100%;
      height: 100%;
      overflow-x: hidden;
      overflow-y: auto;
      align-items: center;
    }
  }
}

.close-side {
  width: 0px !important;
  padding: 0px !important;
}

.close-btn {
  padding: 6px 12px;
  font-size: 14px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  background: #fff;
  color: #606266;
  cursor: pointer;
}

.flexible-button-area {
  position: absolute;
  height: 60px;
  width: 16px;
  left: 0;
  top: calc(50% - 30px);
  background-color: #ffffff;
  border-radius: 0 4px 4px 0;
  cursor: pointer;
  z-index: 10;
  display: flex;
  align-items: center;
  border-top: 1px solid #d7d7d7;
  border-right: 1px solid #d7d7d7;
  border-bottom: 1px solid #d7d7d7;
}
</style>
