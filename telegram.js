require('dotenv').config();
const fetch = require('node-fetch');
const TelegramBot = require('node-telegram-bot-api');
const { generateMsgToAI, downloadImg, sendImageToAI, deleteImg } = require('./processing.js');
const { getUser, createUser, addServiceToUser, setTokens } = require('./db.js')
const { isUserPaid, isUserHasTokens, isUserSuperAdmin, getUserSettings } = require('./user.js')


const initTelegramBot = () => {
    const bot = new TelegramBot(process.env.TELEGRAM_BOT, { polling: true });

    bot.on('message', async (msg) => {
        if (!msg.text) {
            return 
        }
        const chatId = msg.chat.id;
        const user = await getUser(msg.chat.username);
        await createUserOrService(msg, user)
            
        if (msg.text === '/start') {
            bot.sendMessage(chatId, "Добро пожаловать!");
            return
        } 
            
        const isAllowed = (await isUserPaid(msg.chat.username, "aiMarketing") && await isUserHasTokens(msg.chat.username, "aiMarketing")) || (user && isUserSuperAdmin(user));

        if (!isAllowed) {
            bot.sendMessage(chatId, "Кончились токены или подписка!");
            return
        } 
        const settings = getUserSettings(user, "aiMarketing");

        if (!settings.model) {
            bot.sendMessage(chatId, "Не могу загрузить настройки!");
            return 
        }

        try {
            const { message, tokens } = await generateMsgToAI(msg.text, settings);
            if (message) {
                bot.sendMessage(chatId, message);
                if (typeof user["aiMarketing"].tokens === 'number' && 
                    !isNaN(user["aiMarketing"].tokens) &&
                    typeof tokens === 'number' && !isNaN(tokens)) {
                        await setTokens(msg.chat.username, "aiMarketing", user[service].tokens - tokens)
                }
                return
            }
        } catch (e) {
            console.log(e)
            bot.sendMessage(chatId, "Бот чем-то недоволен!");
        }
        
        return
    });

    bot.on('photo', async (msg) => {
        const user = await getUser(msg.chat.username);

        const urlToDownloadPick = await getUrlToPick(msg)

        const fileId = msg.photo[msg.photo.length - 1].file_id;
        const chatId = msg.chat.id;

        const isAllowed = (await isUserPaid(msg.chat.username, "aiMarketing") && await isUserHasTokens(msg.chat.username, "aiMarketing")) || isUserSuperAdmin(user);        
        
        if (!isAllowed) {
            bot.sendMessage(chatId, "Кончились токены или подписка!");
            return 
        }

        try {
            await downloadImg(urlToDownloadPick, fileId);
        } catch (e) {
            console.log(e)
            bot.sendMessage(chatId, "Ошибка скачивания картинки.");
            return
        }

        try {
            const { message, tokens } = await sendImageToAI(fileId, msg.text )
            if (!message) {
                bot.sendMessage(chatId, "Бот чем-то недоволен!");
                return
            }
            bot.sendMessage(chatId, message);
            if (typeof user[service].tokens === 'number' && 
                    !isNaN(user[service].tokens) &&
                    typeof tokens === 'number' && !isNaN(tokens)) {
                await setTokens(msg.chat.username, "aiMarketing", user[service].tokens - tokens)
            }
            return

        } catch (e) {
            bot.sendMessage(chatId, "Бот чем-то недоволен!");
            return
        } finally {
            deleteImg(fileId);
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

const createUserOrService = async (msg, user) => {
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
}

module.exports = { initTelegramBot };