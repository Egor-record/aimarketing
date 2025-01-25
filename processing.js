const path = require('path');
const request = require('request');
const fs = require('fs');
const { format } = require('date-fns');
const { ru } = require('date-fns/locale/ru');
const { encode } = require("gpt-tokenizer");
const { sendMessageToAI, sendPicToAI } = require('./ai.js');
const { createLog } = require('./db.js')

const MAX_LENGTH = 500;

const generateMsgToAI = async (msgText, settings) => {
    if (!isLengthValid(msgText)) return { message: 'Слишком длинное сообщение!', tokens: 0 }

    const messages = [{
        content: msgText,
        role:  "user"
    }]

    let tokensUsed = countTokens(messages)
    let response = "";

    try {
        response = await sendMessageToAI(messages, settings)
    } catch (e) {
        console.log(e);
        await createLog(String(e))
        return { message: "Бот пока занят и не отвечает. Но мы работаем над этим.", tokens: tokensUsed }
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

    if (!isLengthValid(msgText)) return { message: 'Слишком длинное описание к картинке!', tokens: 0 }

    const base64Image = convertIMGtoBase64(path.join(__dirname, `/pictures/${fileId}.jpg`));

    const messages = [{
        role: "system", 
        content: "You are a friendly and helpful assistant. Respond as concisely as possible. Try to keep your answers brief and no longer than 200 characters."
    },{
        role: "user",
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
        return { message: "Бот пока занят и не отвечает. Но мы работаем над этим.", tokens: tokensUsed }
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

module.exports = { generateMsgToAI, downloadImg, deleteImg, sendImageToAI, beatifyDate };