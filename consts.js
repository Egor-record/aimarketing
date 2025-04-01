require('dotenv').config();

const BORIS_SETTING = {
    serviceName: "aiMarketing",
    botToken: process.env.TELEGRAM_BOT_BORIS,
    aiToken: process.env.OPENAI_API_KEY,
    isPolling: true,
    defaultTokens: 0,
    currentModel: 1,
    temperature: 0,
    paidUntil: new Date(),
    nMsgsToStore: 0,
}

const PARTY_SETTING = {
    serviceName: "party",
    botToken: process.env.TELEGRAM_BOT_PARTY,
    aiToken: process.env.OPENAI_API_KEY_PARTY,
    isPolling: true,
    defaultTokens: 100000,
    currentModel: 1,
    temperature: 0,
    assistantId: process.env.ASSISTANT_ID_PARTY,
    paidUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    nMsgsToStore: 5,
}

const MARKETING_SETTING = {
    serviceName: "marketing",
    botToken: process.env.TELEGRAM_BOT_MARKETING,
    aiToken: process.env.OPENAI_API_KEY_PARTY,
    isPolling: true,
    defaultTokens: 100000,
    currentModel: 1,
    temperature: 0,
    assistantId: process.env.ASSISTANT_ID_PRO_MARKET,
    paidUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    nMsgsToStore: 5,
}

const SETTINGS = {
    [BORIS_SETTING.serviceName]: BORIS_SETTING,
    [PARTY_SETTING.serviceName]: PARTY_SETTING,
    [MARKETING_SETTING.serviceName]: MARKETING_SETTING
};

const SYSTEM_MSG = {
    statistics: '/statistics',
    settings: '/settings',
    start: '/start',
    logs: '/logs'
}

const ERROR_MSG = {
    onlyTextOrPickAllowed: "Доступно только текст или картинка.",
    onltTextAllowed: "Доступен только текст",
    noUserNameProvided: "Отсутствует имя пользователя.",
    userCreatingError: "Ошибка в создании пользователя.",
    systemMsgHandlingError: "Ошибка в обработке системного сообщения.",
    noTokkenOrSubscribtion: "Кончились токены или подписка.",
    noSettingsProvided: "Не могу загрузить настройки!",
    generalError: "Ошибка в генерации сообщения",
    erorrDownloadingPick: "Ошибка скачивания картинки.",
    noNewLogs: "Нет новых логов",
    errorGettingLogs: "Ошибка в получении логов",
    errorGettingSettingsLink: "Ошибка генерации настроек",
    botIsNotResponding: "Бот пока занят и не отвечает. Но мы работаем над этим.",
    tooLongDescribeMsg: "Слишком длинное описание к картинке!",
    tooLongMsg: "Слишком длинное сообщение!"
}

const ROLES = {
    user: "user",
    system: "system"
}

module.exports = { BORIS_SETTING, PARTY_SETTING, SYSTEM_MSG, ERROR_MSG, SETTINGS, ROLES, MARKETING_SETTING };