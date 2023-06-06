const functions = require("firebase-functions");
const { Configuration, OpenAIApi } = require("openai");
const {telegramBot} = require("./telegram-bot/index");
const {aiTest} = require('./ai-test/index')


exports.aiTest = functions.https.onRequest(aiTest);
exports.telegramBot = functions.https.onRequest(telegramBot)
