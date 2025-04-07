const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const logger = require('../logger');
const soap = require('soap');
const axios = require('axios');
const router = express.Router();
const prisma = new PrismaClient();

// Проверяем JWT_SECRET
console.log('JWT_SECRET in users.js:', process.env.JWT_SECRET);

// URL веб-сервиса 1С из .env
const WSDL_URL = process.env.ONEC_WSDL_URL || 'http://91.202.206.121:8883/CRM_Bez/ws/IC_ReactExchange.1cws?wsdl';

// Логин и пароль для 1С из .env
const ONEC_USERNAME = process.env.ONEC_USERNAME || 'react_robot';
const ONEC_PASSWORD = process.env.ONEC_PASSWORD || 'ReactPassword123plz';

// Middleware для проверки токена
const authenticateToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) {
    logger.warn('Request to protected route without token');
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Decoded token in users.js:', decoded); // Добавляем отладку
    req.user = decoded;
    next();
  } catch (error) {
    logger.error(`Invalid token in users.js: ${error.message}`);
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

// Получение списка пользователей
router.get('/', authenticateToken, isAdmin, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      include: {
        roles: true,
        user1C: true,
      },
    });
    logger.info(`User ${req.user.id} fetched list of users`);
    res.json(users);
  } catch (error) {
    logger.error(`Error fetching users: ${error.message}`);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

// Получение списка пользователей 1С
router.get('/1c', authenticateToken, isAdmin, async (req, res) => {
  try {
    const users1c = await prisma.user1C.findMany();
    logger.info(`User ${req.user.id} fetched list of 1C users`);
    res.json(users1c);
  } catch (error) {
    logger.error(`Error fetching 1C users: ${error.message}`);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

// Получение одного пользователя
router.get('/:id', authenticateToken, isAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const user = await prisma.user.findUnique({
      where: { id: parseInt(id) },
      include: {
        roles: true,
        user1C: true,
      },
    });
    if (!user) {
      logger.warn(`User ${id} not found`);
      return res.status(404).json({ error: 'User not found' });
    }
    logger.info(`User ${req.user.id} fetched user ${id}`);
    res.json(user);
  } catch (error) {
    logger.error(`Error fetching user ${id}: ${error.message}`);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

// Обновление пользователя
router.put('/:id', authenticateToken, isAdmin, async (req, res) => {
  const { id } = req.params;
  const { name, password, user1CId, roleId } = req.body;

  try {
    const updateData = {};
    if (name) updateData.name = name;
    if (password) updateData.password = await bcrypt.hash(password, 10);
    if (user1CId !== undefined) {
      if (user1CId === '') {
        updateData.user1C = { disconnect: true };
      } else {
        updateData.user1C = { connect: { id: parseInt(user1CId) } };
      }
    }
    if (roleId) {
      await prisma.user.update({
        where: { id: parseInt(id) },
        data: {
          roles: { set: [] },
        },
      });
      updateData.roles = { connect: { id: parseInt(roleId) } };
    }

    const user = await prisma.user.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        roles: true,
        user1C: true,
      },
    });
    logger.info(`User ${req.user.id} updated user ${id}`);
    res.json(user);
  } catch (error) {
    if (error.code === 'P2025') {
      logger.warn(`User or User1C not found for update: ${id}`);
      return res.status(404).json({ error: 'User or User1C not found' });
    }
    logger.error(`Error updating user ${id}: ${error.message}`);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

// Синхронизация данных из 1С
router.post('/1c/sync', authenticateToken, isAdmin, async (req, res) => {
  try {
    const wsdlResponse = await axios.get(WSDL_URL, {
      auth: {
        username: ONEC_USERNAME,
        password: ONEC_PASSWORD,
      },
    });
    console.log('WSDL fetched successfully:', wsdlResponse.status);

    const client = await soap.createClientAsync(WSDL_URL, {
      wsdl_options: {
        auth: {
          username: ONEC_USERNAME,
          password: ONEC_PASSWORD,
          type: 'basic',
        },
      },
    });

    console.log('SOAP client created successfully');

    const auth = 'Basic ' + Buffer.from(`${ONEC_USERNAME}:${ONEC_PASSWORD}`).toString('base64');
    client.addHttpHeader('Authorization', auth);

    const result = await client.GetUsersAsync({});

    console.log('Response from 1C:', result);

    if (!result || !result[0] || !result[0].return || !result[0].return.Users) {
      logger.warn('No users returned from 1C');
      return res.status(500).json({ error: 'No users returned from 1C' });
    }

    const usersFrom1C = result[0].return.Users;

    console.log('Users from 1C:', usersFrom1C.length);

    await prisma.user1C.deleteMany({});

    for (const user of usersFrom1C) {
      await prisma.user1C.upsert({
        where: { externalId: user.ID },
        update: {
          name: user.Name,
        },
        create: {
          externalId: user.ID,
          name: user.Name,
        },
      });
    }

    logger.info(`User ${req.user.id} successfully synced ${usersFrom1C.length} users from 1C`);
    res.json({ message: `Синхронизация завершена: загружено ${usersFrom1C.length} пользователей` });
  } catch (error) {
    logger.error(`Error during 1C sync: ${error.message}`);
    if (error.response) {
      console.log('Error response status:', error.response.status);
      console.log('Error response data:', error.response.data);
    }
    res.status(500).json({ error: `Ошибка синхронизации: ${error.message}` });
  }
});

module.exports = router;
