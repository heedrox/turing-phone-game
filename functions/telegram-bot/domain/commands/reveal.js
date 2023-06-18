exports.Reveal = ({    
    create: (db, bot) => {
        
        async function execute(message) {
            const userId = message.userId()
            const games = await db.findGamesByUser(userId)
            if (games.length === 0) {
                return await bot.sendMessage(
                    userId,
                    'No te has unido a ninguna partida. Usa el comando "/join CODIGO" para unirte a una, o "/create" para crear una nueva.'
                );
            }    
            const players = games[0].players
            players.push({
                name: games[0].aiName,
                emoji: games[0].aiEmoji,
                id: 'ai'
            })
            const sortedPlayers = players.sort((p1, p2) => (p1.name.localeCompare(p2.name)))  
            if (message.text().indexOf(' ') === -1) {
                return await bot.sendMessage(userId, "Revela quién es la IA:", {
                    reply_markup: {
                        keyboard: sortedPlayers.map(p => ([{ text: `/reveal ${p.name}`}]))
                    }
                  })                  
            }

            const revealedPlayer = message.text().split(' ')[1]
            if (revealedPlayer === games[0].aiName) {
                bot.sendMessage(userId, '¡Sí! Diste con la IA. ¡Has ganado!')

                const otherPlayers = sortedPlayers.filter(p => p.id !== 'ai' && p.id !== userId)
                
                const winner = sortedPlayers.find(p => p.id === userId)
                const text = `Ooooh, ${winner.name} dio con la IA antes que tú. La IA era ${games[0].aiName}`
                const sendPromises = otherPlayers.map(async p => await bot.sendMessage(p.id, text))
                return await Promise.all(sendPromises)    
            }

            bot.sendMessage(userId, '¡No! La IA era name-ai. ¡Has perdido!')
            const otherPlayers = sortedPlayers.filter(p => p.id !== 'ai' && p.id !== userId)            
            const looser = sortedPlayers.find(p => p.id === userId)
            const text = `${looser.name} se eliminó de la partida por equivocarse al revelar la IA.`
            const sendPromises = otherPlayers.map(async p => await bot.sendMessage(p.id, text))
            return await Promise.all(sendPromises)
        }

        return {
            execute
        }
    }
})
