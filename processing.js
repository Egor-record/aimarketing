const path = require('path');
const request = require('request');
const fs = require('fs');
const { sendMessageToAI, sendPicToAI } = require('./ai.js');
const MAX_LENGTH = 100;

const generateMsgToAI = async (msgText) => {
    if (isLengthValid(msgText)) {
        return await sendMessageToAI(msgText)
    } else {
        return 'Слишком длинное сообщение!'
    }
}

const downloadImg = (url, fileId, callback) => {
  const pathPicFolder = path.join(__dirname, `/pictures/${fileId}.jpg`)
  request.head(url, (err, res, body) => {
    request(url).pipe(fs.createWriteStream(pathPicFolder)).on('close', callback);
  });
}

const generateAndSendImgToAI = async (fileId, msg) => {
    const { userID, msgText } = msg;
    const pathToPic = path.join(__dirname, `/pictures/${fileId}.jpg`)
    if (!userID) return 'Не можно!'

    if (msgText && !isLengthValid(msgText)) {
        return 'Слишком длинное сообщение!' 
    } else {
        return await sendPicToAI(pathToPic, msgText)
    }
}

const isLengthValid = (msg) => {
    return msg.length <= MAX_LENGTH
}

const deleteImg = (fileId) => {
    const pathPicFolder = path.join(__dirname, `/pictures/${fileId}.jpg`)
    fs.unlink(pathPicFolder, (err) => {
        if (err) {
            if (err.code === 'ENOENT') {
                console.error('File not found, unable to delete:', pathPicFolder);
            } else {
                console.error('Error deleting file:', err);
            }
        } else {
            console.log('File successfully deleted:', pathPicFolder);
        }
    });
}



module.exports = { generateMsgToAI, downloadImg, deleteImg, generateAndSendImgToAI };