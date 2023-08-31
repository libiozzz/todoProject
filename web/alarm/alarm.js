const electron = require('electron')
const { ipcRenderer } = electron
//获取todos
const getTodo = async () => {
    let result = await axios.get('http://localhost:3000/api/getTodos')
    let todos = await result.data
    console.log(todos)
    return todos
}
const todos = await getTodo()
console.log(todos);
todos.forEach(ele => {
    let todoDate = new Date(ele.date).getTime()
    ipcRenderer.send('setTimer', todoDate)
});

document.querySelector('.add').addEventListener('click', () => {
    console.log('ggggggg');
    ipcRenderer.send('hideWindow')
})

