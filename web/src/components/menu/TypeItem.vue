<template>
  <div>
    <circle-icon :svg-name="svgName" :color="color" class="circle"></circle-icon>
    <input v-show="edit" v-model="nameFromInput" ref="refInput"
           @focusout="$emit('modifyName', nameFromInput)"
           @keydown.enter="$emit('modifyName', nameFromInput)"
           @click.stop />
    <span v-show="!edit" class="name">{{name}}</span>
    <span class="count">{{count}}</span>
  </div>
</template>

<script setup>
import CircleIcon from "@/components/common/CircleIcon.vue";
import { ref , watch ,nextTick } from "vue";
const props = defineProps({
  name: {
    type: String,
    required: true,
  },
  svgName: {
    type: String,
    required: true,
  },
  color: {
    type: String,
    required: true,
  },
  edit: {
    type: Boolean,
    default: true,
  },
  count: {
    type: Number,
    default: 0
  }
});

const nameFromInput = ref(props.name)
const refInput = ref(null)
watch(() => props.edit, (newEdit) => {
  if (newEdit) {
    nameFromInput.value = props.name
    nextTick(() => {
      refInput.value.focus()
      //规定文字选中区域的起始位置
      refInput.value.selectionStart = 0
      refInput.value.selectionEnd = nameFromInput.value.length
    })
  }
})
</script>

<style>
</style>