<template>
  <form class="dialog-layout" @submit.prevent="onSubmit">
    <h4>{{ currentTitle }}</h4>
    <div class="name-layout">
      <span>名称：</span>
      <input type="text" v-model="currentTypeName" ref="nameInput">
    </div>
    <div class="label-layout">
      <div class="color-layout">
        <span>颜色：</span>
        <div class="color-grid">
          <div v-for="index in colorList.length" class="circle-color" :key="index" :style="`background-color: ${colorList[index - 1]}`" @click="onClickColorItem(index - 1)" >
            <div v-show="index - 1 === currentColorIndex" class="select-dot"></div>
          </div>
        </div>
      </div>
      <div class="divider" />
      <div class="icon-layout">
        <span>图标：</span>
        <el-popover placement="right" :width="274" trigger="click" :visible="showIconList">
          <template #reference>
            <!--    这里clickoutside逻辑有bug，暂时把outside设置为这个按钮        -->
            <div class="icon-selector" @click="showIconList = !showIconList" v-click-outside="onClickOutside" >
              <circle-icon  class="icon" :color="colorList[currentColorIndex]" :svg-name="`ic_type_white${currentIconIndex}`"/>
            </div>
          </template>
          <div class="type-grid">
            <div v-for="index in typeIconSize" :key="index" class="icon-wrapper" @click="onClickIconItem(index - 1)" :class="{'unselected': currentIconIndex !== index - 1}" >
              <circle-icon class="icon" color="#e6e6e6" :svg-name="`ic_type_black${index - 1}`"  />
            </div>
          </div>
        </el-popover>
      </div>
    </div>
    <!--    todo:智能列表功能暂时不做-->
    <div class="h-divider"></div>
    <div class="button-layout">
      <button class="button-yes" :class="{'able': currentTypeName.length > 0}" :type="currentTypeName.length > 0? 'submit' : 'button'" >
        新建
      </button>
      <button class="button-no" type="button" @click="onClickCancel">取消</button>
    </div>
  </form>
</template>

<script setup>
import {
  DEFAULT_COLOR_INDEX,
  DEFAULT_ICON_INDEX,
  DEFAULT_TITLE,
  TYPE_COLOR_LIST,
  TYPE_ICON_SIZE,
} from "@/components/menu/menuConstants";
import { ref } from "vue";
import CircleIcon from '@/components/common/CircleIcon.vue'
//  import ClickOutside from 'element-plus/src/utils/clickoutside'

const currentTitle = ref(DEFAULT_TITLE);
const typeIconSize = ref(TYPE_ICON_SIZE)
//图标颜色
const colorList = ref(TYPE_COLOR_LIST)
const currentColorIndex = ref(DEFAULT_COLOR_INDEX)
//console.log('ccc',colorList.value[currentColorIndex.value]);

const currentIconIndex = ref(DEFAULT_ICON_INDEX)
const currentTypeName = ref("")
const showIconList = ref(false)  //用于控制图标列表的显示隐藏
const emit = defineEmits(['close'])
const currentTypeId = ref(-1)   //新建列表的id


//点击颜色圆圈
const onClickColorItem = (index) => {
currentColorIndex.value = index
}

//点击图标列表里的图标
const onClickIconItem = (index) => {
  currentIconIndex.value = index  
  showIconList.value = false   //关闭图标列表
}

//点击其他区域时，关闭图标列表
import { vClickOutside } from "@/utils/clickOutside.js";
const onClickOutside = () => {
  showIconList.value = false
}


// 点击取消按钮时 
const onClickCancel = () => {
  showIconList.value = false
  emit('close')  //关闭对话框
}

//点击新建按钮/提交表单时
const onSubmit = () => {
  let newItem = {
    name: currentTypeName.value,
    colorIndex: currentColorIndex.value,
    color: colorList.value[currentColorIndex.value],
    svgIndex: currentIconIndex.value,
    id: currentTypeId.value
  }
  emit('close', newItem)
}

// 导出组件的方法 父组件通过ref获取子组件，使用子组件导出的方法
const nameInput = ref(null)   //input框
const autoFocus = () => {
  // 这里用nextTick并不能使input聚焦
  setTimeout(() => {
    nameInput.value.focus()
  })
}

const showDialog = (info) => {
  const {
    title = DEFAULT_TITLE,
    name = '',
    colorIndex = DEFAULT_COLOR_INDEX,
    iconIndex = DEFAULT_ICON_INDEX,
    typeId = -1
  } = info
  currentTitle.value = title
  currentTypeName.value = name
  currentColorIndex.value = colorIndex
  currentIconIndex.value = iconIndex
  currentTypeId.value = typeId
}
defineExpose({ autoFocus , showDialog})



</script>

<style lang="scss">
.type-grid {
  display: grid;
  grid-template-columns: repeat(6, 44px);

  .icon-wrapper {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    border: 1px solid #808080;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 2px;
    margin: 4px;

    .icon {
      width: 100%;
      height: 100%;
    }

    &.icon-wrapper.unselected {
      border-color: transparent;
    }
  }
}
</style>