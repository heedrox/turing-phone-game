const addPlayerName = (player, text) => `*${player.emoji} ${player.name}*: ${text}`

exports.Broadcast = ({
    create: (db, bot) => {
        async function execute(message) {
            const userId = message.userId()
            const text = message.text()

            const games = await db.findGamesByUser(userId)

            if (games.length === 0) {
                return await bot.sendMessage(
                    userId,
                    'No te has unido a ninguna partida. Usa el comando "/join CODIGO" para unirte a una, o "/create" para crear una nueva.'
                );
            }
            const isStarted = games[0].started === 1
            const player = games[0].players.find(player => player.id === userId)
            const sendingPromises = games
                .flatMap(game => game.chatIds)
                .filter(participantId => participantId !== userId)
                .map(id => bot.sendMessage(id, isStarted ? addPlayerName(player, text) : text))
            await Promise.all(sendingPromises)
        }
        return ({
            execute
        })
    }
})
