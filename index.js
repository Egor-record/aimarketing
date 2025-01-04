require('dotenv').config();

const { initTelegramBot } = require('./telegram.js');

initTelegramBot();

console.log('Application started');