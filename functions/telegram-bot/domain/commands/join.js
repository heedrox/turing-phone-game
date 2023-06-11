exports.Join = {
    create: (db, bot) => {

        async function execute(message) {
            const code = message.joinCode()
            const userId = message.userId()

            // Verifica si el código existe en Firestore
            const partidaData = await db.getGameByCode(code)
            if (!partidaData) {
                await bot.sendMessage(userId, `El código ${code} no es válido`);
                return;
            }
            const chatIds = partidaData.chatIds || [];

            if (chatIds.includes(userId)) {
                await bot.sendMessage(userId, `Ya estás en la partida ${code}.`);
            } else {
                await db.removeUserFromAllGames(userId)
                await db.addUserToGame(userId, code)
                await bot.sendMessage(userId, `Te has unido a la partida con código ${code}`);
            }
        }

        return ({
            execute
        })
    }
}
