const { GptThemeGenerator } = require("../../infrastructure/gpt-theme-generator");
const { AiRandomAnswerer } = require('../ia-random-answerer')

exports.Go = ({    
    create: (db, bot) => {
        const themeGenerator = GptThemeGenerator.create()
        const aiRandomAnswerer = AiRandomAnswerer.create(db, bot)

        async function execute(message) {
            const userId = message.userId()
            const games = await db.findGamesByUser(userId)
            if (games.length === 0) {
                return await bot.sendMessage(
                    userId,
                    'No te has unido a ninguna partida. Usa el comando "/join CODIGO" para unirte a una, o "/create" para crear una nueva.'
                );
            }
            const code = games[0].id
            if (games[0].chatIds.length <2 ) {
                return await bot.sendMessage(
                    userId,
                    `Todavía no se ha unido ningún jugador. Invita al menos a un jugador con el código ${code} para empezar.`
                );
            }
            await db.startGame(code)
            const theme = await themeGenerator.generate()
            const startMessage = `¡Empieza la partida, suerte! ${theme}`
            await db.addPreviousMessage(code, {
                id: 0,
                name: "ai",
                emoji: null                
            }, startMessage)  
            await Promise.all(games[0].chatIds.map(chatId => bot.sendMessage(chatId, startMessage)))
            await aiRandomAnswerer.answer(code)
        }
        return ({
            execute
        })
    }
})
