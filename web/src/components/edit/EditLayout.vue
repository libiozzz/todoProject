<template>
  <div ref="refRoot">
    <div class="edit-root" :class="rootClass" ref="refTodoList">
      <span v-show="showList.length === 0">没有提醒事项</span>
      <div v-if="!isTodayType()" class="header-layout flex-shrink0">
        <span class="tip">{{ doneCount }}个项目已完成&nbsp;·&nbsp;</span>
        <span :style="colorStyle" @click="clearDone"> 清除</span>
        <div class="middle" />
        <span class="hide" :style="colorStyle" @click="showDone = !showDone">{{
          showDone ? "隐藏" : "显示"
        }}</span>
        <feedback-dialog
          title="清除已完成的提醒事项？"
          :message="`${doneCount}个已完成的提醒事项将从此列表中删除。\n此操作不能撤销`"
          v-model:show="showClearDialog"
          @on-sure="removeDoneList"
        />
      </div>
      <div class="divider flex-shrink0" />
      <TransitionGroup :name="listTransitionName">
        <template v-for="(item, index) in showList" :key="getTodoListKey(item)">
          <h3
            class="list-header"
            :style="`color: ${TYPE_COLOR_LIST[item.colorIndex]}`"
            v-if="item.sortInfo && item.sortInfo.type === 1"
          >
            {{ item.name || getTodoListTitle(item.sortInfo.date) }}
          </h3>
          <edit-item
            v-else-if="item.sortInfo && item.sortInfo.type === 3"
            :show-add="true"
            v-model:name="item.name"
            v-model:note="item.note"
            v-model:date="item.date"
            v-model:timer="item.timer"
            v-model:is-flag="item.isFlag"
            v-model:done="item.done"
            v-model:show-extra="item.showExtra"
            @update:show-extra="collapseChanged(item, index)"
          />
          <edit-item
            v-else
            :type-name="getTypeName(item)"
            v-model:name="item.name"
            v-model:note="item.note"
            v-model:date="item.date"
            v-model:timer="item.timer"
            v-model:is-flag="item.isFlag"
            v-model:done="item.done"
            v-model:show-extra="item.showExtra"
            @update:done="onDoneStatusChanged(item, index)"
            @update:show-extra="collapseChanged(item, index)"
          />
        </template>
      </TransitionGroup>
      <div class="other-layout flex-shrink0" @click="onClickBlank"></div>
    </div>
    <feedback-dialog
      title="没有默认列表"
      message="若要在此列表中创建提醒事项，请前往首页创建默认列表"
      sure-text="创建"
      v-model:show="showNoTypeDialog"
      @on-sure="tryCreateType"
    />
  </div>
</template>

<script setup>
import { reactive, ref, computed, nextTick, watch, inject } from "vue";
import EditItem from "@/components/edit/EditItem.vue";
import {
  LIST_TYPE_FOOTER,
  LIST_TYPE_ITEM,
  useCurrentTypeStore,
} from "@/store/currentType";
const currentTypeStore = useCurrentTypeStore();
let currentTypeId = "";
//showList数据的当前索引值
let currentShowIndex = -1;
import { TYPE_COLOR_LIST } from "@/components/menu/menuConstants";
import FeedbackDialog from "@/components/common/FeedbackDialog.vue";
import { isBeforeToday, getTodayStr,isToday } from "@/utils/timeUtils";
import {
  idSortCompare,
  timeSortCompare,
  allSortCompare,
  planSortCompare,
  TYPE_ALL_ID,
  TYPE_TODAY_ID,
  TYPE_PLAN_ID,
  TodoDoc,
  TYPE_SEARCH_ID,
  generateLastId,
  generateSortId,
  diffTodoItem,
  getTodoListKey,
  getTodoListTitle,
} from "@/utils/typeUtils";
import { saveDoc, delDoc } from "@/storage/type";

import { INJECTION_KEY_MENU_LAYOUT } from "@/utils/constant";
const menuLayout = inject(INJECTION_KEY_MENU_LAYOUT);

const refTodoList = ref(null);
const refRoot = ref(null);
const rootClass = reactive({
  is_header: true,
  no_header: false,
});

//transition组件名
const listTransitionName = ref("list");

//控制已完成的提醒事项的显示与隐藏
const showDone = ref(true);

//控制feedbackDialog的显示与隐藏
const showClearDialog = ref(false);

import { createTodoDoc } from "@/service";

// 初始化item所需数据
let stopWatchTypeList = null;
let sortCompareFn = undefined;
let filterFn = undefined;

const todoList = ref([]);

//是否展示对话框
const showNoTypeDialog = ref(false);

// 拿到列表图标对应的颜色
const colorStyle = computed(() => {
  const { colorIndex } = currentTypeStore.item;
  return { color: TYPE_COLOR_LIST[colorIndex] };
});

// 判断是否点击今天/计划/所有卡片
function isTodayType() {
  return currentTypeId === TYPE_TODAY_ID;
}

function isAllType() {
  return currentTypeId === TYPE_ALL_ID;
}

function isPlanType() {
  return currentTypeId === TYPE_PLAN_ID;
}

function isSearchType() {
  return currentTypeId === TYPE_SEARCH_ID;
}

function isOtherType() {
  return (
    currentTypeId === TYPE_TODAY_ID ||
    currentTypeId === TYPE_PLAN_ID ||
    currentTypeId === TYPE_ALL_ID ||
    currentTypeId === TYPE_SEARCH_ID
  );
}

//初始化item
function initList(type) {
  currentTypeId = type.id;
  if (stopWatchTypeList) {
    stopWatchTypeList();
    stopWatchTypeList = null;
  }
  // if (isOtherType()) {
  //   // 监听typeList的id的变化
  //   stopWatchTypeList = watch(
  //     () => currentTypeStore.allTodoTypeList.map((item) => item.id),
  //     () => {
  //       updateSortList();
  //       currentShowIndex = -1;
  //     }
  //   );
  // } //不知道这一坨有什么用
  if (isTodayType()) {
    rootClass.is_header = false;
    rootClass.no_header = true;
  } else {
    rootClass.is_header = true;
    rootClass.no_header = false;
    // 没有必要让屏幕滚动到41px处
    // nextTick(() => {
    //   refRoot.value.scrollTo({ top: 41 });
    // });
  }

  // 筛选出不同情况下需要展示的提醒事项（sortCompareFn用于指定提醒事项的排序，filterFn用于指定展示哪些提醒事项）
  switch (type.id) {
    case TYPE_TODAY_ID:
      sortCompareFn = timeSortCompare;
      filterFn = (item) =>
        item.showExtra || (!item.done && item.date && isBeforeToday(item.date));
      break;
    case TYPE_PLAN_ID:
      sortCompareFn = planSortCompare;
      filterFn = (item) => showDone.value || !item.done;
      break;
    case TYPE_ALL_ID:
      sortCompareFn = allSortCompare;
      filterFn = (item) => showDone.value || !item.done;
      break;
    case TYPE_SEARCH_ID:
      sortCompareFn = allSortCompare;
      filterFn = (item) => showDone.value || !item.done;
      break;
    default:
      sortCompareFn = idSortCompare;
      filterFn = (item) => showDone.value || !item.done;
  }
  updateSortList(true, type, type.id);
  currentShowIndex = -1;
  //type切换时不显示list动画
  listTransitionName.value = "";
  nextTick(() => {
    listTransitionName.value = "list";
  });
}

initList(currentTypeStore.item);

// 监听item
watch(
  () => currentTypeStore.item,
  (item) => {
    initList(item);
  }
);

//更新todoList的排序
function updateSortList(
  updateTodoList = false,
  type = null,
  typeId = currentTypeId
) {
  console.log("----updateSortList", updateTodoList);
  if (updateTodoList) {
    if (typeId === TYPE_TODAY_ID) {
      todoList.value = currentTypeStore.getTodayList();
    } else if (typeId === TYPE_ALL_ID) {
      todoList.value = currentTypeStore.getAllList();
    } else if (typeId === TYPE_PLAN_ID) {
      todoList.value = currentTypeStore.getPlanList();
    } else if (typeId === TYPE_SEARCH_ID) {
      // 这里type不可能为空
      todoList.value = currentTypeStore.getSearchList(type.name)
    } else {
      todoList.value = currentTypeStore.allTodoMap.get(type); //两者双向绑定
    }
  }
  // sort会改变todoList所以会改变showList
  if (sortCompareFn) {
    // console.log('走了这部',sortCompareFn);
    todoList.value.sort(sortCompareFn);
  }
}

// 提醒事项（showList是一个ComputedRefImpl对象，即是与todoList双向绑定的）
const showList = computed(() => {
  if (filterFn) {
    return todoList.value.filter(filterFn);
  } else {
    return todoList.value;
  }
});

// 得到对应列表的name
function getTypeName(item) {
  if ((isTodayType() || isPlanType()) && item.typeId) {
    return currentTypeStore.typeMap.get(item.typeId).name;
  }
  return "";
}

// 点击空白处
function onClickBlank() {
  if (currentShowIndex === -1) {
    // 当前没有在编辑状态的todo，点击空白表示新建一个item
    createItem();
  } else {
    handleLastItem(currentShowIndex, () => {
      currentShowIndex = -1;
    });
  }
}

// 创建一个提醒事项
function createItem(preIndex) {
  if (isSearchType()) {
    // 搜索列表：不创建新item
    return;
  }
  let todoItem;
  // 如果没有列表，需要先新建列表
  if (currentTypeStore.allTodoTypeList.length === 0) {
    showNoTypeDialog.value = true;
    return;
  }
  let insertIndex;
  if (preIndex === undefined) {
    if (isAllType()) {
      // 自动插入的位置为第一个type的最后（findIndex是查找第一个符合条件的元素索引值）
      currentShowIndex = showList.value.findIndex(
        (item) =>
          item.sortInfo.type === LIST_TYPE_FOOTER 
      );
      showList.value[currentShowIndex].showExtra = true;
      return;
    } else if (isPlanType()) {
      // 自动插入的位置为第一个type的最后（findIndex是查找第一个符合条件的元素索引值）
      currentShowIndex = showList.value.findIndex(
        (item) => item.sortInfo.type === LIST_TYPE_FOOTER && isToday(item.sortInfo.date)
      );
      showList.value[currentShowIndex].showExtra = true;
      return;
    } else {
      insertIndex = todoList.value.length;
      currentShowIndex = showList.value.length;
      // console.log('index',currentShowIndex);
    }
  } else {
    insertIndex = todoList.value.findIndex( (item) => item.id === showList.value[preIndex].id ) + 1;
    console.log('insertindex',insertIndex);
    currentShowIndex = preIndex + 1;
  }

  if (isTodayType()) {
    // typeId为第一个type的id
    todoItem = createTodoDoc(currentTypeStore.allTodoTypeList[0].id);
    // 今天列表里新插入的item，时间自动为今天
    todoItem.date = getTodayStr();
  }
  // 回车走这步
  else if (isAllType()) {
    // type为插入时全部列表里所属的type
    let preShowItem = showList.value[insertIndex - 1]
    // 如果是ALL_TYPE_HEADER：就是id，如果是ALL_TYPE_LIST：就是typeId
    todoItem = createTodoDoc(preShowItem.typeId || preShowItem.id)
    // 全部列表插入sortInfo字段、用来排序
    todoItem['sortInfo'] = {
      typeIndex: showList.value[insertIndex - 1].sortInfo.typeIndex,
      type: LIST_TYPE_ITEM
    }
  } else if (isPlanType()) {
    console.log('planinsertindex',insertIndex);
    todoItem = createTodoDoc(currentTypeStore.allTodoTypeList[0].id)
    let preShowItem = showList.value[insertIndex - 1]
    todoItem.date = preShowItem.date || preShowItem.sortInfo.date
    todoItem['sortInfo'] = {
      type: LIST_TYPE_ITEM
    }
  }
  else {
    todoItem = createTodoDoc(currentTypeId);
  }
  console.log("todoItem", todoItem);

  // 更新todoList、不调用updateSortList
  todoList.value.splice(insertIndex, 0, todoItem);
  nextTick(() => {
    // 为了展示动画，延后把showExtra改变
    showList.value[currentShowIndex].showExtra = true;
  });
}

// 如果没有列表，需要先新建列表
function tryCreateType() {
  if (menuLayout) {
    menuLayout.tryCreateType();
  }
}

//showExtra属性改变所执行的回调
function collapseChanged(item, index) {
  if (item.showExtra) {
    console.log("truetruetrue");
    if (currentShowIndex !== index) {
      handleLastItem(currentShowIndex, () => {
        // 如果handleLastItem过程中有增删item，有可能导致currentShowIndex和index不等
        currentShowIndex = showList.value.indexOf(item);
      });
    }
  } else {
    // console.log('参数一',item);
    // 目前只有nameInput回车会走到这
    handleLastItem(index, () => {
      currentShowIndex = -1;
      if (item.name !== "") {
        // 收起当前的item以后、在下面位置创建一个新的item
        createItem(index);
      }
    });
  }
}

//done属性改变所执行的回调
function onDoneStatusChanged(item) {
  if (item.showExtra) {
    // 当前item不做变动
    return;
  }
  let showItem = showList.value[currentShowIndex];
  updateSortList();
  // 更新当前展开的item index
  currentShowIndex = showList.value.indexOf(showItem);
  saveDoc(item);
  currentTypeStore.toggleDoneStatus(item);
}

// 处理提醒事项
function handleLastItem(lastIndex = currentShowIndex, next) {
  //console.log('lastindex',lastIndex);
  if (lastIndex === -1) {
    if (next) {
      next();
    }
    return;
  }
  console.log("----handleLastItem", lastIndex);
  const currentItem = showList.value[lastIndex];
  console.log("currentItem", currentItem);
  currentItem.showExtra = false; //点击空白区域时，使showExtra为false
  let oldData = { ...currentItem };
  console.log("oldData", oldData);
  nextTick(() => {
    //等待EditItem组件中对props.showExtra的监听结束，这时候currentItem拿到最新被修改的值，在进行接下来的操作
    if (currentItem.name === "") {
      if ( currentItem.sortInfo && currentItem.sortInfo.type === LIST_TYPE_FOOTER) {
        // 收起并清空数据
        Object.assign(currentItem, new TodoDoc(-1, currentItem.typeId));
        if (isPlanType()) {
          currentItem.date = currentItem.sortInfo.date;
        }
      } else {
        // name为空、直接删除即可
        deleteTodo(currentItem);
      }
    } else if (currentItem.saved) {
      const changedData = diffTodoItem(oldData, currentItem);
      console.log("----changed", changedData);
      if (changedData) {
        if (changedData.done) {
          currentTypeStore.toggleDoneStatus(currentItem);
        }
        if (isPlanType() && changedData.date) {
          // plan列表太麻烦，暴力的更新todoList todo 不知道这会对渲染性能有影响么
          updateSortList(true);
        } else {
          updateSortList();
        }
        saveDoc(currentItem);
      }
    } else {
      // 保存新建的todo
      saveNewTodo(
        currentItem,
        lastIndex > 0 ? showList.value[lastIndex - 1].sortId : null
      );
    }
    if (next) {
      next();
    }
  });
}

//删除某一个doc提醒事项
function deleteTodo(todoItem) {
  // ui上删除列表的item
  todoList.value.splice(
    todoList.value.findIndex((item) => item.id === todoItem.id),
    1
  );
  if (!todoItem.saved) {
    return;
  }
  // 数据删除item
  delDoc(todoItem);
  currentTypeStore.delTodoItem(todoItem);
}

//点击右上角的加号
function addTodoItem() {
  if (currentShowIndex !== -1) {
    let currentItem = showList.value[currentShowIndex];
    if (!currentItem.saved && currentItem.name === "") {
      // 如果没有保存、并且name为空，则什么都不处理
      return;
    }
    handleLastItem(currentShowIndex, createItem); //否则就删除掉目前正在编辑的doc，并新增一个空的doc
  } else {
    createItem();
  }
}

defineExpose({ addTodoItem, saveItem: handleLastItem });

function saveNewTodo(todoItem, preSortId) {
  let sortId;
  if (isTodayType()) {
    const actualTodoList = currentTypeStore.idTodoMap.get(todoItem.typeId);
    sortId = generateLastId(actualTodoList);
  } else if (isAllType()) {
    const actualTodoList = currentTypeStore.idTodoMap.get(todoItem.typeId);
    if (todoItem.sortInfo.type === LIST_TYPE_FOOTER) {
      // 如果是footer状态、则在actualTodoList最后加newTodo
      let footIndex = todoList.value.indexOf(todoItem);
      sortId = generateLastId(actualTodoList);
      let footItem = todoItem;
      todoItem = createTodoDoc(todoItem.typeId, { ...todoItem });
      todoItem["sortInfo"] = {
        typeIndex: footItem.sortInfo.typeIndex,
        type: LIST_TYPE_ITEM,
      };
      todoList.value[footIndex] = todoItem; ///////
      // 清空footer
      Object.assign(footItem, new TodoDoc(-1, footItem.typeId));
      todoList.value.splice(footIndex, 0, footItem);
    } else {
      sortId = generateSortId(actualTodoList, preSortId);    //待思考
    }
  } else if (isPlanType()) {
    if (todoItem.sortInfo.type === LIST_TYPE_FOOTER) {
      let footIndex = todoList.value.indexOf(todoItem);
      let footItem = todoItem
      todoItem = createTodoDoc(currentTypeStore.allTodoTypeList[0].id, { ...todoItem })
      todoItem['sortInfo'] = {
        type: LIST_TYPE_ITEM
      }
      Object.assign(footItem, new TodoDoc(-1, undefined));
      footItem['date'] = todoItem['date']
      todoList.value.splice(footIndex, 0, footItem);
    }
    const actualTodoList = currentTypeStore.idTodoMap.get(todoItem.typeId)
    sortId = generateLastId(actualTodoList)
    // 因为plan是要再次获取todoList的，所以就不操作todoList了
  } else {
    sortId = generateSortId(todoList.value, preSortId);
  }
  todoItem.setSortId(sortId); //添加sortId属性
  todoItem.saved = true;
  // 创建的todo持久化
  saveDoc(todoItem);
  // 更新type的idList
  currentTypeStore.addNewItem(todoItem);
  // 更新todoList的排序
  updateSortList(isPlanType());
}

// 已完成的提醒事项的个数
const doneCount = computed(() => {
  return todoList.value.filter((item) => item.done).length;
});

//清除已完成的提醒事项
function clearDone() {
  if (doneCount.value === 0) {
    return;
  }
  showClearDialog.value = true;
}

//删除已完成的提醒事项的相关数据
function removeDoneList() {
  let doneList = todoList.value.filter((item) => item.done);
  todoList.value = todoList.value.filter((item) => !item.done);
  location.reload(); //只能通过刷新来解决allTodoMap的问题了
  currentTypeStore.delAllDoneItem();
  for (const doneItem of doneList) {
    delDoc(doneItem);
  }
}
</script>

<style scoped lang="scss">
.edit-root {
  display: flex;
  flex-direction: column;
  overflow-y: scroll;

  &.is_header {
    height: calc(100% + 41px);
  }

  &.no_header {
    height: 100%;
  }

  &::-webkit-scrollbar {
    display: none;
  }

  & > span {
    color: var(--todo-gray3);
    font-size: 26px;
    position: absolute;
    left: 50%;
    top: 50%;
    display: inline-block;
    transform: translate(-50%, -50%);
  }

  .header-blank {
    height: 40px;
  }

  .header-layout {
    margin: 0 16px;
    font-size: 14px;
    display: flex;
    align-items: center;
    height: 40px;
    position: relative;

    .tip {
      color: var(--todo-gray4);
    }

    .middle {
      flex: 1;
    }
  }

  .divider {
    display: block;
    width: 100%;
    margin-left: 16px;
    height: 1px;
    background-color: var(--divider-gray2);
  }

  .other-layout {
    flex: 1;
  }

  h3.list-header {
    margin-left: 16px;
    font-size: 18px;
    font-weight: bold;
    height: 32px;
    line-height: 32px;
  }
}

.flex-shrink0 {
  flex-shrink: 0; //当一个容器的flex-shrink属性为0，则空间不足时，该容器不缩小
}

.list-move {
  transition: all 0.5s ease;
}
</style>