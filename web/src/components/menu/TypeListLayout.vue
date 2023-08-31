<template>
  <div class="type-layout" ref="refListLayout">
    <div class="indicator-item">
      <h3>我的列表</h3>
      <div class="indicator" v-show="overIndex == -1">
        <div class="indicator-circle"></div>
        <div class="indicator-line"></div>
      </div>
    </div>
    <!-- 拖拽列表动画 -->
    <div ref="refMenuList">
      <TransitionGroup name="list">
        <div v-for="(item, index) in list" :key="item.id" ref="items">
          <!-- @context-menu 是绑定右击菜单事件 -->
          <type-item
            class="menu-item-layout"
            :name="item.name"
            :svg-name="`ic_type_white${item.svgIndex}`"
            :color="`${colorList[item.colorIndex]}`"
            :edit="index === currentEditIndex"
            :count="getTodoCount(item)"
            :class="{
              'item-selected': item.id === currentTypeId,
              'status-active': index === activeIndex,
            }"
            @contextmenu.stop.prevent="onMouseRightClick($event, item, index)"
            @click="onItemClicked(item)"
            draggable="true"
            @dragstart="onDragStart($event, item, index)"
            @dragover.prevent="onDragOver($event, item, index)"
            @dragend="onDragEnd($event, index)"
            @modifyName="(name) => onNameModify(index, name)"
          ></type-item>
        </div>
      </TransitionGroup>
    </div>
    <!-- 右键菜单模块 -->
    <context-menu
      :menu-list="menuList"
      ref="refContextMenu"
      @menu-dismiss="onContextMenuClosed"
    />
    <!-- 删除对话框 -->
    <feedback-dialog
      :title="`删除列表${dialog.title} ？`"
      message="这将删除此列表中所有的提醒事项。"
      v-model:show="dialog.showDeleteDialog"
      @on-sure="deleteType"
    />
  </div>
</template>

<script setup>
import { ref, nextTick, reactive, watch, inject,onMounted } from "vue";
import { storeToRefs } from "pinia";
import TypeItem from "@/components/menu/TypeItem.vue";
import ContextMenu from "@/components/common/ContextMenu.vue";
import FeedbackDialog from "@/components/common/FeedbackDialog.vue";
//pinia
import { useCurrentTypeStore } from "@/store/currentType.js";
const currentTypeStore = useCurrentTypeStore();
const { currentTypeId } = storeToRefs(currentTypeStore); //提取currentTypeId属性，并使其具有响应性

//所有todo
const list = currentTypeStore.allTodoTypeList;
const listMap = currentTypeStore.allTodoMap;

//所有颜色
import { TYPE_COLOR_LIST } from "@/components/menu/menuConstants";

const colorList = TYPE_COLOR_LIST;
const refListLayout = ref(null);

//右击列表相关数据
const refContextMenu = ref(null);
const emit = defineEmits(["rightClickItem"]);
//拖拽列表相关数据
const refMenuList = ref(null);

import { updateTypeList } from "@/storage/type";

import { INJECTION_KEY_EDIT_LAYOUT } from "@/utils/constant";
import { getTodoCount } from "@/utils/typeUtils";
const { saveItem } = inject(INJECTION_KEY_EDIT_LAYOUT)


//更新信息
function updateCurrentType(item) {
  saveItem()     // 调用inject传入的方法，存储提醒事项的信息
  nextTick(() => {
    currentTypeStore.updateCurrentType(item);
  });
}

//添加列表
function addType(typeInfo) {
  console.log("接收到", typeInfo);
  list.push(typeInfo);
  console.log("list", list);
  listMap.set(typeInfo, []);
  currentTypeStore.addType(typeInfo);
  nextTick(() => {
    updateCurrentType(typeInfo);
    refListLayout.value.scrollTo({
      top: refListLayout.value.scrollHeight,
      behavior: "smooth",
    });
    console.log("over");
  });
}

defineExpose({ addType });


// 列表数据相关
// 调用updateTypeList往本地存储一些数据
function useTypeList() {
  watch(list,(newValue) => {
      //console.log('newValue',newValue);
      updateTypeList(newValue);
    },{ deep: true }
  );

  function onItemClicked(item) {
    updateCurrentType(item);
  }

  return {
    list,
    updateCurrentType,
    onItemClicked,
  };
}

//解构出onItemClicked函数，点击任意一个列表，就更新currentTypeId和item信息
const {
  onItemClicked,
} = useTypeList()   
// console.log('test',onItemClicked);

//右键contextmenu
function useContextMenu(list, refContextMenu, emit) {
  const currentEditIndex = ref(-1);
  const activeIndex = ref(-2); //右键选中状态
  //右键菜单的数据
  const menuList = reactive([
    { value: "显示列表信息", type: "showType" },
    -1,
    { value: "在新窗口中打开列表", type: "none" },
    -1,
    {
      value: "排序方式",
      subMenu: [
        { value: "手动" },
        { value: "创建日期" },
        { value: "截止日期" },
        { value: "优先级" },
        { value: "标题" },
      ],
    },
    -1,
    { value: "重新命名", type: "rename" },
    { value: "删除", type: "delete" },
    {
      value: "移到群组",
      subMenu: [
        { value: "群组1" },
        { value: "群组2" },
        { value: "群组3" },
        { value: "群组4" },
        { value: "群组5" },
      ],
    },
    -1,
    { value: "共享列表", type: "none" },
  ]);
  //控制删除对话框的显示与隐藏 和删除对话框中标题的值
  const dialog = ref({
    showDeleteDialog: false,
    title: "",
  });
  //右键列表触发的事件
  function onMouseRightClick(e, item, index) {
    activeIndex.value = index;
    refContextMenu.value.showContextMenu(e.clientX, e.clientY);
  }
  //触发其他区域，关闭右键菜单
  function onContextMenuClosed(index, subIndex) {
    console.log("---onContextMenuClosed", index, subIndex);

    if (subIndex !== undefined) {
      // 点击sub-menu
    } else if (index !== undefined) {
      // 点击menu
      const type = menuList[index].type;
      if (type === "delete") {
        let typeItem = list[activeIndex.value];
        if (getTodoCount(typeItem) > 0) {
          dialog.value.showDeleteDialog = true;
          dialog.value.title = typeItem.name;
          return;
        } else {
          deleteType();
        }
      } else if (type === "showType") {
        let typeItem = list[activeIndex.value];
        emit("rightClickItem", { typeItem, type, index, subIndex });
      } else if (type === "rename") {
        currentEditIndex.value = activeIndex.value;
      }
    }
    // 把右键选中状态置空
    activeIndex.value = -1;
  }

  watch(
    () => dialog.value.showDeleteDialog,
    (v) => {
      if (!v) {
        activeIndex.value = -1;
      }
    }
  );

  //删除todo列表
  function deleteType() {
    const deleteIndex = activeIndex.value;
    nextTick(() => {
      let isDelCurrent = list[deleteIndex].id === currentTypeId.value;
      currentTypeStore.deleteType(list[deleteIndex]);
      list.splice(deleteIndex, 1);
      // todo 暂时还没做list为空的情况
      if (list.length === 0) {
        updateCurrentType(null);
      } else if (isDelCurrent) {
        updateCurrentType(list[0]);
      }
    });
  }

  // 重命名
  function onNameModify(index, name) {
    currentEditIndex.value = -1;
    list[index].name = name;
    if (currentTypeId.value === list[index].id) {
      updateCurrentType(list[index]);
    }
  }

  return {
    currentEditIndex,
    activeIndex,
    menuList,
    dialog,
    onMouseRightClick,
    onContextMenuClosed,
    deleteType,
    onNameModify,
  };
}

// 右键contextMenu相关数据
const {
  currentEditIndex,
  activeIndex,
  menuList,
  dialog,
  onMouseRightClick,
  onContextMenuClosed,
  deleteType,
  onNameModify,
} = useContextMenu(list, refContextMenu, emit);

//拖拽列表
function useTypeListDrag(list, refListLayout, refMenuList) {
  const isDraggingOut = ref(true);
  const isDragging = ref(false);
  const overIndex = ref(-2);
  const listLayout = reactive({
    bottom: 0,
  });
  const menuRect = ref({
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  });

  //初始化listLayout 和 menuRect数据
  function initMenuRect() {
    let layoutRect = refListLayout.value.getBoundingClientRect();
    console.log("layoutRect", layoutRect);
    listLayout.bottom = layoutRect.bottom;
    let menuListRect = refMenuList.value.getBoundingClientRect();
    let { top, bottom, left, right } = menuListRect;
    menuRect.value = { top, bottom, left, right };
    console.log("menuRect", menuRect.value);
  }

  onMounted(initMenuRect);

  function onDragStart(ev, item, index) {
    isDragging.value = true;
    console.log("----start drag", index);
  }

  function onDragOver(event, item, index) {
    //注：index会随着当前拖拽的item移动而改变 （移动到哪个item 就改变成哪个index）
    overIndex.value = index;
    let ratio = event.offsetY / 36; //这个36是每个item的给固定高度
    if (ratio < 1 / 4) {
      overIndex.value = index - 1;
    } else if (ratio <= 3 / 4) {
      // todo
      overIndex.value = -2;
    } else {
      overIndex.value = index;
    }
  }

  function onDragEnd(event, index) {
    isDragging.value = false;
    isDraggingOut.value = true;
    // console.log('----drag end', event, index, overIndex.value)
    if (overIndex.value === -2) {
      return;
    }
    // 要移动的item
    const moveIndex = index;
    //console.log("moveIndex", moveIndex);
    // 要插入的位置
    let insertIndex = overIndex.value;
    if (moveIndex !== insertIndex) {
      const moveItem = list[moveIndex];
      //console.log("moveItem", moveItem);
      list.splice(moveIndex, 1);
      if (moveIndex > insertIndex) {
        insertIndex++;
      }
      list.splice(insertIndex, 0, moveItem);
    }
    isDragging.value = false;
    isDraggingOut.value = true;
    overIndex.value = -2;
  }

  function onDrag(ev) {
    let { clientX, clientY } = ev;
    if (clientX === 0 && clientY === 0) {
      return;
    }
    if (clientX < menuRect.value.left || clientX > menuRect.value.right) {
      overIndex.value = -2;
      isDraggingOut.value = true;
      return;
    }
    if (clientY < menuRect.value.top) {
      overIndex.value = -2;
      isDraggingOut.value = true;
      return;
    }
    if (clientY > listLayout.bottom) {
      overIndex.value = -2;
      isDraggingOut.value = true;
      return;
    }
    isDraggingOut.value = false;
    if (clientY > menuRect.value.bottom) {
      // 让overIndex等于最底下的索引值
      overIndex.value = list.length - 1;
    }
  }
  //感觉该方法有没有都是一样的效果
  // function isShowIndicator(index) {
  //   if (!isDragging.value || isDraggingOut.value) {
  //     // 不再滑动、或者滑出列表
  //     return false;
  //   }
  //   return index === overIndex.value;
  // }

  return {
    isDraggingOut,
    isDragging,
    overIndex,
    menuRect,
    listLayout,
    initMenuRect,
    onDragStart,
    onDragOver,
    onDragEnd,
    onDrag,
  };
}

// 列表拖拽相关的数据
const { overIndex, onDragStart, onDragOver, onDragEnd, onDrag } =
  useTypeListDrag(list, refListLayout, refMenuList);

</script>

<style scoped lang="scss">
$--el-dialog-bg-color: red;

.list-move, /* 对移动中的元素应用的过渡 */
.list-enter-active,
.list-leave-active {
  transition: all 0.5s ease;
}

.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateX(30px);
}

/* 确保将离开的元素从布局流中删除
  以便能够正确地计算移动的动画。 */
.list-leave-active {
  position: absolute;
}
</style>