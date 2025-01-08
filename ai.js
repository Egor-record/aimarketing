require('dotenv').config()
const fs = require('fs');
const OpenAI = require("openai");


const sendMessageToAI = (msgBody) => {
    const ai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const request = {
        model: 'gpt-3.5-turbo-0125',
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

const sendPicToAI = (imgPath, userMSG) => {
    const ai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const convertIMGtoBase64 = (imagePath) => {
        const imageBuffer = fs.readFileSync(imagePath);
        return imageBuffer.toString("base64");
    }

    const base64Image = convertIMGtoBase64(imgPath);
    const prompt = [{
        role: "system", 
        content: "Ты дружелюбный и полезный ассистент. Ты - ChatGPT, большая языковая модель, созданная OpenAI. Отвечай максимально кратко. Постарайся, чтобы твои ответы были лаконичными и их длина была не более 100 символов."
    }];

    prompt.push({
        role: "user",
        content: [
            { type: "text", text: `${userMSG}` },
            {
                type: "image_url",
                image_url: {
                    url: `data:image/jpeg;base64,${base64Image}`,
                    detail: "low",
                },
            },
        ],
    });
   
    const request = {
        model: 'gpt-4o-mini',
        temperature: 1,
        max_tokens: 500,
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

module.exports = { sendMessageToAI, sendPicToAI };