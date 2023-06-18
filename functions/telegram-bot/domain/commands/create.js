const {GameCode} = require("../game-code");
const {Player} = require("../player");
exports.CreateGame = ({
    create: (db, bot) => {
        async function execute(message) {
            const userId = message.userId()
            await db.removeUserFromAllGames(userId);
            // Crea una nueva partida con código aleatorio
            const code = GameCode.create()
            const player = Player.create()
            const aiPlayer = Player.create()

            await db.createEmptyGame(userId, code, player, aiPlayer)

            const joinLink = `https://t.me/turingphonebot?start=${code}`;
            await bot.sendMessage(userId, `Se ha creado una nueva partida.\nInvita a otras personas con el link: [${joinLink}](${joinLink}) o diciéndoles que escriban "/join ${code}".\nPuedes empezar la partida cuando haya varias personas escribiendo "/go".`, {parse_mode: 'Markdown'});
        }
        return ({
            execute
        })
    }
});
