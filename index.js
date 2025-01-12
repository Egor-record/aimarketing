require('dotenv').config();

const { initTelegramBot } = require('./telegram.js');
const { connectDB } = require('./db.js');

connectDB().then(()=>{
    initTelegramBot();
}).catch(console.dir);



console.log('Application started');