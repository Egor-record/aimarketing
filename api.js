const express = require('express');
const cors = require('cors');
const { getAllUsers } = require('./db.js')

const initAPI = () => {
  const app = express();
  const PORT = 3700;
  app.use(cors());
  const apiRouter = express.Router();

  app.use(express.json());

  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });

  apiRouter.get('/users', async (_,res) => {
    const users = await getAllUsers()
    res.status(200).json(users);
  });

  app.use('/api/v1', apiRouter);
}

module.exports = { initAPI };