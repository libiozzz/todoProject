<template>
  <div class="timer-input">
    <img
      :src="`src/assets/svg/ic_clock_${isActive ? '' : 'un'}selected.svg`"
      class="icon"
      alt=""
    />
    <!-- hide-after	延迟关闭，单位毫秒 
         visible / v-model:visible	Popover 是否显示 -->
    <el-popover
      placement="bottom"
      width="160"
      trigger="focus"
      v-model:visible="showTipList"
      :hide-after="50"
    >
      <!-- 触发气泡卡片的区域 -->
      <template #reference>
        <!-- @input事件 用于实时查询，即每输入一个字符就会触发该事件（和@change不一样，@change是要失去焦点或回车键等等操作后才会触发） -->
        <input
          type="text"
          class="value"
          placeholder="添加时间"
          v-model="currentValue"
          @focus="isActive = true"
          @blur="isActive = false"
          @click="showTipList = true"
          @input="onInput"
          @keydown="inputKeyDown($event)"
        />
      </template>
      <!-- 气泡卡片显示的内容 -->
      <div class="timer-tip-layout">
        <h5>建议</h5>
        <div
          class="tip-item-layout"
          v-for="(item, index) in tipList"
          :key="index"
          :class="{ 'item-selected': index === activeIndex }"
          @mouseover="activeIndex = index"
          @mouseleave="activeIndex = -1"
          @click="onClickTimeItem(item, index)"
        >
          <img
            :src="`src/assets/svg/ic_clock2_${
              activeIndex === index ? '' : 'un'
            }selected.svg`"
            alt=""
          />
          <div>
            <span class="time">{{ item.time }}</span>
            <span class="desc">{{ item.desc }}</span>
          </div>
        </div>
      </div>
    </el-popover>
    <img src="src/assets/svg/ic_delete.svg" alt="" class="del_icon" @click="clearTime"/>
  </div>
</template>
<script setup>
import { computed, ref, watch } from "vue";
import dayjs from "dayjs";

const TIP_TEMPLATE = [
  { time: "09:00", desc: "上午" },
  { time: "12:00", desc: "中午" },
  { time: "15:00", desc: "下午" },
  { time: "18:00", desc: "晚上" },
  { time: "21:00", desc: "夜间" },
];

const props = defineProps(["modelValue"]);
const emit = defineEmits(["update:modelValue"]);

const isActive = ref(false); //控制图标的切换
const showTipList = ref(false); //控制卡片的显示与隐藏
const currentValue = ref(props.modelValue);
const activeIndex = ref(-1);
const tipList = ref([]);
// 初始状态为推荐时间
tipList.value.push(...TIP_TEMPLATE);
// actualValue充当一个中间角色，通过修改它能够去修改currentValue和props.modelValue
const actualValue = computed({
  get() {
    return props.modelValue;
  },

  set(value) {
    currentValue.value = value;
    emit("update:modelValue", value);
  },
});

//点击卡片里的时间
function onClickTimeItem(item) {
  showTipList.value = false;
  actualValue.value = item.time;
}

//重置TipList为初始状态
function resetTipList() {
  tipList.value = [...TIP_TEMPLATE]
}

//实时监听输入框
function onInput() {
  let value = currentValue.value.replaceAll(" ", "");
  // 搞个简单的正则 todo 这里应该可以更好的，简单写吧
  let pattern = /^([0-9]|[0-1][0-9]|2[0-4]):([0-9]|[0-5][0-9])$/;
  console.log("----", pattern.test(value));
  // showTipList.value = true;
  if (pattern.test(value)) {
    let hour = value.split(":")[0];
    let minute = value.split(":")[1];
    if (hour.length === 1) {
      hour = "0" + hour;
    }
    if (minute.length === 1) {
      minute = "0" + minute;
    }
    tipList.value = [{ time: hour + ":" + minute, desc: "自定义" }];
  } else {
    resetTipList();
  }
}

//清除时间
function clearTime() {
  actualValue.value = ''
  // resetTipList()
}

//按键执行的回调
function inputKeyDown(ev) {
  if (ev.isComposing) {   //是否进行中文输入
    return
  }
  if (ev.key === 'ArrowDown') {    //是否按了向下箭头
    if (activeIndex.value < tipList.value.length - 1) {    
      activeIndex.value++
    }
  } else if (ev.key === 'ArrowUp') {  //是否按了向上箭头
    if (activeIndex.value > 0) {
      activeIndex.value--
    }
  } else if (ev.keyCode === 27) {    //是否按了Esc键
    showTipList.value = false
  } else if (ev.key === 'Enter') {
    if (activeIndex.value >= 0) {    //是否按了回车键
      const item = tipList.value[activeIndex.value]
      actualValue.value = item.time
    }
  }
}

</script>
<style scoped lang="scss">
.timer-input {
  display: flex;
  align-items: center;
  background-color: var(--todo-bg-label);
  border-radius: 4px;

  .icon {
    width: 10px;
    height: 10px;
    margin: 0 6px;
  }

  input {
    background: none;
    border: none;
    outline: none;
    display: inline-block;
    width: 60px;
    height: 22px;
    font-size: inherit;
    color: var(--todo-black1);

    &::placeholder {
      font-size: inherit;
      color: var(--el-text-color-placeholder);
    }

    & + .del_icon {
      width: 10px;
      height: 10px;
      margin: 0 6px;
      visibility: hidden;
      cursor: pointer;
    }
  }

  &:hover {
    input:placeholder-shown + .del_icon {
      visibility: hidden;
    }

    .del_icon {
      visibility: visible;
    }
  }
}

.timer-tip-layout {
  display: flex;
  flex-direction: column;

  h5 {
    font-size: 12px;
    color: var(--el-text-color-placeholder);
    margin-bottom: 4px;
    margin-left: 6px;
  }

  .tip-item-layout {
    display: flex;
    align-items: center;
    height: 36px;
    border-radius: 4px;

    &.item-selected {
      background-color: var(--todo-bg-blue-selected);

      .time {
        color: white;
      }

      .desc {
        color: #eeeeee;
      }
    }

    img {
      margin-left: 8px;
      margin-right: 8px;
      width: 14px;
      height: 14px;
    }

    span {
      display: block;
      font-size: 12px;
      line-height: 16px;
      cursor: default;
    }

    .time {
      color: var(--todo-black1);
    }

    .desc {
      color: var(--todo-black3);
    }
  }
}
</style>