const express = require('express');
const path = require('path');
const cors = require('cors');

const authRoutes = require('./routes/login')
const userRoutes = require('./routes/users')
const settingsRouter = require('./routes/settings')

const authMiddleware = require('./authMiddleware');

const PORT = process.env.PORT || 3700;
const URLS = {
  API_PATH: '/api/v1',
  SETTINGS_PATH: '/settings',
  FRONT_PATH: '../front/ai-admin/dist'
}

const initAPI = () => {
  const app = express();
  app.use(cors());

  app.use(express.json());
  app.set('view engine', 'ejs');
  app.set('views', path.join(__dirname, '../front/settings'));

  app.use(URLS.API_PATH, authRoutes); 
  app.use(URLS.SETTINGS_PATH, settingsRouter )
  app.use(URLS.API_PATH, authMiddleware, userRoutes);


  app.use(express.static(path.join(__dirname, URLS.FRONT_PATH)));

  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, URLS.FRONT_PATH, 'index.html'));
  });

  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
}

module.exports = { initAPI };