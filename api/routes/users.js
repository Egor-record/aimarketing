
const express = require('express');
const { getAllUsers } = require('../../db');


const router = express.Router();

router.get('/users', async (req, res) => {
  const users = await getAllUsers();
  res.status(200).json(users);
});


module.exports = router;