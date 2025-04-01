/**
 * @typedef {Object} User
 * @property {string} telegramID - The user's Telegram ID
 * @property {number} role - 1, 2, 3
 * @property {AiMarketing} aiMarketing - Whether the user is using AI marketing
 * @property {Date} createData - The date when the user was created
 * @property {Object} aibot - The AI bot configuration or details
 */

/**
 * @typedef {Object} AiMarketing
 * @property {number} chatID - The chat ID associated with the AI marketing data
 * @property {Date} paidUntil - The expiration date for the paid service
 * @property {boolean} isUsingOwnKey - Indicates if the user is using their own key
 * @property {number} currentModel - The current model in use (e.g., version number)
 * @property {number} temperature - The temperature setting for AI responses
 * @property {number} tokens - The number of tokens available for the user
 * @property {Array<any>} payments - An array of payment records 
 */

const isUserAdmin = (user) => {
    return user.role === 1 || user.role === 2
}

const isUserSuperAdmin = (user) => {
    return user.role === 1
}

const isUserHasTokens =  (user, service) => {
    if (!user || !user[service]) {
        return false;
    }
    return user[service].tokens > 0
}

const isUserPaid = (user, service) => {
    if (!user || !user[service]) {
        return false;
    }

    const now = new Date();
    const paidUntil = new Date(user[service].paidUntil);
    return paidUntil > now;
}

const getUserSettings = (user, service) => {
    if (!user || !service) {return {}}
    const settings = {
        temperature: user[service].temperature > 2 ? 2 : user[service].temperature,
        max_tokens: user[service].max_tokens || 500,
        model: user[service].model || 1,
        nMsgsToStore: user[service].nMsgsToStore || 0
    }
    return settings
}

const generateServiceData = serviceName => {
    return { 
        paidUntil: serviceName.paidUntil,
        isUsingOwnKey: false,
        currentModel: serviceName.currentModel,
        temperature: serviceName.temperature,
        tokens: serviceName.defaultTokens,
        payments: [],
        messages: [],
        nMsgsToStore: serviceName.nMsgsToStore
    }
};

module.exports = { isUserAdmin, isUserSuperAdmin, isUserHasTokens, isUserPaid, getUserSettings, generateServiceData };