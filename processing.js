const path = require('path');
const request = require('request');
const fs = require('fs');
const fetch = require('node-fetch');
const { format } = require('date-fns');
const { ru } = require('date-fns/locale/ru');
const { encode } = require("gpt-tokenizer");
const { sendMessageToAI, sendPicToAI, sendMessageToAssistant } = require('./ai.js');
const { createLog, 
        createSettingsLink, 
        getSettingsLinkByTelegramID, 
        deleteSettingsLink, 
        getSettingsLinkByID 
    } = require('./db.js');
const { ERROR_MSG, ROLES } = require('./consts.js');

const MAX_LENGTH = 500;
const MAX_RESPONSE_LENGTH = 200;

const PROMPTS = {
    systemMsg: `You are a friendly and helpful assistant. Respond as concisely as possible. Try to keep your answers brief and no longer than ${MAX_RESPONSE_LENGTH} characters.`
}

const generateMsgToAI = async (msgText, settings) => {
    if (!isLengthValid(msgText)) return { message: ERROR_MSG.tooLongMsg, tokens: 0 }

    const messages = [{
        content: msgText,
        role:  ROLES.user
    }]

    let tokensUsed = countTokens(messages)
    let response = "";

    try {
        response = await sendMessageToAI(messages, settings)
    } catch (e) {
        console.log(e);
        await createLog(String(e))
        return { message: ERROR_MSG.botIsNotResponding, tokens: tokensUsed }
    }
    tokensUsed += countTokens([{content: response}])
    return { message: response, tokens: tokensUsed }

}

const generateMsgToAssistent = async (msgText, settings) => {
    if (!isLengthValid(msgText)) return { message: ERROR_MSG.tooLongMsg, tokens: 0 }

    const messages = [{
        content: msgText,
        role:  ROLES.user
    }]

    let tokensUsed = countTokens(messages)
    let response = "";

    try {
        response = await sendMessageToAssistant(messages, settings)
    } catch (e) {
        console.log(e);
        await createLog(String(e))
        return { message: ERROR_MSG.botIsNotResponding, tokens: tokensUsed }
    }
    tokensUsed += countTokens([{content: response}])
    return { message: response, tokens: tokensUsed }
}

const downloadImg = (url, fileId) => {
    return new Promise((resolve, reject) => {
      const pathPicFolder = path.join(__dirname, `/pictures/${fileId}.jpg`);
  
      request.head(url, (err, res, body) => {
        if (err) {
          return reject(err);
        }

        request(url)
          .pipe(fs.createWriteStream(pathPicFolder))
          .on('finish', () => resolve(pathPicFolder))
          .on('error', (error) => reject(error));
      });
    });
  };

const sendImageToAI = async (fileId, msgText) => {

    if (!isLengthValid(msgText)) return { message: ERROR_MSG.tooLongDescribeMsg, tokens: 0 }

    const base64Image = convertIMGtoBase64(path.join(__dirname, `/pictures/${fileId}.jpg`));

    const messages = [{
        role: ROLES.system, 
        content: PROMPTS.systemMsg
    },{
        role: ROLES.user,
        content: [
            { type: "text", text: msgText },
            {
                type: "image_url",
                image_url: {
                    url: `data:image/jpeg;base64,${base64Image}`,
                    detail: "low",
                },
            },
        ],
    }];  
    
    let tokensUsed = countTokens(messages)
    let response = "";
    try {
        response = await sendPicToAI(messages)
    } catch (e) {
        console.log(e);
        await createLog(String(e))
        return { message: ERROR_MSG.botIsNotResponding, tokens: tokensUsed }
    }

    tokensUsed += countTokens([{content: response}])
    return { message: response, tokens: tokensUsed }
}

const isLengthValid = (msg) => {
    return msg.length <= MAX_LENGTH
}

const deleteImg = (fileId) => {
    const pathPicFolder = path.join(__dirname, `/pictures/${fileId}.jpg`)
    fs.unlink(pathPicFolder, async (err) => {
        if (err) {
            if (err.code === 'ENOENT') {
                console.error('File not found, unable to delete:', pathPicFolder);
                await createLog('File not found, unable to delete: ' + pathPicFolder)
            } else {
                console.error('Error deleting file:', err);
                await createLog('Error deleting file: ' + err)
            }
        } else {
            console.log('File successfully deleted:', pathPicFolder);
        }
    });
}

const countTokens = (messages) => {
    let totalTokens = 0;
    for (const message of messages) {
      if (message.role) { totalTokens += encode(message.role).length }
      if (Array.isArray(message.content)) {
        for (const item of message.content) {
            if (item.type === "text" && item.text) {
              totalTokens += encode(item.text).length;
            } else if (item.type === "image_url" && item.image_url) {
              totalTokens += encode(JSON.stringify(item.image_url)).length;
            }
          }
      } else if (typeof message.content === "string") {
        totalTokens += encode(message.content).length
      }
    }
    return totalTokens
}

const convertIMGtoBase64 = (imagePath) => {
    const imageBuffer = fs.readFileSync(imagePath);
    return imageBuffer.toString("base64");
}

const beatifyDate = (originalDate) => {
    const date = new Date(originalDate);
    return format(date, 'dd MMMM yyyy года', { locale: ru });
}

const getSettingsID = async (telegramID, service) => {
    let link = await getSettingsLinkByTelegramID(telegramID, service)
    if (link) {
      await deleteSettingsLink(telegramID, service)
    }
    link =  await createSettingsLink(telegramID, service)
    if (link.success) return link.id
    return false
}

const isSettingLinkValid = async ( telegramID, id, service) => {
    const link = await getSettingsLinkByID(telegramID, id, service)
    if (!link || !link.createdAt) return false
    // if (new Date(link.createdAt).getTime() < Date.now() - 5 * 60 * 1000) {
    //     return false
    // }
    return !!link
}

const getUrlToPick = async (msg) => {
    const amoutOfPhotos = msg.photo.length
    const fileId = msg.photo[amoutOfPhotos - 1].file_id;
    const res = await fetch(
          `https://api.telegram.org/bot${BOT_SETTING.botToken}/getFile?file_id=${fileId}`);
    const res2 = await res.json();
    const filePath = res2.result.file_path;
    return `https://api.telegram.org/file/bot${BOT_SETTING.botToken}/${filePath}`;
}

module.exports = { 
    generateMsgToAI, 
    downloadImg, 
    deleteImg, 
    sendImageToAI, 
    beatifyDate, 
    getUrlToPick, 
    getSettingsID, 
    isSettingLinkValid,
    generateMsgToAssistent
};