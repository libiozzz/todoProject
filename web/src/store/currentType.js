import { defineStore } from "pinia";
import { ref, reactive, computed } from 'vue'
import {
    TODO_TYPE_ALL,
    TODO_TYPE_TODAY,
    TodoDoc,
    TYPE_ALL_ID,
    TYPE_PLAN_ID,
    TYPE_SEARCH_ID,
    TYPE_TODAY_ID,
    getDocList,
    getTypeItemById,
} from "@/utils/typeUtils";
import { getTodayStr, isBeforeToday,isToday } from "@/utils/timeUtils";

import { delDoc } from "@/storage/type.js";

export const LIST_TYPE_HEADER = 1
export const LIST_TYPE_ITEM = 2
export const LIST_TYPE_FOOTER = 3

export const useCurrentTypeStore = defineStore('currentType',
    () => {
        //定义一个空的map
        const allTodoMap = ref(new Map())
        //console.log(allTodoMap);

        //所有的todo列表
        const allTodoTypeList = ref([])

        //添加数据给alltodoMap
        function addType(type) {
            console.log('type', type);
            allTodoMap.value.set(type, [])
            console.log(allTodoMap.value.set);
        }

        const idTodoMap = computed(() => {
            let map = new Map()
            for (const [type, itemList] of allTodoMap.value.entries()) {
                map.set(type.id, itemList)   // 参数一：各个列表的id  参数二：空数组
            }
            return map
        })

        const typeMap = computed(() => {
            let map = new Map()
            for (const type of allTodoMap.value.keys()) {
                map.set(type.id, type)   //参数一：各个列表的id 参数二：各个列表的信息（数组）
            }
            return map
        })

        //当前卡片/列表的id
        const currentTypeId = ref(TODO_TYPE_TODAY)

        //当前的卡片/列表
        const item = ref(TODO_TYPE_TODAY)

        //更新currentTypeId/item信息
        const updateCurrentType = (typeItem) => {
            //console.log('传入',typeItem);
            if (typeItem) {
                currentTypeId.value = typeItem.id
                item.value = typeItem
                //console.log('item',item);
            } else {
                item.value = TODO_TYPE_ALL
                currentTypeId.value = item.value.id
            }
        }

        // 通过右键菜单删除列表
        const deleteType = (type) => {
            allTodoMap.value.delete(type)
            for (const id of type.idList) {
              delDoc(id)
            }
            for (const id of type.doneIdList) {
              delDoc(id)
            }
          }

        //初始化数据
        const loadData = () => {
            let map = new Map()
            for (const type of allTodoTypeList.value) {
                let todoList = getDocList(type)
                map.set(type, todoList)
            }
            allTodoMap.value = map
            updateCurrentType(getTypeItemById(allTodoTypeList.value, currentTypeId.value))
        }

        //EditLayout组件中的todoList数据
        const getTodayList = () => {
            let list = reactive([])
            //map对象的values方法用于获取所有键值，并存放在另一个对象中
            for (const itemList of allTodoMap.value.values()) {
                for (const item of itemList) {
                    if (item.done) {
                        continue
                    }
                    if (item.date && isBeforeToday(item.date)) {
                        item.showExtra = false
                        list.push(item)
                    }
                }
            }
            console.log('todaylist', list);
            return list
        }

        const getPlanList = () => {
            const list = []
            //定义一个空的set对象
            const daySet = new Set()

            function addExtraItem(day) {
                const headItem = {
                    sortInfo: {
                        type: LIST_TYPE_HEADER,
                        date: day
                    },
                }
                const footItem = new TodoDoc(-1, undefined)
                footItem['sortInfo'] = {
                    type: LIST_TYPE_FOOTER,
                    date: day
                }
                footItem['date'] = day  //设置默认日期
                list.push(headItem)
                list.push(footItem)
                console.log('footitem', footItem);
            }

            for (const itemList of allTodoMap.value.values()) {
                for (const todoItem of itemList) {
                    if (todoItem.date && todoItem.date) {
                        daySet.add(todoItem.date)
                        todoItem['sortInfo'] = {
                            type: LIST_TYPE_ITEM
                        }
                        //todoItem.showExtra = false
                        list.push(todoItem)
                    }
                }
            }
            let hasToday = false
            for (const day of daySet) {
                if (!hasToday) {
                    hasToday = isToday(day)
                }
                addExtraItem(day)
            }
            if (!hasToday) {
                addExtraItem(getTodayStr())
            }
            console.log('planlist', list);
            return list
        }

        const getAllList = () => {
            let list = []
            let typeIndex = 0
            for (const typeItem of allTodoTypeList.value) {
                typeItem['sortInfo'] = {
                    typeIndex,
                    type: LIST_TYPE_HEADER,
                }
                list.push(typeItem)    //列表
                const todoList = allTodoMap.value.get(typeItem)
                for (const todoItem of todoList) {
                    todoItem['sortInfo'] = {
                        typeIndex,
                        type: LIST_TYPE_ITEM
                    }
                    todoItem.showExtra = false
                    list.push(todoItem)    //提醒事项
                }
                const footItem = new TodoDoc(-1, typeItem.id)
                footItem['sortInfo'] = {
                    typeIndex,
                    type: LIST_TYPE_FOOTER,
                    typeId: typeItem.id,
                }
                list.push(footItem)    // footItem空的提醒事项
                typeIndex++
            }
            console.log('alllist', list);
            return list
        }

        const getSearchList = (key) => {
            let list = []
            let typeIndex = 0
            for (const typeItem of allTodoTypeList.value) {
              const todoList = allTodoMap.value.get(typeItem)
              let searchList = todoList.filter(item => (item.name && item.name.indexOf(key) > -1) || (item.note && item.note.indexOf(key) > -1))
              if (searchList.length > 0) {
                typeItem['sortInfo'] = {
                  typeIndex,
                  type: LIST_TYPE_HEADER,
                }
                searchList.forEach(item => {
                  item['sortInfo'] = {
                    typeIndex,
                    type: LIST_TYPE_ITEM
                  }
                })
                list.push(typeItem)
                list.push(...searchList)
              }
              typeIndex++
            }
            return list
          }

        // 向列表allTodoTypelist里面的idList添加提醒事项的id
        const addNewItem = (todoItem) => {
            let type = typeMap.value.get(todoItem.typeId)  //拿到提醒事项typeId对应的列表信息
            if (item.value.id === TYPE_TODAY_ID || item.value.id === TYPE_ALL_ID || item.value.id === TYPE_PLAN_ID) {
                allTodoMap.value.get(type).push(todoItem)
            }
            if (todoItem.done) {
                type.doneIdList.push(todoItem.id)
            } else {
                type.idList.push(todoItem.id)
            }
        }

        // 整理idList和doneList
        const toggleDoneStatus = (todoItem) => {
            let { idList, doneIdList } = typeMap.value.get(todoItem.typeId)
            let fromList, toList
            if (todoItem.done) {
                // 变为true：idList移到doneIdList
                fromList = idList
                toList = doneIdList
            } else {
                fromList = doneIdList
                toList = idList
            }
            let index = fromList.indexOf(todoItem.id)
            if (index > -1) {
                fromList.splice(index, 1)
                // idList不需要排序，所以不用算位置
                toList.push(todoItem.id)
            }
        }

        //整理卡片上显示的未完成的提醒事项个数
        const countInfo = computed(() => {
            let allCount = 0
            let planCount = 0
            let todayCount = 0
            for (const [type, itemList] of allTodoMap.value.entries()) {
                allCount += type.idList.length
                for (const item of itemList) {
                    if (item.done || !item.saved) {
                        continue
                    }
                    if (item.date) {
                        // 有日期
                        planCount++
                    }
                    if (item.date && isBeforeToday(item.date)) {
                        todayCount++
                    }
                }
            }
            return { allCount, planCount, todayCount }
        })

        //在doneList中清除已完成的doc提醒事项的id
        const delAllDoneItem = () => {
            item.value.doneIdList = []
        }

        //在idList和doneList中删除提醒事项的id
        const delTodoItem = (todoItem) => {
            let type = typeMap.value.get(todoItem.typeId)  //拿到提醒事项typeId对应的列表信息
            if (item.value.id === TYPE_TODAY_ID || item.value.id === TYPE_ALL_ID || item.value.id === TYPE_PLAN_ID || item.value.id === TYPE_SEARCH_ID) {
                const todoList = allTodoMap.value.get(type)
                let index = todoList.indexOf(todoItem)
                if (index >= 0) {
                    todoList.splice(index, 1)
                }
            }
            let index = type.idList.indexOf(todoItem.id)
            if (index > -1) {
                type.idList.splice(index, 1)
            } else {
                index = type.doneIdList.indexOf(todoItem.id)
                if (index > -1) {
                    type.doneIdList.splice(index, 1)
                }
            }
        }

        //返回数据
        return {
            allTodoMap, allTodoTypeList, idTodoMap, typeMap, currentTypeId, item, countInfo, addType, updateCurrentType, loadData,
            getTodayList, getPlanList, getAllList, addNewItem, toggleDoneStatus, delAllDoneItem, delTodoItem,getSearchList,deleteType
        }
    },
    {
        persist: {
            paths: ['currentTypeId', 'allTodoTypeList'],     //持久化存储数据
        }
    }
)