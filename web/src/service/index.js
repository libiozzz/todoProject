// 因为没有后端，就在这里做数据处理
import { useTypeStore } from "@/store/type";
import { TodoDoc } from "@/utils/typeUtils";

// {
//   "name": "333",
//   "colorIndex": 5,
//   "color": "#157efb",
//   "svgIndex": 0
// }
export const createType = (typeInfo) => {
  // typeInfo  { colorIndex: 1, svgIndex: 0, name: 'name1', count: 2, id: 1 },
  let res = { ...typeInfo, idList: [], doneIdList: [] }
  console.log('creatType', typeInfo, res)
  return Promise.resolve(res)   //return res （有啥区别？）
}

// 创建列表的item
export function createTodoDoc(typeId, otherInfo) {
  return new TodoDoc(useTypeStore().incrementDocId(), typeId, otherInfo)
}