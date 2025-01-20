const express = require('express');
const path = require('path');
const cors = require('cors');

const authRoutes = require('./routes/login')
const userRoutes = require('./routes/users')

const PORT = process.env.PORT || 3700;

const initAPI = () => {
  const app = express();
  app.use(cors());

  app.use(express.json());

  app.use('/api/v1', authRoutes); 
  app.use('/api/v1', userRoutes); 

  app.use(express.static(path.join(__dirname, '../front/ai-admin/dist')));

  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../front/ai-admin/dist', 'index.html'));
  });

  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
}

module.exports = { initAPI };