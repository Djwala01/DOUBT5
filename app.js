const express = require('express')
const path = require('path')

const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const app = express()
app.use(express.json())

const dbPath = path.join(__dirname, 'todoApplication.db')

let db = null

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server Running at http://localhost:3000/')
    })
  } catch (e) {
    console.log(`DB Error: ${e.message}`)
    process.exit(1)
  }
}

initializeDBAndServer()

const getStatus = requestQuery => {
  return requestQuery.status !== undefined
}
const getPriority = requestQuery => {
  return requestQuery.priority !== undefined
}
const getStatusPriority = requestQuery => {
  return requestQuery.status && requestQuery.priority !== undefined
}

//API 1

app.get('/todos/', async (request, response) => {
  let data = null
  let getQuery = ''
  const {search_q = '', priority, status} = request.query

  switch (true) {
    case getStatus(request.query):
      getQuery = `SELECT * FROM todo
    WHERE todo LIKE "%${search_q}%"
    AND status="${status}"`
      break
    case getPriority(request.query):
      getQuery = `SELECT * FROM todo
    WHERE todo LIKE "%${search_q}%"
    AND priority="${priority}"`
      break
    case getStatusPriority(request.query):
      getQuery = `SELECT * FROM todo
    WHERE todo LIKE "%${search_q}%"
    AND status="${status}"
    AND priority="${priority}"`
      break
    default:
      getQuery = `SELECT * FROM todo
    WHERE todo LIKE "%${search_q}%";`
  }

  data = await db.all(getQuery)
  response.send(data)
})

//API 2
app.get('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const getQuery = `SELECT * FROM todo
  WHERE id=${todoId}`
  const result = await db.get(getQuery)
  response.send(result)
})

//API 3
app.post('/todos/', async (request, response) => {
  const {id, todo, priority, status} = request.body
  const postQuery = `INSERT INTO todo(id,todo,priority,status)
  VALUES(${id},"${todo}","${priority}","${status}");`
  const result = await db.run(postQuery)
  response.send('Todo Successfully Added')
})

//API 4
app.put('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  let updateColumn = ''
  const requestBody = request.body
  switch (true) {
    case requestBody.status !== undefined:
      updateColumn = 'Status'
      break
    case requestBody.priority !== undefined:
      updateColumn = 'Priority'
      break
    case requestBody.todo !== undefined:
      updateColumn = 'Todo'
      break
  }
  const TodoQuery = `
    SELECT
      *
    FROM
      todo
    WHERE 
      id = ${todoId};`
  const todolist = await db.get(TodoQuery)
  const {
    todo = todolist.todo,
    priority = todolist.priority,
    status = todolist.status,
  } = request.body
  const putQuery = `UPDATE todo
  SET
    todo="${todo}",
    priority="${priority}",
    status="${status}"
  WHERE id=${todoId}`

  await db.run(putQuery)
  response.send(`${updateColumn} Updated`)
})

//API 5
app.delete('todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const deleteQuery = `DELETE FROM todo
  WHERE id=${todoId};`
  await db.run(deleteQuery)
  response.send('Todo Deleted')
})

module.exports = app
