const express = require('express')
const app = express()
const APP_PORT = 8080

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(APP_PORT, () => {
  console.log(`Running app at port:${APP_PORT}`)
})