require('dotenv').config()
const fs = require('fs');
const OpenAI = require("openai");

const MODELS = {
    1: 'gpt-3.5-turbo-0125',
    2: 'gpt-4o-mini'
}

const MAX_TOKENS = 500


const sendMessageToAI = (msgBody, settings) => {
    const ai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const { temperature, model  } = settings
    const request = {
        model: MODELS[model],
        temperature: temperature,
        max_tokens: MAX_TOKENS,
        messages: [{
            content: msgBody,
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
        content: "You are a friendly and helpful assistant. You are ChatGPT, a large language model created by OpenAI. Respond as concisely as possible. Try to keep your answers brief and no longer than 100 characters."
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

module.exports = { sendMessageToAI, sendPicToAI };