//在这里对新建的列表数据进行加工
import { defineStore } from "pinia";
import { ref } from "vue";
import { createType } from '@/service'

export const useTypeStore = defineStore('type', () => {
    const incrementId = ref(10)    //list列表的id
    const uniqueDocId = ref(100)   //列表item的id
    const addType = async (typeInfo) => {
        const type = await createType(typeInfo)
        type.id = incrementId.value++     //为什么只执行了一次？？？？？？（重新启动一个终端后 又解决了）
        console.log('incrementId', incrementId.value);
        return type
        /* 返回的type格式为 {
          color : "#157efb"
          colorIndex: 5
          doneIdList: []
          id: 28
          idList: []
          name: "8"
          svgIndex: 0 */
    }

    const incrementDocId = () => {
        return ++uniqueDocId.value
    }

    return {
        incrementId, uniqueDocId,addType,incrementDocId
    }
},
    { persist: true }   //将此模块持久化
)