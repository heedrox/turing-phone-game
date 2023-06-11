const {FirebaseDatabase} = require("./infrastructure/firebase-database");
const {TelegramBotCreator} = require("./infrastructure/telegram-bot-creator");
const {Message} = require("./domain/message");
const {Join} = require("./domain/commands/join");
const {CreateGame} = require("./domain/commands/create");
const {Broadcast} = require("./domain/commands/broadcast");
const {Go} = require("./domain/commands/go");
require('dotenv').config();

const db = FirebaseDatabase.create()
const bot = TelegramBotCreator.create()

const joinCommand = Join.create(db, bot)
const createGameCommand = CreateGame.create(db, bot)
const broadcastCommand = Broadcast.create(db, bot)
const goCommand = Go.create(db, bot)

exports.telegramBot = async (req, res) => {
    const message = Message.fromBody(req.body)

    console.log('Received message', message.text())
    if (message.isJoin()) {
        await joinCommand.execute(message)
    } else if (message.isCreate()) {
        await createGameCommand.execute(message)
    } else if (message.isGo()) {
        await goCommand.execute(message)
    } else if (message.hasText()) {
        await broadcastCommand.execute(message)
    }

    res.sendStatus(200);
};


