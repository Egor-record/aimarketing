require('dotenv').config()
const OpenAI = require("openai");
const { SETTINGS } = require('./consts')

const MODELS = {
    1: 'gpt-3.5-turbo-0125',
    2: 'gpt-4o-mini'
}

const MAX_TOKENS = 1000;

const sendMessageToAI = (messages, settings) => {
    const ai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const { temperature, model } = settings
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

const sendMessageToAssistant = async (messages, settings) => {    
    if (!SETTINGS[settings.serviceName]?.assistantId) {
        throw new Error("no assistant_id provided")
    }
    const openai = new OpenAI({
      apiKey: SETTINGS[settings.serviceName]?.aiToken, 
    });
    const thread = await openai.beta.threads.create();

    try {
        await openai.beta.threads.messages.create(thread.id, messages[0]);
    } catch (e) {
        throw new Error("error opening threads")
    }
    let run;
    try {
        run = await openai.beta.threads.runs.create(thread.id, {
            assistant_id: SETTINGS[settings.serviceName]?.assistantId,
        });
    } catch (e) {
        throw new Error("error running threads:", e)
    }

    let runStatus, responseMessages;
    try { 
        do {
            runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
          } while (runStatus.status !== "completed");
      
        responseMessages = await openai.beta.threads.messages.list(thread.id);
    } catch (e) {
        throw new Error("error retrieving threads:", e)
    }

    try {
        return responseMessages.data[0].content[0].text.value
    } catch (e) {
        throw new Error("Error getting message:", e)
    }
    
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

module.exports = { sendMessageToAI, sendPicToAI, sendMessageToAssistant, MODELS };