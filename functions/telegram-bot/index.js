const {GameCode} = require("./domain/game-code");
const {FirebaseDatabase} = require("./infrastructure/firebase-database");
const {TelegramBotCreator} = require("./infrastructure/telegram-bot-creator");
const {Message} = require("./domain/message");
const {Join} = require("./domain/commands/join");
const {CreateGame} = require("./domain/commands/create");
const {Broadcast} = require("./domain/commands/broadcast");
require('dotenv').config();

const db = FirebaseDatabase.create()
const bot = TelegramBotCreator.create()

const joinCommand = Join.create(db, bot)
const createGameCommand = CreateGame.create(db, bot)
const broadcastCommand = Broadcast.create(db, bot)

exports.telegramBot = async (req, res) => {
    const message = Message.fromBody(req.body)

    if (message.hasText()) {
        const userId = message.userId()
        const text = message.text()

        if (message.isJoin()) {
            await joinCommand.execute(message)
        } else if (message.isCreate()) {
            await createGameCommand.execute(message)
        } else {
            await broadcastCommand.execute(message)
        }
    }

    res.sendStatus(200);
};


