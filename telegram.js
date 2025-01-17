require('dotenv').config();
const fetch = require('node-fetch');
const TelegramBot = require('node-telegram-bot-api');
const { generateMsgToAI, downloadImg, generateAndSendImgToAI, deleteImg } = require('./processing.js');
const { getUser, createUser, addServiceToUser} = require('./db.js')
const { isUserPaid, isUserHasTokens, isUserSuperAdmin } = require('./user.js')


const initTelegramBot = () => {
    const bot = new TelegramBot(process.env.TELEGRAM_BOT, { polling: true });

    bot.on('message', async (msg) => {
        const chatId = msg.chat.id;
        if (msg.text) {

            let user = await getUser(msg.chat.username);
            const aiMarketingData = {
                chatID: msg.chat.id,
                paidUntil: new Date(),
                isUsingOwnKey: false,
                currentModel: 1,
                temperature: 0,
                tokens: 0,
                payments: [],
                messages: []
            }
            if (!user) {
                await createUser({
                    telegramID: msg.chat.username,
                    role: 3,
                    createData: new Date(),
                    aiMarketing: aiMarketingData
                })
            } else if (!user.aiMarketing){
                await addServiceToUser(msg.chat.username, "aiMarketing", aiMarketingData)
            }
             
            if (msg.text === '/start') {
                bot.sendMessage(chatId, "Добро пожаловать!");
            } else {
                
                const isAllowed = (await isUserPaid(msg.chat.username, "aiMarketing") && await isUserHasTokens(msg.chat.username, "aiMarketing")) || (user && isUserSuperAdmin(user));

                if (!isAllowed) {
                    bot.sendMessage(chatId, "Кончились токены или подписка!");
                } else {
                    const response = await generateMsgToAI(msg.text);
                    if (response) {
                        bot.sendMessage(chatId, response);
                    }
                }
            }
        }
    });

    bot.on('photo', async (msg) => {
        const user = await getUser(msg.chat.username);
        const downloadURL = await getUrlToPick(msg)
        const fileId = msg.photo[msg.photo.length - 1].file_id;
        const chatId = msg.chat.id;

        const isAllowed = (await isUserPaid(msg.chat.username, "aiMarketing") && await isUserHasTokens(msg.chat.username, "aiMarketing")) || isUserSuperAdmin(user);        
        
        if (!isAllowed) {
            return bot.sendMessage(chatId, "Кончились токены или подписка!");
        } else {
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
        }
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