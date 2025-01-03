require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const bot = new TelegramBot(process.env.TELEGRAM_BOT, { polling: false });

bot.on('message', (msg) => {
    const chatId = msg.chat.id; // Extract the chat ID from the message object
    bot.sendMessage(chatId, 'Hello! You wrote to the bot. The chat ID: ' + chatId);
});