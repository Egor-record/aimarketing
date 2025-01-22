const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { getAdmin } = require('../../db');


const router = express.Router();
const SECRET_KEY = process.env.SECRET_KEY;

router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  const user = await getAdmin(username);
  if (!user) {
    return res.status(401).json({ message: 'No user found' });
  }

  const isValid = await verifyPassword(password, user.psw);

  if (!isValid) {
    return res.status(500).json({ message: 'Wrong password' });
  }

  const token = jwt.sign({ username }, SECRET_KEY, { expiresIn: '1h' });
  res.json({ token });
});


async function verifyPassword(plainPassword, hashedPassword) {
    const isMatch = await bcrypt.compare(plainPassword, hashedPassword);
    return isMatch;
}

module.exports = router;