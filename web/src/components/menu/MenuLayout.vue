<template>
  <!-- 菜单模块 -->
  <div class="menu-layout">
    <!-- 左上角的点点 -->
    <div class="circle">
      <img src="src/assets/svg/circle_red.svg" alt="" />
      <img src="src/assets/svg/circle_yellow.svg" alt="" />
      <img src="src/assets/svg/circle_blue.svg" alt="" />
    </div>
    <!-- 搜索模块 -->
    <div class="input-wrapper">
      <input type="text" placeholder="搜索" v-model="searchText" />
      <img src="src/assets/svg/search.svg" alt="" class="input-search" />
      <div
        class="input-close-wrapper"
        v-show="searchText.length > 0"
        @click="searchText = ''"
      >
        <img src="src/assets/svg/search_close.svg" alt="" class="input-close" />
      </div>
    </div>
    <!-- 卡片模块 -->
    <div class="todo-card-layout">
      <!-- 今天卡片 -->
      <card-item class="todo-item item-left" :cardType="1"  @click="onClickCard(1)" :is-selected="isCardSelected(1)" :count="currentTypeStore.countInfo.todayCount"></card-item>
      <!-- 计划卡片 -->
      <card-item class="todo-item" :cardType="2"  @click="onClickCard(2)" :is-selected="isCardSelected(2)" :count="currentTypeStore.countInfo.planCount"></card-item>
    </div>
    <!-- 全部卡片 -->
    <card-item class="all-card" :cardType="3"  @click="onClickCard(3)" :is-selected="isCardSelected(3)" :count="currentTypeStore.countInfo.allCount"></card-item>
    <!-- 列表模块 -->
    <type-list-lay-out style="margin-top: 16px; margin-bottom: 30px;" ref="typeList" @right-click-item="onTypeListContextSelected"></type-list-lay-out>
    <!-- 底部模块 -->
    <div class="bottom-add bottom-divider" >
      <div class="add" @click="addType"></div>
      <span @click="addType">添加列表</span>
    </div>
    <!-- 对话框 -->
    <el-dialog
      v-model="showTypeDialog"
      width="480px"
      align-center
      :show-close="false"
      :close-on-click-modal="false"
      >
      <type-dialog-layout @close="onDialogClosed" ref="dialogContent" ></type-dialog-layout>
    </el-dialog>
  </div>
</template>

<script setup>
import CardItem from "@/components/menu/CardItem.vue";
import TypeListLayOut from "@/components/menu/TypeListLayout.vue";
import TypeDialogLayout from '@/components/menu/TypeDialogLayout.vue'
import { ref,watch,nextTick } from "vue";

//封装的js数据
import {
  TYPE_TODAY,
  TYPE_TODO,
  TYPE_ALL,
} from "@/components/menu/menuConstants";

import { TODO_TYPE_ALL, TODO_TYPE_TODAY, TODO_TYPE_PLAN, TYPE_ALL_ID, TYPE_TODAY_ID, TYPE_PLAN_ID, TYPE_SEARCH_ID, TodoType } from "@/utils/typeUtils";

//pinia数据
import { useCurrentTypeStore } from "@/store/currentType.js";
const currentTypeStore = useCurrentTypeStore()

//搜索模块
const searchText = ref(""); //搜索input框的文字

//对话框模块
const dialogContent = ref(null)   //获取对话框组件
const showTypeDialog = ref(false) //控制对话框的显示与隐藏

//卡片模块
//点击卡片
const onClickCard = (type) => {
  if (type === 1) {
    currentTypeStore.updateCurrentType(TODO_TYPE_TODAY)
  } else if (type === 2) {
    currentTypeStore.updateCurrentType(TODO_TYPE_PLAN)
  } else {
    currentTypeStore.updateCurrentType(TODO_TYPE_ALL)
  }
}

function isCardSelected(type) {
  const typeId = currentTypeStore.currentTypeId
  //console.log('typeId',typeId);
  if (type === 1) {
    return typeId === TYPE_TODAY_ID
  } else if (type === 2) {
    return typeId === TYPE_PLAN_ID
  } else if (type === 3) {
    return typeId === TYPE_ALL_ID
  }
  return false
}

//列表模块
const typeList = ref(null)
import {useTypeStore} from '@/store/type.js'
const typeStore = useTypeStore()

//点击左下角的添加列表
const addType = () => {
  showTypeDialog.value = true
  //在显示列表信息之后 再将对话框置为原始状态
  nextTick(() => {
    dialogContent.value.showDialog({})
  })
} 

defineExpose({ createType: addType })

//如果显示对话框，就自动聚焦input框
watch(showTypeDialog, (newShow) => {
  if (newShow) {
    nextTick(() => {
      dialogContent.value.autoFocus()    //调用TypeDialogLayout组件的autoFocus方法
    })
  }
})

//点击新建按钮/提交表单时
const onDialogClosed = (res) => {
  showTypeDialog.value = false
  console.log('newItem',res);
  if (res) {
    if (res.id === -1) {
      typeStore.addType(res).then(typeInfo => {
        console.log('---add type', typeInfo)
        /* 接收的typeInfo格式为 {
            color : "#157efb"
            colorIndex: 5
            doneIdList: []
            id: 28
            idList: []
            name: "8"
            svgIndex: 0 */
        typeList.value.addType(typeInfo)   //调用TypeDialogLayout组件的addType方法
      }).catch(err => console.log(err))
    }
    //  else {
    //   typeList.value.modifyItem(res)   //调用TypeDialogLayout组件的modifyItem方法
    // }
  }
}

//点击右键菜单时
const onTypeListContextSelected = (res) => {
  let { typeItem, type } = res
  if (type === 'showType') {
    if (typeItem) {
      showTypeDialog.value = true
      let { colorIndex, svgIndex, name, id } = typeItem
      nextTick(() => {
        dialogContent.value.showDialog({
          title: `"${ name }"简介`,
          name,
          colorIndex,
          iconIndex: svgIndex,
          typeId: id,
        })
      })
    }
  }
}

//搜索模块---防抖处理
let timer = null
let lastType = null
watch(searchText, () => {
  if (timer) {
    clearTimeout(timer)
  }
  timer = setTimeout(() => {
    if (searchText.value) {
      if (currentTypeStore.item.id !== TYPE_SEARCH_ID) {
        // 记录上次的type
        lastType = currentTypeStore.item
      }
      currentTypeStore.updateCurrentType(new TodoType(TYPE_SEARCH_ID, searchText.value, 0))    //创建/更新search的数据
    } else {
      currentTypeStore.updateCurrentType(lastType)
    }
    timer = null
  }, 500)
})
</script>

<style scoped lang="scss">
@import "@/assets/style/type-dialog.scss";

.menu-layout {
  display: flex;
  flex-direction: column;

//搜索模块
  .input-wrapper {
    position: relative;

    input {
      //transition: outline-width 4s, text-shadow 2s;
      width: 100%;
      height: 30px;
      border: 1px solid #d2d2d2;
      outline: 0 solid #7aa7e5;
      outline-offset: 0;
      border-radius: 6px;
      padding: 0 28px;
      background-color: #d7d7d7;
      color: var(--todo-black1);

      &:focus {
        outline-width: 3px;
        animation: border-ani 0.2s;
      }

      &:hover {
        border-color: #7aa7e5;
      }

      &::placeholder {
        color: var(--todo-placeholder-color);
      }

      @keyframes border-ani {
        0% {
          outline-width: 0;
        }

        70% {
          outline-width: 8px;
          outline-color: rgba(133, 167, 204, 0.99)
        }

        100% {
          outline-width: 3px;
          outline-color: #7aa7e5
        }
      }
    }


    .input-search {
      width: 12px;
      height: 12px;
      position: absolute;
      top: 8px;
      left: 8px;
    }

    .input-close-wrapper {
      position: absolute;
      top: 0;
      right: 0;
      height: 100%;
      width: 28px;
      display: flex;
      align-items: center;
      justify-content: center;

      .input-close {
        width: 14px;
        height: 14px;
      }
    }
  }
}

.todo-card-layout {
  margin-top: 18px;
  display: flex;

  .todo-item {
    flex: 1;
  }

  .item-left {
    margin-right: 8px;
  }
}

.all-card {
  margin-top: 8px;
  width: 100%;
}

.bottom-add {
  display: flex;
  height: 30px;
  width: 100%;
  align-items: center;
  position: absolute;
  bottom: 0;
  left: 0;
  // 保证比menuList的大
  z-index: 101;

  span {
    margin-left: 8px;
    font-size: 14px;
    color: var(--todo-black1);
  }

  .add {
    margin-left: 8px;
    border: 1px solid;
    border-radius: 50%;
    width: 14px;
    height: 14px;
    color: var(--todo-black1);
  }

  .add::before {
    content: '';
    position: absolute;
    left: 50%;
    top: 50%;
    width: 8px;
    height: 1px;
    margin-left: -4px;
    margin-top: -0.5px;
    background-color: var(--todo-black1);
  }

  .add::after {
    content: '';
    position: absolute;
    left: 50%;
    top: 50%;
    width: 1px;
    height: 8px;
    margin-left: -0.5px;
    margin-top: -4px;
    background-color: var(--todo-black1);
  }
}

.bottom-divider::before {
  content: '';
  position: absolute;
  width: 100%;
  height: 1px;
  background-color: var(--divider-gray1);
  top: 0;
}
</style>