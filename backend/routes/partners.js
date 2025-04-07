const express = require('express');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const logger = require('../logger');
const soap = require('soap');
const axios = require('axios');
const router = express.Router();
const prisma = new PrismaClient();

// Проверяем JWT_SECRET
console.log('JWT_SECRET in partners.js:', process.env.JWT_SECRET);

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
    console.log('Decoded token in partners.js:', decoded);
    req.user = decoded;
    next();
  } catch (error) {
    logger.error(`Invalid token in partners.js: ${error.message}`);
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

// Получение списка партнёров
router.get('/', authenticateToken, isAdmin, async (req, res) => {
  try {
    const partners = await prisma.partner.findMany({
      include: {
        contactPersons: true,
      },
    });
    logger.info(`User ${req.user.id} fetched list of partners`);
    res.json(partners);
  } catch (error) {
    logger.error(`Error fetching partners: ${error.message}`);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

// Синхронизация партнёров из 1С
router.post('/sync', authenticateToken, isAdmin, async (req, res) => {
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

    const result = await client.GetPartnersAsync({});

    console.log('Response from 1C:', result);

    if (!result || !result[0] || !result[0].return) {
      logger.warn('No partners returned from 1C');
      return res.status(500).json({ error: 'No partners returned from 1C' });
    }

    const jsonString = result[0].return;
    const partnersData = JSON.parse(jsonString);

    if (!partnersData.Partners || !Array.isArray(partnersData.Partners)) {
      logger.warn('Invalid partners data format');
      return res.status(500).json({ error: 'Invalid partners data format' });
    }

    const partnersFrom1C = partnersData.Partners;

    // Очистка существующих данных
    await prisma.contactPerson.deleteMany({});
    await prisma.partner.deleteMany({});

    // Добавление новых партнёров
    for (const partner of partnersFrom1C) {
      const contactPersons = partner.ContactPersons || [];
      delete partner.ContactPersons; // Удаляем вложенные данные перед созданием партнёра

      const createdPartner = await prisma.partner.create({
        data: {
          guid: partner.GUID,
          name: partner.Name,
          inn: partner.INN || null,
          mainManager: partner.MainManager || null,
        },
      });

      // Добавление контактных лиц
      for (const contact of contactPersons) {
        await prisma.contactPerson.create({
          data: {
            guid: contact.GUID,
            partnerId: createdPartner.id,
            name: contact.Name,
            position: contact.Position || null,
            mobilePhone: contact.MobilePhone || null,
            phone: contact.Phone || null,
            status: contact.Status || null,
          },
        });
      }
    }

    // Обновление метаданных синхронизации
    await prisma.syncMetadata.upsert({
      where: { entity: 'Partners' },
      update: { lastSync: new Date() },
      create: { entity: 'Partners', lastSync: new Date() },
    });

    logger.info(`User ${req.user.id} successfully synced ${partnersFrom1C.length} partners from 1C`);
    res.json({ message: `Синхронизация завершена: загружено ${partnersFrom1C.length} партнёров` });
  } catch (error) {
    logger.error(`Error during partners sync: ${error.message}`);
    if (error.response) {
      console.log('Error response status:', error.response.status);
      console.log('Error response data:', error.response.data);
    }
    res.status(500).json({ error: `Ошибка синхронизации: ${error.message}` });
  }
});

module.exports = router;