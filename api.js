const express = require('express');
const path = require('path');
const cors = require('cors');
const { getAllUsers } = require('./db.js')
const PORT = 3700;

const initAPI = () => {
  const app = express();
  app.use(cors());

  const apiRouter = express.Router();

  app.use(express.json());

  apiRouter.get('/users', async (_,res) => {
    const users = await getAllUsers()
    res.status(200).json(users);
  });

  app.use('/api/v1', apiRouter);

  app.use(express.static(path.join(__dirname, '/front/ai-admin/dist')));

  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '/front/ai-admin/dist', 'index.html'));
  });

  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
}

module.exports = { initAPI };