const { sendMessageToAI } = require('./ai.js');
const MAX_LENGTH = 100;

const generateMsgToAI = async (msgText) => {
    let response;
    if (!messageLegthLessThenMAX(msgText)) {
        response = await sendMessageToAI(msgText)
    } else {
        response = 'Слишком длинное сообщение!'
    }
    return response
}

const downloadImg = () => {}
const messageLegthLessThenMAX = (msg) => {
    return msg.length >= MAX_LENGTH
}
const deleteImg = () => {}

module.exports = { generateMsgToAI, downloadImg, deleteImg };