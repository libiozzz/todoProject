<template>
  <div ref="rootRef">
    <!--  value-format	可选，绑定值的格式。不指定则绑定值为 Date 对象 
          format	显示在输入框中的格式
          prefix-icon	自定义头部图标的类名 
          clear-icon	自定义清空图标的类名-->
    <el-date-picker
      ref="dataPickerRef"
      v-model="date"
      placeholder="选择日期"
      size="small"
      :prefix-icon="datePrefix"
      :clear-icon="dateClearIcon"
      @focus="isActive = true"
      @blur="isActive = false"
      value-format="YYYY-MM-DD"
      :format="dateFormat"
    >
    </el-date-picker>
  </div>
</template>

<script setup>
import { computed, h, onBeforeUnmount, onMounted, ref } from "vue";
import { getSpecialDateStr } from "@/utils/timeUtils";
import  dayjs  from "dayjs";
const props = defineProps(["modelValue"]);
const emit = defineEmits(["update:modelValue"]);
const isActive = ref(false)
const dataPickerRef = ref(null)
const rootRef = ref(null)

const date = computed({
  get() {
    return props.modelValue
  },
  set(value) {
    emit('update:modelValue', value)   //更新cacheData[key]的值
  }
})

const datePrefix = computed(() => {
  return h('img', {
    src: `src/assets/svg/ic_calendar_${ isActive.value ? '' : 'un' }selected.svg`,
    class: "icon",
    alt: ""
  })
})

const dateClearIcon = h('img', {
  src: "src/assets/svg/ic_delete.svg",
  class: "icon",
  alt: ""
})

//处理显示在输入框中的时间
const dateFormat = computed(()=>{
  let dateStr = getSpecialDateStr(date.value)
  if (dateStr) {
    return dateStr
  }
  return 'YYYY/MM/DD'
})

//监听input元素的回调函数
let changeListener = () => {
  const input = rootRef.value.getElementsByTagName('input')[0]
  // trim方法用于删除字符串的头尾空格符
  // handleClose方法用于关闭弹窗
  let inputValue = input.value.trim()
  if (inputValue === '今天') {
    date.value = dayjs().format()
    dataPickerRef.value.handleClose()    //感觉不用调用handleClose函数
    return
  }
  if (inputValue === '明天') {
    date.value = dayjs().add(1, 'day').format()
    dataPickerRef.value.handleClose()
    return
  }
  if (inputValue === '昨天') {
    date.value = dayjs().add(-1, 'day').format()
    dataPickerRef.value.handleClose()
  }
}
onMounted(() => {
  const input = rootRef.value.getElementsByTagName('input')[0]
  input.addEventListener('change', changeListener)   //监听input元素
})

// 折叠组件时，会卸载组件，在此之前需要移除监听回调
onBeforeUnmount(()=>{
  const input = rootRef.value.getElementsByTagName('input')[0]
  input.removeEventListener('change', changeListener)
})
</script>

<style scoped lang="scss">
:deep(.el-date-editor.el-input, .el-date-editor.el-input__wrapper) {
  width: 120px;
  height: 22px;

  .el-input__wrapper {
    box-shadow: none;
    background-color: var(--todo-bg-label);
    border-radius: 4px;

    .icon {
      width: 10px;
      height: 10px;
    }

    .el-input__inner {
      font-size: 13px;
      color: var(--todo-black1);
    }
  }
}
</style>