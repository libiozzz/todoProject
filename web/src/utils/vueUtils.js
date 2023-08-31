import { computed } from "vue";

//处理属性
export const defineAttrFromProps = (props, emit, key, otherEvent = null) => {
  return computed({
    //获取属性值
    get() {      
      return props[key]   
    },
    //让props[key]随属性值改变而改变
    set(value) {
      //console.log('newV',value);
      let oldValue = props[key]
      if (value !== oldValue) {
        emit(`update:${ key }`, value)
        if (otherEvent) {
          emit(otherEvent, { key, value, oldValue})
        }
      }
    }
  })
}

export function useModel(props, emit, propName) {
  return computed({
    get() {
      return new Proxy(props[propName], {
        set(obj, name, val) {
          console.log('---', name, val)
          emit('update:' + propName, {
            ...obj,
            [name]: val,
          })
          return true
        }
      })
    },
    set(val) {
      emit(`update:${ propName }`, val)
    }
  })
}