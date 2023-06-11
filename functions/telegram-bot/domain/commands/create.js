const {GameCode} = require("../game-code");
exports.CreateGame = ({
    create: (db, bot) => {
        async function execute(message) {
            const userId = message.userId()
            await db.removeUserFromAllGames(userId);
            // Crea una nueva partida con código aleatorio
            const code = GameCode.create()

            await db.createEmptyGame(userId, code)

            const joinLink = `https://t.me/turingphonebot?start=${code}`;
            await bot.sendMessage(userId, `Se ha creado una nueva partida. ¡Únete a ella! [${joinLink}](${joinLink})`, {parse_mode: 'Markdown'});
        }
        return ({
            execute
        })
    }
});
