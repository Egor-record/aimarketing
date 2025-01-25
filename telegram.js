require('dotenv').config();
const fetch = require('node-fetch');
const TelegramBot = require('node-telegram-bot-api');
const { generateMsgToAI, downloadImg, sendImageToAI, deleteImg } = require('./processing.js');
const { getUser, createUser, addServiceToUser, setTokens, createLog, getLogs } = require('./db.js')
const { isUserPaid, isUserHasTokens, isUserSuperAdmin, getUserSettings } = require('./user.js')


const initTelegramBot = () => {
    const bot = new TelegramBot(process.env.TELEGRAM_BOT, { polling: true });

    bot.on('message', async (msg) => {
        if (!msg.text) {
            return 
        }
        const chatId = msg.chat.id;

        if (!msg.chat.username) {
            bot.sendMessage(chatId, "Отсутствует имя пользователя.");
            return
        }

        const user = await getUser(msg.chat.username);
        try {
            await createUserOrService(msg, user)
        } catch (e) {
            bot.sendMessage(chatId, "Ошибка в создании пользователя.");
            return
        }

            
        if (msg.text === '/start') {
            bot.sendMessage(chatId, "Добро пожаловать!");
            return
        }
        
        if (msg.text === '/logs' && user && isUserSuperAdmin(user)) {
            try {
                const logs = await getLogs(10)
                const formattedLogs = logs.map(log => {
                    return `Telegram ID: ${log.telegramID || "Unknown"}, Created At: ${new Date(log.createdAt).toISOString()}, Error: ${log.errorMsg || "No error message"}`;
                }).join("\n");
                if (!formattedLogs) {
                    bot.sendMessage(chatId, "Нет новых логов");
                    return 
                }
                bot.sendMessage(chatId, formattedLogs);
                return
            } catch (e) {
                await createLog(String(e), user.telegramID)
                bot.sendMessage(chatId, "Ошибка в получении логов");
                return
            }
        }
            
        const isAllowed = (isUserPaid(user, "aiMarketing") && isUserHasTokens(user, "aiMarketing")) || (user && isUserSuperAdmin(user));
       
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
                        await setTokens(msg.chat.username, "aiMarketing", user["aiMarketing"].tokens - tokens)
                }
                return
            }
        } catch (e) {
            console.log(e)
            await createLog(String(e), user.telegramID)
            bot.sendMessage(chatId, "Бот чем-то недоволен!");
        }
        
        return
    });

    bot.on('photo', async (msg) => {

        if (!msg.chat.username) {
            bot.sendMessage(chatId, "Отсутствует имя пользователя");
            return
        }
        const user = await getUser(msg.chat.username);
        const urlToDownloadPick = await getUrlToPick(msg)

        const fileId = msg.photo[msg.photo.length - 1].file_id;
        const chatId = msg.chat.id;
        const service = "aiMarketing"

        const isAllowed = (isUserPaid(user, service) && isUserHasTokens(user, service)) || isUserSuperAdmin(user);        
        
        if (!isAllowed) {
            bot.sendMessage(chatId, "Кончились токены или подписка!");
            return 
        }

        try {
            await downloadImg(urlToDownloadPick, fileId);
        } catch (e) {
            console.log(e)
            bot.sendMessage(chatId, "Ошибка скачивания картинки.");
            await createLog(String(e), user.telegramID)
            return
        }

        try {
            const { message, tokens } = await sendImageToAI(fileId, msg.caption )
            if (!message) {
                bot.sendMessage(chatId, "Бот чем-то недоволен!");
                return
            }
            bot.sendMessage(chatId, message);
            if (typeof user[service].tokens === 'number' && 
                    !isNaN(user[service].tokens) &&
                    typeof tokens === 'number' && !isNaN(tokens)) {
                await setTokens(msg.chat.username, service, user[service].tokens - tokens)
            }
            return

        } catch (e) {
            console.log(e)
            bot.sendMessage(chatId, "Бот чем-то недоволен!");
            await createLog(String(e), user.telegramID)
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
        try {
            await createUser({
                telegramID: msg.chat.username,
                role: 3,
                createData: new Date(),
                aiMarketing: aiMarketingData
            })
        } catch (e) {
            await createLog(String(e), msg.chat.username)
            throw new Error(e)
        }

    } else if (!user.aiMarketing) {
        try {
            await addServiceToUser(msg.chat.username, "aiMarketing", aiMarketingData)
        } catch (e) {
            await createLog(String(e), msg.chat.username)
            throw new Error(e)
        }
    }
}

module.exports = { initTelegramBot };