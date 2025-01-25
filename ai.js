require('dotenv').config()
const fs = require('fs');
const OpenAI = require("openai");

const MODELS = {
    1: 'gpt-3.5-turbo-0125',
    2: 'gpt-4o-mini'
}

const MAX_TOKENS = 500;

const sendMessageToAI = (messages, settings) => {
    const ai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const { temperature, model  } = settings
    const request = {
        model: MODELS[model],
        temperature: temperature,
        max_tokens: MAX_TOKENS,
        messages: messages
    };

    return new Promise((resolve, reject) => {
        ai.chat.completions.create(request)
            .then(gptResponse => {
                resolve(gptResponse.choices[0].message.content);
            })
            .catch(error => {
                reject(error);
        });
    });
}

const sendPicToAI = (prompt) => {
    const ai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
   
    const request = {
        model: MODELS[2],
        temperature: 1,
        max_tokens: MAX_TOKENS,
        messages: prompt,
        stream: false
    };
    return new Promise((resolve, reject) => {
        ai.chat.completions.create(request)
        .then(gptResponse => {
                resolve(gptResponse.choices[0].message.content);
            })
            .catch(error => {
                reject(error.message);
        });
    })
}

module.exports = { sendMessageToAI, sendPicToAI, MODELS };