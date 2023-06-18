const addPlayerName = (player, text) => `<b>${player.emoji} ${player.name}</b>: ${text}`
const { DelayedExecutor } = require('../../infrastructure/delayed-executor')
const { GptMessageGenerator } = require('../../infrastructure/gpt-message-generator')
const { RandomNumberGenerator } = require('../../infrastructure/random-number-generator')
const { AiRandomAnswerer } = require('../ia-random-answerer')

const delayedExecutor = DelayedExecutor.create()
const randomGenerator = RandomNumberGenerator.create()
const gptMessageGenerator = GptMessageGenerator.create()


exports.Broadcast = ({
    create: (db, bot) => {
        const aiRandomAnswerer = AiRandomAnswerer.create(db, bot)

        async function execute(message) {
            const userId = message.userId()
            const text = message.text()

            const games = await db.findGamesByUser(userId)

            if (games.length === 0) {
                return await bot.sendMessage(
                    userId,
                    'Te damos la bienvenida a Turing Phone, un juego multijugador en el que competirás contra tus amistades para descubrir quién es la IA.\n\n'+
                    'No te has unido a ninguna partida todavía. Crea una partida con el comando "/create", o únete a una partida ya existente con el comando "/join".\n\n'+
                    'Una vez que todas las personas estén en la partida, una de ellas debe escribir "/go". En ese momento, la partida comenzará.\n'+
                    'El objetivo es mantener la conversación haciendo creer a tus amistades que eres la IA. ¿Crees que puedes engañarles?\n'+
                    'Una vez que creas quién es la IA, revélala con el comando "/reveal". Si aciertas, habrás ganado. ¡Buena suerte!'
                );
            }
            const isStarted = games[0].started === 1
            const player = games[0].players.find(player => player.id === userId)
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
            await aiRandomAnswerer.answer(gameCode)
        }
        return ({
            execute
        })
    }
})
