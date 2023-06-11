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
                const sendingPromises = games
                    .flatMap(game => game.chatIds)
                    .filter(participantId => participantId !== userId)
                    .map(id => bot.sendMessage(id, text))
                await Promise.all(sendingPromises)
            }
        }
        return ({
            execute
        })
    }
})
