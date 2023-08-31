const mongoose = require('mongoose')
const Schema = mongoose.Schema

mongoose.connect('mongodb://localhost:27017/todo')
  .then((res) => {
    console.log('成功');
  })
  .catch((err) => {
    console.log('失败');
  })

const TodoSchema = new Schema(
  {
    id: Number,
    name: String,
    date: {
      type: String,
      required: true
    }
  }
)

const Todo = mongoose.model('Todo', TodoSchema)


module.exports = Todo