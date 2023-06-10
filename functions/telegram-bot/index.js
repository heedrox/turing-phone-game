const admin = require('firebase-admin');
const {TelegramBotCreator} = require("./infrastructure/telegram-bot-creator");
require('dotenv').config();

if (admin.apps.length === 0) {
    admin.initializeApp();
}

const db = admin.firestore();

const bot = TelegramBotCreator.create()

// Genera un código de partida aleatorio
function generateGameCode() {
    const characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';

    for (let i = 0; i < 8; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        code += characters[randomIndex];
    }

    return code;
}

exports.telegramBot = async (req, res) => {
    const { message } = req.body;

    console.log('voy', message)
    if (message && message.text) {
        const chatId = message.chat.id;
        const text = message.text;

        if (text.startsWith('/join')) {
            const codigo = text.split(' ')[1];

            console.log('existe?')
            // Verifica si el código existe en Firestore
            const partidaSnapshot = await db.collection('partidas').doc(codigo).get();

            console.log('fin')
            if (partidaSnapshot.exists) {
                const partidaData = partidaSnapshot.data();
                const chatIds = partidaData.chatIds || [];

                if (chatIds.includes(chatId)) {
                    bot.sendMessage(chatId, 'Ya estás en una partida. No puedes unirte a otra.');
                } else {
                    // Elimina al usuario de todas las partidas anteriores
                    await removeUserFromAllPartidas(chatId);

                    // Guarda el chatId en la partida correspondiente
                    await db.collection('partidas').doc(codigo).update({
                        chatIds: admin.firestore.FieldValue.arrayUnion(chatId),
                    });

                    bot.sendMessage(chatId, `Te has unido a la partida con código ${codigo}`);
                }
            } else {
                console.log('no existe', bot)
                bot.sendMessage(chatId, `El código ${codigo} no es válido`);
            }
        } else if (text === '/create') {
            // Verifica si el usuario ya está en una partida
            const partidaSnapshot = await db.collection('partidas').where('chatIds', 'array-contains', chatId).get();

            if (!partidaSnapshot.empty) {
                const partidaId = partidaSnapshot.docs[0].id;
                const partidaData = partidaSnapshot.docs[0].data();
                const { chatIds } = partidaData;

                // Elimina al usuario de la partida anterior
                const updatedChatIds = chatIds.filter((id) => id !== chatId);
                await db.collection('partidas').doc(partidaId).update({ chatIds: updatedChatIds });

                // Crea una nueva partida con código aleatorio
                const codigo = generateGameCode();

                // Guarda el chatId del creador en la nueva partida
                await db.collection('partidas').doc(codigo).set({
                    chatIds: [chatId],
                });

                const joinLink = `https://t.me/turingphonebot?start=${codigo}`;
                bot.sendMessage(chatId, `Se ha creado una nueva partida. ¡Únete a ella! [Unirse](${joinLink})`, { parse_mode: 'Markdown' });
            } else {
                // Crea una nueva partida con código aleatorio
                const codigo = generateGameCode();

                // Guarda el chatId del creador en la nueva partida
                await db.collection('partidas').doc(codigo).set({
                    chatIds: [chatId],
                });

                const joinLink = `https://t.me/turingphonebot?start=${codigo}`;
                bot.sendMessage(chatId, `Se ha creado una nueva partida. ¡Únete a ella! [Unirse](${joinLink})`, { parse_mode: 'Markdown' });
            }
        } else {
            // Busca el código de partida correspondiente al chatId
            const partidaQuerySnapshot = await db.collection('partidas').where('chatIds', 'array-contains', chatId).get();

            if (partidaQuerySnapshot.empty) {
                bot.sendMessage(
                    chatId,
                    'No te has unido a ninguna partida. Usa el comando "/join CODIGO" para unirte a una, o "/create" para crear una nueva.'
                );
            } else {
                partidaQuerySnapshot.forEach((doc) => {
                    const partidaData = doc.data();
                    const { chatIds } = partidaData;

                    // Envía el mensaje a todos los participantes de la partida
                    chatIds.forEach((participantChatId) => {
                        if (participantChatId !== chatId) {
                            bot.sendMessage(participantChatId, text);
                        }
                    });
                });
            }
        }
    }

    res.sendStatus(200);
};

// Función para eliminar al usuario de todas las partidas anteriores
async function removeUserFromAllPartidas(chatId) {
    const partidasQuerySnapshot = await db.collection('partidas').where('chatIds', 'array-contains', chatId).get();

    partidasQuerySnapshot.forEach((doc) => {
        const partidaId = doc.id;
        const partidaData = doc.data();
        const { chatIds } = partidaData;

        const updatedChatIds = chatIds.filter((id) => id !== chatId);

        db.collection('partidas').doc(partidaId).update({ chatIds: updatedChatIds });
    });
}
