<template>
  <div class="card-layout" :class="classObj">
    <div class="circle-icon">
      <img :src="imgSrc" alt="" />
      <span class="day" v-if="cardType === 1">{{ currentDay }}</span>
    </div>
    <span class="text">{{ showText }}</span>
    <span class="count">{{count}}</span>
  </div>
</template>

<script setup>
import {
  TYPE_TODAY,
  TYPE_TODO,
  TYPE_ALL,
} from "@/components/menu/menuConstants";
import { computed , ref } from "vue";
import dayjs from "dayjs";

const currentDay = ref(dayjs().format("D")); //获取当前的月份的日期号
//接收MenuLayout组件传来的不同的数据
const props = defineProps({
  cardType: {
    //用于区分卡片种类（今天、计划、全部）
    type: Number,
    default: TYPE_TODAY,
  },
  count: {          // 提醒事项个数
    type: Number,
    default: 0
  },
  isSelected: {
    type: Boolean,
    default: false,
  }
});

//卡片名
const showText = computed(() => {
  switch (props.cardType) {
    case TYPE_TODAY:
      return "今天";
    case TYPE_TODO:
      return "计划";
    case TYPE_ALL:
      return "全部";
    default:
      return "今天";
  }
});

//卡片的图片资源
const imgSrc = computed(() => {
  let iconName;
  if (props.cardType == TYPE_TODAY) {
    iconName = "ic_today";
  } else if (props.cardType == TYPE_TODO) {
    iconName = "ic_plan";
  } else {
    iconName = "ic_all";
  }
  return `src/assets/svg/${iconName +(props.isSelected ? '_selected' : '') }.svg`;
});

const classObj = computed(() => {
  return {
    selected: props.isSelected,
    unselected: !props.isSelected,
    today: props.cardType === TYPE_TODAY,
    plan: props.cardType === TYPE_TODO,
    all: props.cardType === TYPE_ALL,
  }
})
</script>

<style scoped lang="scss">
.card-layout {
  padding: 8px;
  border-radius: 12px;
  background-color: #cbcbcb;
  position: relative;
  color: #4c4c4c;

  .circle-icon {
    display: flex;
    justify-content: center;
    align-items: center;
    border-radius: 50%;
    width: 24px;
    height: 24px;
    position: relative;

    img {
      width: 16px;
      height: 16px;
    }

    .day {
      position: absolute;
      font-size: 12px;
      font-weight: bold;
      transform: scale(0.5);
      text-align: center;
      padding-top: 7px;
      color: white;
    }
  }

  .circle-icon.today {
    background-color: var(--todo-blue);
  }

  .text {
    font-size: 14px;
    margin-top: 2px;
    color: inherit;
    font-weight: normal;
  }

  .count {
    font-size: 16px;
    color: inherit;
    font-weight: bold;
    position: absolute;
    right: 12px;
    top: 8px;
  }
}

.card-layout.selected {
  color: white;

  .circle-icon {
    background-color: white;
  }

  .day {
    color: var(--todo-blue);
  }
}

.card-layout.today.unselected .circle-icon {
  background-color: var(--todo-blue);
}

.card-layout.plan.unselected .circle-icon {
  background-color: var(--todo-red);
}

.card-layout.all.unselected .circle-icon {
  background-color: var(--todo-gray1);
}

.card-layout.selected.today {
  background-color: var(--todo-blue);
}

.card-layout.selected.plan {
  background-color: var(--todo-red);
}

.card-layout.selected.all {
  background-color: var(--todo-gray1);
}

.card-layout:hover {
  background-color: #b7b7b7;
}
</style>