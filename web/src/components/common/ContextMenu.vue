<template>
<!-- 右键列表的菜单 -->
  <div class="context-root context-root-bg" ref="root"  v-click-outside="onClickOutside"
      :style="{left : position.x + 'px', top: position.y + 'px', display: show ? 'block':'none'}" >
    <template v-for="(item, index) in menuList" :key="index">
      <!-- 分隔线 -->
      <div v-if="item === -1" class="context-divider" />
      <!-- 菜单列表 -->
      <div v-else class="context-item" @mouseenter="showSubMenu($event, index)">
        <!-- 子菜单 -->
        <template v-if="item.subMenu && item.subMenu.length > 0">
          <span>{{ item.value }}</span>
          <div class="context-arrow" />
          <div class="context-sub context-root-bg" :style="{top: subStyleList[index].top + 'px', left: subStyleList[index].left + 'px'}">
            <div class="context-item context-sub-item"  v-for="(sub, subIndex) in item.subMenu" :key="subIndex" @click="onClickSubmenuItem(index, subIndex)">
              <span >{{ sub.value }}</span>
            </div>
          </div>
        </template>
        <!-- 菜单列表 -->
        <template v-else>
          <span @click="onClickMenuItem(index)">{{ item.value }}</span>
        </template>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref,nextTick,reactive } from "vue";
const props = defineProps({
  menuList: {
    type: Array,
    required: true,
  },
});
const emit = defineEmits(['menuDismiss'])

const position = ref({x:0,y:0})  //右键菜单的位置坐标
const show = ref(false)  //控制右键菜单的显示与隐藏
const subStyleList = reactive([])   // 存放子菜单的位置坐标
for (let i = 0; i < props.menuList.length; i++) {
  // eslint-disable-next-line vue/no-setup-props-destructure
  const menuItem = props.menuList[i]
  if (menuItem.subMenu && menuItem.subMenu.length > 0) {
    subStyleList[i] = {
      top: -5,
      left: 195
    }
  }
}
console.log('坐标',subStyleList);

//关闭右键菜单
function hide(){
    show.value = false
}

//展示右键菜单
function showContextMenu(x = 0, y = 0) {
  show.value = true
  nextTick(() => {
    // 暂时只调整y值
    let height = this.$refs.root.offsetHeight
    let bodyHeight = document.body.offsetHeight
    if (y + height + 10 > bodyHeight) {
      y = bodyHeight - height - 10
    }
    // todo：这里右键以后还会触发outside，导致show=false，所以改一点点x、y值、防止触发outside
    position.value = { x: x , y: y  }
  })
}
defineExpose({ showContextMenu})

//鼠标进入菜单 显示子菜单
function showSubMenu(ev, index) {
  // todo: 精准点应该是根据当前的位置来计算top还不是对top递增递减
  let subStyle = subStyleList[index]
  let itemLayout = ev.target
  let subLayout = itemLayout.querySelector('.context-sub')
  if (subLayout) {
    let subRect = subLayout.getBoundingClientRect()
    let { offsetWidth: bodyWidth, offsetHeight: bodyHeight } = document.body
    if (subRect.bottom + 10 > bodyHeight) {     //这里的10是外边距
      // 感觉这一步骤可以不要
      // if (subRect.height - MIN_WINDOW_MARGIN > bodyHeight) {
      //   // 如果subMenu太大，保证上面能看到
      //   let itemRect = itemLayout.getBoundingClientRect()
      //   subStyle.top = MIN_WINDOW_MARGIN - itemRect.top
      // } else {

        // subMenu太靠下了，需要上移
        subStyle.top -= (subRect.bottom + 10 - bodyHeight)

      // }
    }

    if (subRect.right + 10> bodyWidth) {
      let itemRect = itemLayout.getBoundingClientRect()
      subStyle.left = -itemRect.width
    }
  }
}

//点击其他区域时，关闭右键菜单
import { vClickOutside } from "@/utils/clickOutside.js";
function onClickOutside() {
    if (!show.value) {
    return
  }
  emit('menuDismiss')
  hide()
}

//点击菜单列表
function onClickMenuItem(index) {
  hide()
  emit('menuDismiss', index)
}

//点击子菜单列表
function onClickSubmenuItem(index, subIndex) {
  hide()
  emit('menuDismiss', index, subIndex)
}

</script>

<style lang="scss" scoped>
.context-root-bg {
  padding: 5px 4px;
  background-color: #e1e1e1;
  border: 1px solid #c3c3c3;
  border-radius: 6px;
  box-shadow: 0 0 5px #d6d6d6;
}

div.context-root {
  width: 205px;
  position: fixed;
  z-index: 1000;
  //left: 250px;
  //top: 50px;

  .context-item {
    height: 21px;
    padding: 0 6px;
    border-radius: 4px;
    display: flex;
    align-items: center;
    color: var(--todo-black2);
    font-size: 13px;

    span {
      overflow: hidden;
      flex: 1;
    }

    .context-arrow {
      width: 7px;
      height: 7px;
      border-style: solid;
      border-color: var(--todo-black2);
      border-width: 2px 2px 0 0;

      transform: rotate(45deg);
      background-color: transparent;
    }

    .context-sub {
      display: none;
      max-width: 134px;
      position: absolute;   //让它相对其最近的父元素定位
      font-size: 13px;

      .context-sub-item {
        white-space: nowrap;
      }
    }

  }

  .context-item:hover {
    background-color: #58a6f8;
    color: white;

    .context-arrow {
      border-color: white;
    }

    .context-sub {
      display: block;
    }
  }

  .context-divider {
    background-color: #d2d2d2;
    width: calc(100% - 12px);
    height: 1px;
    margin: 6px;
  }

}
</style>