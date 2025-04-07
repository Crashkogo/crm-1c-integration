const express = require('express');
const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const logger = require('../logger');
const router = express.Router();
const prisma = new PrismaClient();

// Проверяем JWT_SECRET
console.log('JWT_SECRET in roles.js:', process.env.JWT_SECRET);

// Middleware для проверки токена
const authenticateToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) {
    logger.warn('Request to protected route without token');
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Decoded token in roles.js:', decoded); // Добавляем отладку
    req.user = decoded;
    next();
  } catch (error) {
    logger.error(`Invalid token in roles.js: ${error.message}`);
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Middleware для проверки роли Admin
const isAdmin = (req, res, next) => {
  if (!req.user.roles.includes('Admin')) {
    logger.warn(`User ${req.user.id} attempted admin action without Admin role`);
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// Получение списка ролей
router.get('/', authenticateToken, isAdmin, async (req, res) => {
  try {
    const roles = await prisma.role.findMany();
    logger.info(`User ${req.user.id} fetched list of roles`);
    res.json(roles);
  } catch (error) {
    logger.error(`Error fetching roles: ${error.message}`);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

module.exports = router;