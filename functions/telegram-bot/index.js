const {GameCode} = require("./domain/game-code");
const {FirebaseDatabase} = require("./infrastructure/firebase-database");
const {TelegramBotCreator} = require("./infrastructure/telegram-bot-creator");
const {Message} = require("./domain/message");
const {Join} = require("./domain/commands/join");
const {CreateGame} = require("./domain/commands/create");
require('dotenv').config();

const db = FirebaseDatabase.create()
const bot = TelegramBotCreator.create()

const joinCommand = Join.create(db, bot)
const createGameCommand = CreateGame.create(db, bot)

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
            const games = await db.findGamesByUser(userId)

            if (games.length === 0) {
                await bot.sendMessage(
                    userId,
                    'No te has unido a ninguna partida. Usa el comando "/join CODIGO" para unirte a una, o "/create" para crear una nueva.'
                );
            } else {
                games.forEach((partidaData) => {
                    const {chatIds} = partidaData;

                    // Envía el mensaje a todos los participantes de la partida
                    chatIds.forEach(async (participantChatId) => {
                        if (participantChatId !== userId) {
                            await bot.sendMessage(participantChatId, text);
                        }
                    });
                });
            }
        }
    }

    res.sendStatus(200);
};


