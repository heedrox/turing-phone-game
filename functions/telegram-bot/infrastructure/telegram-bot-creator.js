const TelegramBot = require('node-telegram-bot-api');

const telegramToken = process.env.TELEGRAM_TOKEN;
exports.TelegramBotCreator = {
    create: () => new TelegramBot(telegramToken)
}
