const express = require('express');
const path = require('path');
const router = express.Router();
const { isSettingLinkValid } = require('../../processing');
const { getUser } = require('../../db');
const { MODELS } = require('../../ai')

const SETTINGS_PATH = '../../front/settings'

router.get('/edit', async (req, res) => {
  const { linkID, telegramID, service } = req.query;

  if (!linkID || !telegramID || !service) {
      return res.sendFile(path.join(__dirname, SETTINGS_PATH, '404.html'));
  }

  const isValid = await isSettingLinkValid(telegramID, linkID, service);

  if (isValid) {
      const user = await getUser(telegramID);
      if (!user || !user[service]) return res.sendFile(path.join(__dirname, SETTINGS_PATH, '404.html'));
      return res.render('index', { 
        temperature: user[service].temperature, 
        maxLength: 200, 
        modelSelected: user[service].currentModel, 
        isOwnKey: user[service].isUsingOwnKey, 
        key: 3452,
        keepHistory: true,
        tokens: user[service].tokens,
        secretKey: "",
      });
  }

  return res.sendFile(path.join(__dirname, SETTINGS_PATH, '404.html'));
});

router.get('/models', async (req, res) => {
  return res.status(200).json(MODELS)
})

router.get('/', async (req, res) => {
    res.sendFile(path.join(__dirname, SETTINGS_PATH, '404.html'));
});

module.exports = router;