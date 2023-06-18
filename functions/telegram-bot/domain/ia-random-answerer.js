const { GptMessageGenerator } = require("../infrastructure/gpt-message-generator")
const { DelayedExecutor } = require('../infrastructure/delayed-executor')
const { RandomNumberGenerator } = require('../infrastructure/random-number-generator')

const addPlayerName = (player, text) => `<b>${player.emoji} ${player.name}</b>: ${text}`

const delayedExecutor = DelayedExecutor.create()
const randomGenerator = RandomNumberGenerator.create()
const gptMessageGenerator = GptMessageGenerator.create()

exports.AiRandomAnswerer = {
    create: (db, bot) => {
        async function answerGptRandomly(gameCode) {
            const chanceAnswer = randomGenerator.get()
            if (chanceAnswer >= 0.5) {
                const game = await db.getGameByCode(gameCode)
                const aiPlayer = {
                    id: 'ai',
                    name: game.aiName,
                    emoji: game.aiEmoji
                };
                const previousMessages = await db.getPreviousMessages(gameCode)
                const message = await gptMessageGenerator.generate(previousMessages)
                const timeDelay = randomGenerator.get() * 60000
                await delayedExecutor.execute(async () => {
                    const gptAnswerPromises = [game]
                        .flatMap(game => game.chatIds)
                        .map(id => bot.sendMessage(id, addPlayerName(aiPlayer, message), { parse_mode: 'HTML' }))
                    await Promise.all(gptAnswerPromises)
                    await db.addPreviousMessage(gameCode, aiPlayer, message)
                }, timeDelay)
            }
        }
         
        return {
            answer: (code) => answerGptRandomly(code)        
        }        
    }
}