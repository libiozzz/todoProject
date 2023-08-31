import { postTodo } from "@/api"
import { deleteTodo } from "@/api"
import { isValid } from '@/utils/timeUtils'
let box = /todo_local_todo_/

export function saveData(key, value) {
  let todos = JSON.parse(value)
  localStorage.setItem(key, value)
  let dateStr = todos.date + ' ' + todos.timer
  if (box.test(key) && todos.date && isValid(todos.date) && !todos.done) {
    postTodo({
      id: todos.id,
      name: todos.name,
      date: dateStr
    }).then(res => {
      console.log('成功post');
    })
  }else if(box.test(key) && todos.date && isValid(todos.date) && todos.done){
    deleteTodo({
      name: todos.name,
      date: dateStr
    }).then(res => {
      console.log('成功delete');
    })
  }
}

export function getData(key) {
  return localStorage.getItem(key)
}

export function removeData(key, doc) {
  localStorage.removeItem(key)
  if (doc.id) {
    let dateStr = doc.date + ' ' + doc.timer
    deleteTodo({
      name: doc.name,
      date: dateStr
    }).then(res => {
      console.log('成功delete');
    })
  }else{
    deleteTodo({
      id: doc
    }).then(res => {
      console.log('成功delete');
    })
  }
}

export function getDataObject(key, defaultValue = null) {
  let res = getData(key)
  if (res) {
    try {
      return JSON.parse(res)
    } catch (e) {
      console.log('getData:' + key, e)
    }
  }
  return defaultValue
}



