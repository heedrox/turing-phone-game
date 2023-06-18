const addPlayerName = (player, text) => `<b>${player.emoji} ${player.name}</b>: ${text}`
const { DelayedExecutor } = require('../../infrastructure/delayed-executor')
const { GptMessageGenerator } = require('../../infrastructure/gpt-message-generator')
const { RandomNumberGenerator } = require('../../infrastructure/random-number-generator')

const delayedExecutor = DelayedExecutor.create()
const randomGenerator = RandomNumberGenerator.create()
const gptMessageGenerator = GptMessageGenerator.create()

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
            const gameCode = games[0].id
            const numPlayers = games[0].chatIds.length

            const sendingPromises = games
                .flatMap(game => game.chatIds)
                .filter(participantId => participantId !== userId)
                .map(id => bot.sendMessage(id, isStarted ? addPlayerName(player, text) : text, {parse_mode: 'HTML'}) )
            await Promise.all(sendingPromises)

            if (!isStarted) {
                await bot.sendMessage(userId, `Recuerda que la partida no ha empezado todavía. Puedes escribir "/go" para comenzarla. En este momento hay ${numPlayers} jugador(es).`)
                return;
            }
            
            await db.addPreviousMessage(gameCode, player, text)                        
            const chanceAnswer = randomGenerator.get()
            if (chanceAnswer >= 0.5) {
                const previousMessages = await db.getPreviousMessages(gameCode)
                const message = await gptMessageGenerator.generate(previousMessages)
                const timeDelay = randomGenerator.get() * 60000
                await delayedExecutor.execute(async () => {
                    const gptAnswerPromises = games
                    .flatMap(game => game.chatIds)
                    .map(id => bot.sendMessage(id, addPlayerName(aiPlayer, message), {parse_mode: 'HTML'}) )
                    await Promise.all(gptAnswerPromises)
                    await db.addPreviousMessage(gameCode, aiPlayer, message)  
                }, timeDelay)        
            }
        }
        return ({
            execute
        })
    }
})
