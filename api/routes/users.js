
const express = require('express');
const { getAllUsers, setTokens, setPaidUntil } = require('../../db');


const router = express.Router();

router.get('/users', async (req, res) => {
  const users = await getAllUsers();
  res.status(200).json(users);
});

router.put('/users/:id/tokens', async (req, res) => {
  const telegramID = req.params.id; 
  const { value: tokens, service } = req.body; 

  if (!service) return res.status(400).json({ message: 'No service provided' });

  if (typeof tokens !== 'number' || isNaN(tokens)) {
    return res.status(400).json({ message: 'Invalid token amount provided' });
  }
  try {
    await setTokens(telegramID, service, tokens)
  } catch (e) {
    console.log(e)
    return res.status(500).json({ message: 'Error' });
  }

  res.status(200).json({"status" : 200});
})

router.put('/users/:id/paidUntil', async (req, res) => {
  const telegramID = req.params.id; 
  const { value : paidUntil, service } = req.body; 

  if (!service) return res.status(400).json({ message: 'No service provided' });

  if (typeof paidUntil !== 'string') {
    return res.status(400).json({ message: 'Invalid paidUntil amount provided' });
  }

  try {
    await setPaidUntil(telegramID, service, paidUntil)
  } catch (e) {
    console.log(e)
    return res.status(500).json({ message: 'Error' });
  }
  
  res.status(200).json({"status" : 200});
})

module.exports = router;