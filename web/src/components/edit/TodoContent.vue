<template>
  <div class="content-layout">
    <title-layout v-bind="currentType" @clickAdd="onClickAdd" />
    <edit-layout class="edit-layout" ref="refEditLayout" />
  </div>
</template>

<script setup>
import TitleLayout from "@/components/edit/TitleLayout.vue";
import { useCurrentTypeStore } from "@/store/currentType";
import { computed, ref } from "vue";
import EditLayout from "@/components/edit/EditLayout.vue";
import { TYPE_ALL_ID, TYPE_PLAN_ID, TYPE_SEARCH_ID, TYPE_TODAY_ID,getTodoCount } from "@/utils/typeUtils";
const refEditLayout = ref(null)
const currentTypeStore = useCurrentTypeStore()

const currentType = computed(() => {
  let { name: title, colorIndex } = currentTypeStore.item
  let count 
  let showAdd
  let showCount
  let textColor
  switch (currentTypeStore.item.id) {
    case TYPE_TODAY_ID:
      count = currentTypeStore.countInfo.todayCount
      break
    case TYPE_PLAN_ID:
      count = currentTypeStore.countInfo.planCount
      break
    case TYPE_ALL_ID:
      count = currentTypeStore.countInfo.allCount
      break
    case TYPE_SEARCH_ID:
      title = `"${ title }"的结果`
      count = 0
      showAdd = false
      showCount = false
      textColor = '#5b626a'
      break
    default:
      count = getTodoCount(currentTypeStore.item)
  }
  return { title, count, colorIndex, showAdd, showCount, textColor }
})

// 存储提醒事项信息
function saveEditItem() {
  console.log('save',refEditLayout.value.saveItem());
  refEditLayout.value.saveItem()
}
defineExpose({ saveEditItem })

//点击右上角的加号
function onClickAdd() {
  refEditLayout.value.addTodoItem()
}


</script>

<style scoped lang="scss">
.content-layout {
  display: flex;
  flex-direction: column;

  .edit-layout {
    flex: 1;
    overflow-y: scroll;

    &::-webkit-scrollbar {
      display: none;
    }
  }
}
</style>