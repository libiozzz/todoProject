var express = require('express');
var router = express.Router();

const Todo = require('../model/todos')

//添加Todo
router.post('/todos', function (req, res, next) {
  const datas = req.body
  Todo.create(datas).then(res => {
    console.log('添加todo成功！');
  }).catch(err => {
    console.log(err);
  })
});

//删除Todo
router.post('/delete', function (req, res, next) {
  const datas = req.body
  Todo.deleteOne(datas)
    .then(res => {
      console.log('删除todo成功！');
    })
    .catch(err => {
      console.log(err);
    })
});

//查询todos
router.get('/getTodos', function (req, res, next) {
  Todo.find({})
    .sort({ date: 1})  //升序
    .skip(0)
    .then((r) => {
      console.log(r);
      res.send(r)   //返回拿到的数据
    });
});

module.exports = router;
