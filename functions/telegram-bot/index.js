const {GameCode} = require("./domain/game-code");
const {FirebaseDatabase} = require("./infrastructure/firebase-database");
const {TelegramBotCreator} = require("./infrastructure/telegram-bot-creator");
const {Message} = require("./domain/message");
require('dotenv').config();

const db = FirebaseDatabase.create()
const bot = TelegramBotCreator.create()

exports.telegramBot = async (req, res) => {
    const message = Message.fromBody(req.body)

    if (message.hasText()) {
        const userId = message.userId()
        const text = message.text()

        if (message.isJoin()) {
            const code = message.joinCode()

            // Verifica si el código existe en Firestore
            const partidaData  = await db.getGameByCode(code)
            if (partidaData) {
                const chatIds = partidaData.chatIds || [];

                if (chatIds.includes(userId)) {
                    await bot.sendMessage(userId, `Ya estás en la partida ${code}.`);
                } else {
                    await db.removeUserFromAllGames(userId)
                    await db.addUserToGame(userId, code)
                    await bot.sendMessage(userId, `Te has unido a la partida con código ${code}`);
                }
            } else {
                await bot.sendMessage(userId, `El código ${code} no es válido`);
            }
        } else if (message.isCreate()) {
            await db.removeUserFromAllGames(userId);
            // Crea una nueva partida con código aleatorio
            const code = GameCode.create()

            await db.createEmptyGame(userId, code)

            const joinLink = `https://t.me/turingphonebot?start=${code}`;
            await bot.sendMessage(userId, `Se ha creado una nueva partida. ¡Únete a ella! [${joinLink}](${joinLink})`, { parse_mode: 'Markdown' });
        } else {
            const games = await db.findGamesByUser(userId)

            if (games.length === 0) {
                await bot.sendMessage(
                    userId,
                    'No te has unido a ninguna partida. Usa el comando "/join CODIGO" para unirte a una, o "/create" para crear una nueva.'
                );
            } else {
                games.forEach((partidaData) => {
                    const { chatIds } = partidaData;

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


