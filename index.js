const dotenv = require('dotenv').config()
const express = require('express');
const socket = require('socket.io');
const chalk = require('chalk');
const app = express();
const cors = require('cors');

const port = process.env.PORT || 5577;
const server = app.listen(port, () => {
  const io = module.exports = socket(server);
  console.log(`[+] Listening on port: ${chalk.green(port)}`)

  const router = require('./routes/');
  app.use(express.json());
  app.use(cors());
  app.use('/', router)
  app.use(express.static(__dirname + '/public'));
    app.use(express.static(__dirname + '/css'));
    app.use(express.static(__dirname + '/js'));
})
