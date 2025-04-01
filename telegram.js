require('dotenv').config();

const TelegramBot = require('node-telegram-bot-api');
const { generateMsgToAI, generateMsgToAssistent, downloadImg, sendImageToAI, deleteImg, beatifyDate, getUrlToPick, getSettingsID } = require('./processing.js');
const { getUser, createUser, addServiceToUser, setTokens, createLog, getLogs } = require('./db.js')
const { isUserPaid, isUserHasTokens, isUserSuperAdmin, getUserSettings, generateServiceData } = require('./user.js')
const { MODELS } = require('./ai.js')
const { BORIS_SETTING, PARTY_SETTING, MARKETING_SETTING, SYSTEM_MSG, ERROR_MSG, SETTINGS } = require('./consts.js')


const initTelegramBot = () => {
    const bots = [{
        serviceName: BORIS_SETTING.serviceName,
        bot: new TelegramBot(BORIS_SETTING.botToken, { polling: BORIS_SETTING.isPolling })
    },
    {
        serviceName: PARTY_SETTING.serviceName,
        bot: new TelegramBot(PARTY_SETTING.botToken, { polling: PARTY_SETTING.isPolling })
    },
    {
        serviceName: MARKETING_SETTING.serviceName,
        bot: new TelegramBot(MARKETING_SETTING.botToken, { polling: MARKETING_SETTING.isPolling })
    },
];

    initListeners(bots)

    console.log('Telegram bots initialized');
}

const initListeners = bots => {
    for (let botSettings of bots) {
        const { serviceName, bot } = botSettings;

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
    
            let user = await getUser(msg.chat.username);
    
            if (!user) {
                try {
                   await createNewUser(msg, serviceName)
                } catch (e) {
                    await createLog(String(e), msg.chat.username)
                    bot.sendMessage(chatId, ERROR_MSG.userCreatingError);
                    return
                }
            } else if (!user[SETTINGS[serviceName].serviceName]) {
                try {
                    const defaultData = generateServiceData(SETTINGS[serviceName])
                    await addServiceToUser(msg.chat.username, SETTINGS[serviceName].serviceName, defaultData)
                    user[SETTINGS[serviceName].serviceName] = defaultData;
                } catch (e) {
                    await createLog(String(e), msg.chat.username)
                    throw new Error(e)
                }
            }

    
            if (isSystemMsg(msg.text) && serviceName == BORIS_SETTING.serviceName ) {
                const response = await getMenuMsgsResponse(msg.text, user)
                if (response && typeof response.value === "string") {
                    bot.sendMessage(chatId, response.value, { parse_mode: response.isHTML ? 'HTML' : null }); 
                    return
                }
                bot.sendMessage(chatId, ERROR_MSG.systemMsgHandlingError);
                return  
            }
        
            const isAllowed = (isUserPaid(user, serviceName) && isUserHasTokens(user, serviceName)) || (user && isUserSuperAdmin(user));
           
            if (!isAllowed) {
                bot.sendMessage(chatId, ERROR_MSG.noTokkenOrSubscribtion);
                return
            } 
            const userSettings = getUserSettings(user, serviceName);
    
            if (!userSettings.model) {
                bot.sendMessage(chatId, ERROR_MSG.noSettingsProvided);
                return 
            }
    
            try {
                let response;
                userSettings.telegramID = msg.chat.username;
                if (serviceName === BORIS_SETTING.serviceName) {
                    userSettings.serviceName = BORIS_SETTING.serviceName
                    response = await generateMsgToAI(msg.text, userSettings);
                } else {
                    userSettings.serviceName = serviceName
                    response = await generateMsgToAssistent(msg.text, userSettings);
                }

                if (!response) {
                    bot.sendMessage(chatId, ERROR_MSG.systemMsgHandlingError);
                    return
                }

                const message = response.message;
                const tokens = response.tokens;
                
                if (message) {
                    bot.sendMessage(chatId, message);
                    if (typeof user[serviceName].tokens === 'number' && 
                        !isNaN(user[serviceName].tokens) &&
                        typeof tokens === 'number' && !isNaN(tokens)) {
                            await setTokens(msg.chat.username, serviceName, user[serviceName].tokens - tokens)
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

            if (serviceName !== BORIS_SETTING.serviceName) {
                return ERROR_MSG.onltTextAllowed
            }
    
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
    }
}


const createNewUser = async (msg, serviceName) => {    
    const userData = {
        telegramID: msg.chat.username,
        role: 3,
        createData: new Date(),
    }
    if (SETTINGS[serviceName]) {
        userData[serviceName] = {
            chatID: msg.chat.id,
            paidUntil: new Date(),
            isUsingOwnKey: false,
            currentModel: SETTINGS[serviceName].currentModel,
            temperature: SETTINGS[serviceName].temperature,
            tokens: SETTINGS[serviceName].defaultTokens,
            payments: [],
            messages: []
        };
    }
    
    await createUser(userData)
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