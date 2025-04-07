const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.json()
  ),
  transports: [
    // Транспорт для ошибок (без ротации, только ошибки)
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
    }),
    // Транспорт для всех логов с ежедневной ротацией
    new DailyRotateFile({
      filename: 'logs/combined-%DATE%.log', // Имя файла с датой
      datePattern: 'YYYY-MM-DD', // Один файл на день
      maxFiles: '7d', // Хранить логи за 7 дней
      zippedArchive: true, // сжимаем старые логи
    }),
    // Вывод в консоль для разработки
    new winston.transports.Console(),
  ],
});

module.exports = logger;