import { getDataObject, saveData, removeData } from "@/storage/index";
import { TodoDoc, TodoType } from "@/utils/typeUtils";

const KEY_TYPE_LIST = 'todo_local_storage_type_list'
const KEY_DOC_KEY = 'todo_local_todo_'

let todoTypeKeys
export function updateTypeList(typeList) {
  if (!todoTypeKeys) {
    todoTypeKeys = Object.keys(new TodoType(0, '', 0))
    console.log('todotypekeys', todoTypeKeys);
  }
  if (typeList) {
    // 只保存TodoType定义的字段：id、name、
    saveData(KEY_TYPE_LIST, JSON.stringify(typeList, todoTypeKeys))
  }
}

export function getDocById(docId) {
  return getDataObject(KEY_DOC_KEY + docId)
}

//保存doc提醒事项的信息到本地
let todoDocKeys
export function saveDoc(doc) {
  if (!todoDocKeys) {
    todoDocKeys = Object.keys(new TodoDoc(0, 0))
  }
  if (doc && doc.id) {
    saveData(KEY_DOC_KEY + doc.id, JSON.stringify(doc, todoDocKeys))
  }
}

//删除本地存储的doc提醒事项
export function delDoc(doc) {
  if (typeof doc === 'number') {     //通过右键菜单删除列表时会走这步
    removeData(KEY_DOC_KEY + doc,doc)  
  } else if (doc && doc.id) {
    removeData(KEY_DOC_KEY + doc.id,doc)
  }
}