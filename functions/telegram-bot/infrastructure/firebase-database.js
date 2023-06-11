const admin = require('firebase-admin');

const GAMES_COLLECTION = 'partidas'
let db

function init() {
    if (admin.apps.length === 0) {
        admin.initializeApp();
    }
    db = admin.firestore();
}

async function getGameByCode(code) {
    const snapshot = await db.collection(GAMES_COLLECTION).doc(code).get();
    return snapshot.exists ? snapshot.data() : null
}

async function createEmptyGame(chatId, code) {
    await db.collection(GAMES_COLLECTION).doc(code).set({
        chatIds: [chatId]
    });
}

async function addUserToGame(chatId, code) {
    await db.collection(GAMES_COLLECTION).doc(code).update({
        chatIds: admin.firestore.FieldValue.arrayUnion(chatId),
    });
}

async function removeUserFromAllGames(chatId) {
    const partidasQuerySnapshot = await db.collection('partidas').where('chatIds', 'array-contains', chatId).get();

    partidasQuerySnapshot.forEach((doc) => {
        const partidaId = doc.id;
        const partidaData = doc.data();
        const {chatIds} = partidaData;

        const updatedChatIds = chatIds.filter((id) => id !== chatId);

        db.collection('partidas').doc(partidaId).update({chatIds: updatedChatIds});
    });
}

async function findGamesByUser(chatId) {
    const games = await db.collection(GAMES_COLLECTION).where('chatIds', 'array-contains', chatId).get();
    return games.empty ? [] : games.docs.map(doc => doc.data())
}

exports.FirebaseDatabase = {
    create: () => {
        init();
        return {
            init,
            getGameByCode,
            createEmptyGame,
            addUserToGame,
            removeUserFromAllGames,
            findGamesByUser,
        }
    }
}
