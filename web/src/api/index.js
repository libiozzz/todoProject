import axios from 'axios'

//添加todo
export const postTodo = (postData) => {
  return axios.post('http://localhost:3000/api/todos', postData)
}

//删除todo
export const deleteTodo = (deleteData) => {
  return axios.post('http://localhost:3000/api/delete', deleteData)
}