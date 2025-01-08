require('dotenv').config();

const { initTelegramBot } = require('./telegram.js');
const { connectDB } = require('./db.js');

connectDB().catch(console.dir);
initTelegramBot();


console.log('Application started');