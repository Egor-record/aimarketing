require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const { generateMsgToAI } = require('./bot.js');

const initTelegramBot = () => {
    const bot = new TelegramBot(process.env.TELEGRAM_BOT, { polling: true });

    bot.on('message', async (msg) => {
        const chatId = msg.chat.id;
        if (msg.text) {
            const response = await generateMsgToAI(msg.text);
            if (response) {
                bot.sendMessage(chatId, response);
            }
        }
    });

    console.log('Telegram bot initialized');
}

module.exports = { initTelegramBot };