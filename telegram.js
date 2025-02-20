require('dotenv').config();

const TelegramBot = require('node-telegram-bot-api');
const { generateMsgToAI, downloadImg, sendImageToAI, deleteImg, beatifyDate, getUrlToPick, getSettingsID } = require('./processing.js');
const { getUser, createUser, addServiceToUser, setTokens, createLog, getLogs } = require('./db.js')
const { isUserPaid, isUserHasTokens, isUserSuperAdmin, getUserSettings } = require('./user.js')
const { MODELS } = require('./ai.js')

const BOT_SETTING = {
    serviceName: "aiMarketing",
    botToken: process.env.TELEGRAM_BOT,
    isPolling: true
}

const SYSTEM_MSG = {
    statistics: '/statistics',
    settings: '/settings',
    start: '/start',
    logs: '/logs'
}

const ERROR_MSG = {
    onlyTextOrPickAllowed: "Доступно только текст или картинка.",
    noUserNameProvided: "Отсутствует имя пользователя.",
    userCreatingError: "Ошибка в создании пользователя.",
    systemMsgHandlingError: "Ошибка в обработке системного сообщения.",
    noTokkenOrSubscribtion: "Кончились токены или подписка.",
    noSettingsProvided: "Не могу загрузить настройки!",
    generalError: "Ошибка в генерации сообщения",
    erorrDownloadingPick: "Ошибка скачивания картинки.",
    noNewLogs: "Нет новых логов",
    errorGettingLogs: "Ошибка в получении логов",
    errorGettingSettingsLink: "Ошибка генерации настроек"
}

const MENU_OPTIONS = {
    reply_markup: {
      keyboard: [[SYSTEM_MSG.statistics], [SYSTEM_MSG.settings]],
      resize_keyboard: true,
    },
};

const initTelegramBot = () => {
    const bot = new TelegramBot(BOT_SETTING.botToken, { polling: BOT_SETTING.isPolling });

    bot.on('message', async (msg) => {
        const chatId = msg.chat.id;
        if (!msg.text) {
            bot.sendMessage(chatId, ERROR_MSG.onlyTextOrPickAllowed);
            return 
        }

        if (!msg.chat.username) {
            bot.sendMessage(chatId, ERROR_MSG.noUserNameProvided);
            return
        }

        const user = await getUser(msg.chat.username);
        try {
            await createUserOrService(msg, user)
        } catch (e) {
            bot.sendMessage(chatId, ERROR_MSG.userCreatingError);
            return
        }

        if (isSystemMsg(msg.text)) {
            const response = await getMenuMsgsResponse(msg.text, user)
            if (response && typeof response.value === "string") {
                bot.sendMessage(chatId, response.value, { parse_mode: response.isHTML ? 'HTML' : null }); 
                return
            }
            bot.sendMessage(chatId, ERROR_MSG.systemMsgHandlingError);
            return  
        }
    
        const isAllowed = (isUserPaid(user, BOT_SETTING.serviceName) && isUserHasTokens(user, BOT_SETTING.serviceName)) || (user && isUserSuperAdmin(user));
       
        if (!isAllowed) {
            bot.sendMessage(chatId, ERROR_MSG.noTokkenOrSubscribtion);
            return
        } 
        const settings = getUserSettings(user, BOT_SETTING.serviceName);

        if (!settings.model) {
            bot.sendMessage(chatId, ERROR_MSG.noSettingsProvided);
            return 
        }

        try {
            const { message, tokens } = await generateMsgToAI(msg.text, settings);
            if (message) {
                bot.sendMessage(chatId, message);
                if (typeof user[BOT_SETTING.serviceName].tokens === 'number' && 
                    !isNaN(user[BOT_SETTING.serviceName].tokens) &&
                    typeof tokens === 'number' && !isNaN(tokens)) {
                        await setTokens(msg.chat.username, BOT_SETTING.serviceName, user[BOT_SETTING.serviceName].tokens - tokens)
                }
                return
            }
        } catch (e) {
            console.log(e)
            await createLog(String(e), user.telegramID)
            bot.sendMessage(chatId, ERROR_MSG.generalError);
        }
        
        return
    });

    bot.on('photo', async (msg) => {

        if (!msg.chat.username) {
            bot.sendMessage(chatId, ERROR_MSG.noUserNameProvided);
            return
        }
        const user = await getUser(msg.chat.username);
        const urlToDownloadPick = await getUrlToPick(msg)

        const fileId = msg.photo[msg.photo.length - 1].file_id;
        const chatId = msg.chat.id;
        const service = BOT_SETTING.serviceName

        const isAllowed = (isUserPaid(user, service) && isUserHasTokens(user, service)) || isUserSuperAdmin(user);        
        
        if (!isAllowed) {
            bot.sendMessage(chatId, ERROR_MSG.noTokkenOrSubscribtion);
            return 
        }

        try {
            await downloadImg(urlToDownloadPick, fileId);
        } catch (e) {
            console.log(e)
            bot.sendMessage(chatId, ERROR_MSG.erorrDownloadingPick);
            await createLog(String(e), user.telegramID)
            return
        }

        try {
            const { message, tokens } = await sendImageToAI(fileId, msg.caption )
            if (!message) {
                bot.sendMessage(chatId, ERROR_MSG.generalError);
                await createLog(String(e), user.telegramID)
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
            bot.sendMessage(chatId, ERROR_MSG.generalError);
            await createLog(String(e), user.telegramID)
            return
        } finally {
            deleteImg(fileId);
        }
    }); 

    console.log('Telegram bot initialized');
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
            await addServiceToUser(msg.chat.username, BOT_SETTING.serviceName, aiMarketingData)
        } catch (e) {
            await createLog(String(e), msg.chat.username)
            throw new Error(e)
        }
    }
}


const isSystemMsg = value => {
    return Object.values(SYSTEM_MSG).includes(value);
}

/**
 * @param {string} msg - The incoming message to evaluate.
 * @param {User} user - The user object containing user-specific data.
 * @returns {Promise<Object>} A promise that resolves to an object containing the response message.
 * @property {string} value - The response message to be sent.
 * @property {boolean} isHTML - Indicates whether the response message should be parsed as HTML.
 */
const getMenuMsgsResponse = async (msg, user) => {
    if (msg === SYSTEM_MSG.start) {
        return { value: 'Добро пожаловать!', isHTML: false }
    }
    
    if (msg === SYSTEM_MSG.logs && user && isUserSuperAdmin(user)) {
        try {
            const logs = await getLogs(10)
            const formattedLogs = logs.map(log => {
                return `Telegram ID: ${log.telegramID || "Unknown"}, Created At: ${new Date(log.createdAt).toISOString()}, Error: ${log.errorMsg || "No error message"}`;
            }).join("\n");
            if (!formattedLogs) {
                return { value: ERROR_MSG.noNewLogs, isHTML: false } 
            }
            return { value: formattedLogs, isHTML: false }
        } catch (e) {
            await createLog(String(e), user.telegramID)
            return { value: ERROR_MSG.errorGettingLogs, isHTML: false }
        }
    }

    if (msg === SYSTEM_MSG.settings) {
        const linkID = await getSettingsID(user.telegramID, BOT_SETTING.serviceName)
        if (!linkID) {
            return { value: ERROR_MSG.errorGettingSettingsLink, isHTML: false }
        }
        return { value: `Настройки доступны по <a href="${process.env.SITE_URL}/settings/edit?linkID=${linkID}&telegramID=${user.telegramID}&service=${BOT_SETTING.serviceName}">одноразовой ссылке</a>. Перейдите для настройки бота.`, isHTML: true }
    }

    if (msg === SYSTEM_MSG.statistics) {
        const tokensLeft = isUserHasTokens(user, BOT_SETTING.serviceName) ? '⭐ Осталось токенов: <b>' + user[BOT_SETTING.serviceName].tokens + '</b>': '🥲 Нет доступных токенов'
        const userPaid = isUserPaid(user, BOT_SETTING.serviceName) ? `📆 Подписка до: <b>${beatifyDate(user[BOT_SETTING.serviceName].paidUntil)}</b>` : '🥲 Подписка не оформлена'
        return { value: `<b>Статистика по боту:</b>
${tokensLeft}
${userPaid}

<b>Настройки:</b>
🌡 Температура запросов: <b>${user[BOT_SETTING.serviceName].temperature}</b>
🐕 Модель ИИ: <b>${MODELS[user[BOT_SETTING.serviceName].currentModel]}</b>`, isHTML: true }
    }
}

module.exports = { initTelegramBot };