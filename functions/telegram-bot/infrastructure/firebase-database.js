const admin = require('firebase-admin');
const
    {FieldValue} = require('firebase-admin/firestore');

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

async function createEmptyGame(userId, code, player) {
    await db.collection(GAMES_COLLECTION).doc(code).set({
        chatIds: [userId],
    });
    await db.doc(`${GAMES_COLLECTION}/${code}/players/${userId}`).set({
        name: player.name,
        emoji: player.emoji
    })
}

async function addUserToGame(chatId, code, player) {
    await db.collection(GAMES_COLLECTION).doc(code).update({
        chatIds: FieldValue.arrayUnion(chatId),
    });
    await db.doc(`${GAMES_COLLECTION}/${code}/players/${chatId}`).set({
        name: player.name,
        emoji: player.emoji
    })
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
    return games.empty ? [] : games.docs.map(doc => ({ id: doc.id, ... doc.data() }))
}

async function updateGame(code, params) {
    await db.doc(`${GAMES_COLLECTION}/${code}`).update(params)
}

async function startGame(code) {
    return await updateGame(code, { started: 1 })
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
            startGame,
        }
    }
}
