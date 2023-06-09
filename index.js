const express = require('express')
const app = express()
const port = 9000
require('dotenv').config();
const cors = require('cors');

app.use(cors());
app.use(express.json());



app.get('/adminlogin', (req, res) => {
  res.send({username: process.env.USERNAME_NAME, password: process.env.PASSWORD})
})
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})

