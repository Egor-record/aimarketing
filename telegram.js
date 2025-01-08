require('dotenv').config();
const fetch = require('node-fetch');
const TelegramBot = require('node-telegram-bot-api');
const { generateMsgToAI, downloadImg, generateAndSendImgToAI, deleteImg } = require('./bot.js');
const { createUser, isUserExists, isUserPaid } = require('./db.js')


const initTelegramBot = () => {
    const bot = new TelegramBot(process.env.TELEGRAM_BOT, { polling: true });

    bot.on('message', async (msg) => {
        const chatId = msg.chat.id;
        if (msg.text) {
            const isUsrExists = await isUserExists(msg.chat.username);
            if (!isUsrExists) {
                await createUser({
                    chatID: msg.chat.id,
                    telegramID: msg.chat.username,
                    isAiMarketing: true,
                    role: 1,
                    createData: new Date(),
                    isPaid: true,
                    isUsingOwnKey: true,
                    currentModel: 1
                })
            }
            if (msg.text === '/start') {
                bot.sendMessage(chatId, "Добро пожаловать!");
            } else {
                const isAllowed = await isUserPaid(msg.chat.username);
                if (!isAllowed) {
                    bot.sendMessage(chatId, "Кончились токены!");
                }
                const response = await generateMsgToAI(msg.text);
                if (response) {
                    bot.sendMessage(chatId, response);
                }
            }
        }
    });

    bot.on('photo', async (msg) => {
        const downloadURL = await getUrlToPick(msg)
        const fileId = msg.photo[msg.photo.length - 1].file_id;
        const chatId = msg.chat.id;
        downloadImg(downloadURL, fileId, async () => {
            try {
                const response = await generateAndSendImgToAI(fileId, { userID:chatId, msgText: msg.text} )
                if (response && response.toString() !== "") {
                    bot.sendMessage(chatId, response);
                }
            } catch (e) {
                bot.sendMessage(chatId, "Ошибка по причине: "+e.toString());
            }
            deleteImg(fileId)
        });
    }); 

    console.log('Telegram bot initialized');
}

const getUrlToPick = async (msg) => {
    const amoutOfPhotos = msg.photo.length
    const fileId = msg.photo[amoutOfPhotos - 1].file_id;
    const res = await fetch(
          `https://api.telegram.org/bot${process.env.TELEGRAM_BOT}/getFile?file_id=${fileId}`);
    const res2 = await res.json();
    const filePath = res2.result.file_path;
    return `https://api.telegram.org/file/bot${process.env.TELEGRAM_BOT}/${filePath}`;
}

module.exports = { initTelegramBot };