exports.Broadcast = ({
    create: (db, bot) => {
        async function execute(message) {
            const userId = message.userId()
            const text = message.text()

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
        return ({
            execute
        })
    }
})
