const addPlayerName = (player, text) => `<b>${player.emoji} ${player.name}</b>: ${text}`
const { DelayedExecutor } = require('../../infrastructure/delayed-executor')
const { RandomNumberGenerator } = require('../../infrastructure/random-number-generator')

const delayedExecutor = DelayedExecutor.create()
const randomGenerator = RandomNumberGenerator.create()

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
            const aiPlayer = {
                id: 'ai',
                name: games[0].aiName,
                emoji: games[0].aiEmoji
            };
            const sendingPromises = games
                .flatMap(game => game.chatIds)
                .filter(participantId => participantId !== userId)
                .map(id => bot.sendMessage(id, isStarted ? addPlayerName(player, text) : text, {parse_mode: 'HTML'}) )
            await Promise.all(sendingPromises)

            if (isStarted) {
                const chanceAnswer = randomGenerator.get()
                if (chanceAnswer>=0.5) {
                    const timeDelay = randomGenerator.get() * 60000
                    await delayedExecutor.execute(() => {
                        const gptAnswerPromises = games
                        .flatMap(game => game.chatIds)
                        .map(id => bot.sendMessage(id, isStarted ? addPlayerName(aiPlayer, 'Message from GPT!') : text, {parse_mode: 'HTML'}) )
                        return Promise.all(gptAnswerPromises)
                    }, timeDelay)        
                }
            }
        }
        return ({
            execute
        })
    }
})
