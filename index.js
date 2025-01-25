require('dotenv').config();

const { initTelegramBot } = require('./telegram.js');
const { connectDB, createLog } = require('./db.js');
const { initAPI } = require('./api/server.js')

connectDB().then(async ()=>{
    try {
        initTelegramBot();
        initAPI();
    } catch (e) {
        console.log(e)
        await createLog(String(e))
    }
}).catch(console.dir);



console.log('Application started');