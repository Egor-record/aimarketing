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
    if (!user[service]) {
        return false;
    }
    return user[service].tokens > 0
}

const isUserPaid = (user, service) => {
    if (!user[service]) {
        return false;
    }

    const now = new Date();
    const paidUntil = new Date(user[service].paidUntil);
    return paidUntil > now;
}

module.exports = { isUserAdmin, isUserSuperAdmin, isUserHasTokens, isUserPaid };