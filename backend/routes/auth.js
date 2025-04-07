const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const logger = require('../logger');
const router = express.Router();
const prisma = new PrismaClient();

// Проверяем JWT_SECRET
console.log('JWT_SECRET in auth.js:', process.env.JWT_SECRET);

// Middleware для проверки роли Admin
const isAdmin = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) {
    logger.warn('Request to protected route without token');
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded.roles.includes('Admin')) {
      logger.warn(`User ${decoded.id} attempted admin action without Admin role`);
      return res.status(403).json({ error: 'Admin access required' });
    }
    req.user = decoded;
    next();
  } catch (error) {
    logger.error(`Invalid token: ${error.message}`);
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Регистрация пользователя
router.post('/register', async (req, res) => {
  const { login, password, name, roleId, user1CId } = req.body; // Добавляем user1CId
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const existingUsers = await prisma.user.count();

    if (existingUsers === 0) {
      const user = await prisma.user.create({
        data: {
          login,
          password: hashedPassword,
          name,
          roles: {
            connect: { name: 'Admin' },
          },
        },
        include: { roles: true, user1C: true }, // Добавляем user1C в ответ
      });
      logger.info(`First admin user created: ${login}`);
      return res.status(201).json(user);
    }

    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) {
      logger.warn('Attempt to register user without token');
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded.roles.includes('Admin')) {
      logger.warn(`User ${decoded.id} attempted to register without Admin role`);
      return res.status(403).json({ error: 'Admin access required' });
    }

    if (!roleId) {
      logger.warn(`Admin ${decoded.id} attempted to register user without role`);
      return res.status(400).json({ error: 'Role is required for non-admin users' });
    }

    // Подготавливаем данные для создания пользователя
    const userData = {
      login,
      password: hashedPassword,
      name,
      roles: {
        connect: { id: parseInt(roleId) },
      },
    };

    // Если user1CId указан и не пустой, устанавливаем связь
    if (user1CId && user1CId !== '') {
      userData.user1C = {
        connect: { id: parseInt(user1CId) },
      };
    }

    const user = await prisma.user.create({
      data: userData,
      include: { roles: true, user1C: true }, // Добавляем user1C в ответ
    });
    logger.info(`New user created by admin ${decoded.id}: ${login} with roleId ${roleId}`);
    res.status(201).json(user);
  } catch (error) {
    logger.error(`Registration failed for ${login}: ${error.message}`);
    res.status(400).json({ error: 'User already exists or invalid data' });
  }
});

// Логин
router.post('/login', async (req, res) => {
  const { login, password } = req.body;
  const user = await prisma.user.findUnique({
    where: { login },
    include: { roles: true },
  });

  if (!user || !(await bcrypt.compare(password, user.password))) {
    logger.warn(`Failed login attempt for ${login}`);
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const accessToken = jwt.sign(
    { id: user.id, roles: user.roles.map((r) => r.name) },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );

  const refreshToken = jwt.sign(
    { id: user.id },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );

  res.json({ accessToken, refreshToken });
});

// Обновление токена
router.post('/refresh', async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(401).json({ error: 'No refresh token provided' });

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: { roles: true },
    });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const accessToken = jwt.sign(
      { id: user.id, roles: user.roles.map((r) => r.name) },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );
    res.json({ accessToken });
  } catch (error) {
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});

// Проверка текущего пользователя
router.get('/me', async (req, res) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: { roles: true },
    });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

module.exports = router;