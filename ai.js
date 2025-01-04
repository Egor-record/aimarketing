require('dotenv').config()
const OpenAI = require("openai");
const ai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const sendMessageToAI = (msgBody) => {

    const request = {
        model: 'gpt-3.5-turbo',
        temperature: 0,
        max_tokens: 500,
        messages: [{
            content: `I have a sentence ${msgBody}. Translate it to Dutch.`,
            role:  "user"
        }]
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

const sendPick = () => {}


module.exports = { sendMessageToAI };