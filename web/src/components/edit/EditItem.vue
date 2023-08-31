<template>
  <div class="edit-item-root" ref="refItem">
    <!-- 加号 -->
    <div v-if="showAdd" class="add" @click="onClickSpan">
      <div class="line line-x" />
      <div class="line line-y" />
    </div>
    <!-- 按钮 -->
    <label v-else class="radio">
      <input type="checkbox" v-model="cacheData.done" />
      <div class="checkmark" />
    </label>
    <div class="info-layout">
      <input
        class="input-item name"
        type="text"
        v-model="cacheData.name"
        ref="refNameInput"
        @click.stop="onClickSpan"
        @keydown.enter="onNameInputEnter($event)"
      />
      <!-- 使用el-collapse-transition组件可以实现折叠和展开效果 -->
      <!-- autosize指定最小行数和最大行数 -->
      <el-collapse-transition>
        <div v-show="showExtra || note.length > 0">
          <el-input class="remark" type="textarea" placeholder="备注"
                    :autosize="{ minRows: 1, maxRows: 5 }"  
                    @click.stop="onClickSpan" v-model="cacheData.note" ref="refNoteInput">
          </el-input>
        </div>
      </el-collapse-transition>
      <el-collapse-transition>
        <div v-if="showExtra" class="other-info">
          <todo-date-picker v-model="cacheData.date" />
          <todo-time-picker
            class="label-right"
            v-model="cacheData.timer"
            :style="`display: ${cacheData.date ? 'block' : 'none'} `"
          />
          <div class="label-layout label label-right">#</div>
          <div class="label-layout flag label-right" @click="cacheData.isFlag = !cacheData.isFlag">
            <img :src="`src/assets/svg/ic_flag${isFlag ? '_selected' : ''}.svg`" alt="">
          </div>
        </div>
      </el-collapse-transition>
      <template v-if="!showExtra && !showAdd && extraTime" >
        <div class="extra_content">
          <span v-if="extraTypeName">{{ extraTypeName }}</span>
          <span v-if="extraTime"  :class="extraContentClass" @click.stop="onClickSpan">{{ extraTime }}</span>
        </div>
      </template>
      <div class="divider" v-show="!showAdd"/>
    </div>
  </div>
</template>

<script setup>
import { reactive, watch, ref, computed} from "vue";
import { defineAttrFromProps } from "@/utils/vueUtils";
import TodoDatePicker from "@/components/edit/TodoDatePicker.vue";
import TodoTimePicker from "@/components/edit/TodoTimePicker.vue";
import { getSpecialDateStr,isExpire } from "@/utils/timeUtils";

const refNameInput = ref(null)

const props = defineProps({
  name: {
    type: String,
    required: true,
    default: ''
  },
  note: {
    type: String,
    default: "",
  },
  date: {
    type: String,
    default: "",
  },
  timer: {
    type: String,
    default: "",
  },
  isFlag: {
    type: Boolean,
    default: false,
  },
  done: {
    type: Boolean,
    default: false,
  },
  showExtra: {
    type: Boolean,
    default: false,
  },
  typeName: {
    type: String,
    default: '',
  },
  addInfo: {
    type: Object,
  },
  showAdd: {
    type: Boolean,
    default: false,
  },
});
const emit = defineEmits([
  "update:name",
  "update:note",
  "update:date",
  "update:timer",
  "update:isFlag",
  "update:done",
  "update:showExtra",
]);

const cacheData = reactive({
  name: props.addInfo ? props.addInfo.name : props.name,
  note: props.addInfo ? props.addInfo.note : props.note,
  date: props.date,
  timer: props.addInfo ? props.addInfo.timer : props.timer,
  isFlag: props.addInfo ? props.addInfo.isFlag : props.isFlag,
  done: props.addInfo ? props.addInfo.done : props.done,
});

//让cacheData的值随props传的值改变而改变
function watchProps(key) {
  watch(() => props[key], (newValue) => { cacheData[key] = newValue;});
}

watchProps("name");
watchProps("note");
watchProps("date");
watchProps("isFlag");
watchProps("done");

//定义属性
function defineAttr(key, notifyChange = true) {
  return defineAttrFromProps(props, emit, key, notifyChange ? 'itemChange' : null)
}

const showExtra = defineAttr('showExtra', false)
// console.log('showExtra',showExtra);

//监听showExtra属性
watch(() => props.showExtra,(show) => {
    if (show) {
      console.log("aaa");
      if (!isFocused()) {
        // 只有当前todoItem、没有焦点时才聚焦到name
        refNameInput.value.focus();
      }
    } else {
      for (const key in cacheData) {
        if (props[key] === cacheData[key]) {
          continue;   //执行到当前循环就结束，继续下一个循环
        }
        console.log("key", cacheData[key]);
        emit("update:" + key, cacheData[key]);    //更新数据
      }
    }
  }
);

//点击输入框
function onClickSpan() {
  showExtra.value = true
}

// 输入框回车
function onNameInputEnter(ev) {
  if (ev.isComposing) {   //判断是否正在进行中文输入
    return
  }
  showExtra.value = false
}

//当前todoItem是否有焦点
function isFocused() {
  // document.activeElement获取焦点元素
  let activeElement = document.activeElement;    
  return activeElement && refNameInput.value === activeElement;
}

//提醒事项的时间
const extraTime = computed(() => {
  if (!cacheData.date) {
    return ''
  }
  let dateStr = getSpecialDateStr(cacheData.date)
  if (!dateStr) {
    dateStr = cacheData.date
  }
  if (cacheData.timer) {
    return dateStr + ' ' + cacheData.timer
  }
  return dateStr
})

//提醒事项对应的列表名称
const extraTypeName = computed(() => {
  if (!props.typeName) {
    return ''
  }
  if (cacheData.name) {
    return props.typeName + ' - '
  } else {
    return props.typeName
  }
})

// 判断提醒事项设置的事件是否在有效期内
const extraContentClass = computed(() => {
  let expire = isExpire(cacheData.date, cacheData.timer)
  return { expire }
})

//监听done属性
watch(() => cacheData.done, (done) => {
  if (!showExtra.value) {
    emit('update:done', done)
  }
})
</script>

<style scoped lang="scss">
.edit-item-root {
  display: flex;

  .add {
    margin: 7px 16px 0;
    position: relative;
    cursor: pointer; //鼠标光标设置为手
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background-color: var(--todo-gray3);

    &:active {
      background-color: #9b9b9b;
    }

    .line {
      position: absolute;
      left: 50%;
      top: 50%;
      background-color: white;

      &.line-x {
        width: 10px;
        height: 2px;
        margin-left: -5px;
        margin-top: -1px;
      }

      &.line-y {
        width: 2px;
        height: 10px;
        margin-left: -1px;
        margin-top: -5px;
      }
    }
  }

  .radio {
    margin: 7px 16px 0;
    position: relative;
    cursor: pointer;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    user-select: none;
    border: 1px solid var(--todo-blue);
    display: block;

    input {
      position: absolute;
      opacity: 0;
      cursor: pointer;
      height: 0;
      width: 0;
    }

    .checkmark {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;

      &:after {
        content: "";
        position: absolute;
        top: 20%;
        left: 20%;
        background-color: var(--todo-blue);
        width: 60%;
        height: 60%;
        border-radius: 50%;
        transform: scale(0);
        transition: 100ms ease;
      }
    }
  }

  .radio input:checked ~ .checkmark:after {
    transform: scale(1);
  }

  .info-layout {
    flex: 1;
    display: flex;
    flex-direction: column;
    font-size: 13px;

    .input-item,
    :deep(.el-textarea__inner) {
      display: inline-block;
      background: none;
      border: none;
      outline: none;
      line-height: 18px;
      width: 100%;
      font-size: inherit;
      padding: 0;

      &::placeholder {
        font-size: inherit;
        color: var(--todo-gray2);
        border: none;
        outline: none;
        box-shadow: none;
      }

      &.name {
        color: var(--todo-black1);
        height: 18px;
        margin-top: 7px;
      }
    }

    :deep(.el-textarea__inner) {
      color: var(--todo-gray4);
      resize: none;
      box-shadow: none;
    }

    .other-info {
      margin-top: 2px;
      height: 22px;
      display: flex;
      font-size: inherit;

      .label-layout {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 22px;
        padding: 0 6px;
        background-color: var(--todo-bg-label);
        border-radius: 4px;
        color: #2c3e50;

        &.label {
          color: var(--el-input-placeholder-color);
        }

        &.flag {
          padding: 0 3px;

          img {
            width: 14px;
            height: 14px;
          }
        }
      }

      .label-right {
        margin-left: 8px;
      }
    }

    .extra_content {
      height: 18px;
      font-size: inherit;
      color: var(--el-text-color-placeholder);

      .expire {
        color: #fb4743;
      }
    }

    .divider {
      height: 1px;
      width: 100%;
      background-color: var(--divider-gray2);
      margin-top: 6px;
    }
  }
}
</style>