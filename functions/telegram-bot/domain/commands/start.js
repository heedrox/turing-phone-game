exports.Start = ({
    create: (db, bot) => {

        async function execute(message) {
            const userId = message.userId()
            const games = await db.findGamesByUser(userId)
            if (games.length === 0) {
                await bot.sendMessage(
                    userId,
                    'No te has unido a ninguna partida. Usa el comando "/join CODIGO" para unirte a una, o "/create" para crear una nueva.'
                );
                return
            }
            await db.startGame(games[0].id)
        }
        return ({
            execute
        })
    }
})
