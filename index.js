require('dotenv').config();

const { initTelegramBot } = require('./telegram.js');
const { connectDB } = require('./db.js');
const { initAPI } = require('./api.js')

connectDB().then(()=>{
    // initTelegramBot();
    initAPI();
}).catch(console.dir);



console.log('Application started');