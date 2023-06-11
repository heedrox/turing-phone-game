const {GameCode} = require("./domain/game-code");
const {FirebaseDatabase} = require("./infrastructure/firebase-database");
require('dotenv').config();

const db = FirebaseDatabase.create()

exports.telegramBot = async (req, res) => {
    const {TelegramBotCreator} = require("./infrastructure/telegram-bot-creator");
    const bot = TelegramBotCreator.create()

    const { message } = req.body;

    if (message && message.text) {
        const chatId = message.chat.id;
        const text = message.text;

        if (text.startsWith('/join')) {
            const code = text.split(' ')[1];

            // Verifica si el código existe en Firestore
            const partidaData  = await db.getGameByCode(code)
            if (partidaData) {
                const chatIds = partidaData.chatIds || [];

                if (chatIds.includes(chatId)) {
                    await bot.sendMessage(chatId, `Ya estás en la partida ${code}.`);
                } else {
                    await db.removeUserFromAllGames(chatId)
                    await db.addUserToGame(chatId, code)
                    await bot.sendMessage(chatId, `Te has unido a la partida con código ${code}`);
                }
            } else {
                await bot.sendMessage(chatId, `El código ${code} no es válido`);
            }
        } else if (text === '/create') {
            await db.removeUserFromAllGames(chatId);
            // Crea una nueva partida con código aleatorio
            const code = GameCode.create()

            await db.createEmptyGame(chatId, code)

            const joinLink = `https://t.me/turingphonebot?start=${code}`;
            await bot.sendMessage(chatId, `Se ha creado una nueva partida. ¡Únete a ella! [${joinLink}](${joinLink})`, { parse_mode: 'Markdown' });
        } else {
            const partidaQuerySnapshot = await db.findGamesByUser(chatId)

            if (partidaQuerySnapshot.empty) {
                await bot.sendMessage(
                    chatId,
                    'No te has unido a ninguna partida. Usa el comando "/join CODIGO" para unirte a una, o "/create" para crear una nueva.'
                );
            } else {
                partidaQuerySnapshot.forEach((doc) => {
                    const partidaData = doc.data();
                    const { chatIds } = partidaData;

                    // Envía el mensaje a todos los participantes de la partida
                    chatIds.forEach(async (participantChatId) => {
                        if (participantChatId !== chatId) {
                            await bot.sendMessage(participantChatId, text);
                        }
                    });
                });
            }
        }
    }

    res.sendStatus(200);
};


