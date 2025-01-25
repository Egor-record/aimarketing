const express = require('express');
const path = require('path');
const cors = require('cors');

const authRoutes = require('./routes/login')
const userRoutes = require('./routes/users')

const authMiddleware = require('./authMiddleware');

const PORT = process.env.PORT || 3700;
const API_PATH = '/api/v1';
const FRONT_PATH = '../front/ai-admin/dist'

const initAPI = () => {
  const app = express();
  app.use(cors());

  app.use(express.json());

  app.use(API_PATH, authRoutes); 
  app.use(API_PATH, authMiddleware, userRoutes); 

  app.use(express.static(path.join(__dirname, FRONT_PATH)));

  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, FRONT_PATH, 'index.html'));
  });

  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
}

module.exports = { initAPI };