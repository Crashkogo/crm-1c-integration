require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const userRoutes = require('./routes/users');
const authRoutes = require('./routes/auth');
const rolesRoutes = require('./routes/roles');
const partnerRoutes = require('./routes/partners'); // Новый маршрут
const app = express();
const prisma = new PrismaClient();

app.use(express.json());
app.use(cors({ origin: 'http://localhost:5173' }));
app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/roles', rolesRoutes);
app.use('/partners', partnerRoutes); // Подключаем маршрут для партнёров

app.get('/', (req, res) => {
  res.send('CRM Backend is running');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});