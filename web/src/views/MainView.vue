<template>
  <div class="main-container">
    <menu-layout class="menu-container" ref="refMenuLayout" />
    <todo-content class="content-container" ref="refEditContent" />
  </div>
</template>

<script setup>
import MenuLayout from "@/components/menu/MenuLayout.vue";
import { INJECTION_KEY_EDIT_LAYOUT, INJECTION_KEY_MENU_LAYOUT } from "@/utils/constant";
import TodoContent from "@/components/edit/TodoContent.vue";
import { ref, provide } from "vue";
import { useCurrentTypeStore } from "@/store/currentType";
console.log("---loadData");
useCurrentTypeStore().loadData();
const refEditContent = ref(null);
const refMenuLayout = ref(null);

provide(INJECTION_KEY_EDIT_LAYOUT, {
  saveItem() {
    if (refEditContent.value) {
      refEditContent.value.saveEditItem();
    }
  },
});

provide(INJECTION_KEY_MENU_LAYOUT, {
  tryCreateType() {
    if (refMenuLayout.value) {
      refMenuLayout.value.createType()
    }
  }
})
</script>

<style scoped lang="scss">
</style>