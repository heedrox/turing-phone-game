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

async function createEmptyGame(userId, code, player, aiPlayer) {
    await db.collection(GAMES_COLLECTION).doc(code).set({
        chatIds: [userId],
        aiName: aiPlayer.name,
        aiEmoji: aiPlayer.emoji
    });
    await db.doc(`${GAMES_COLLECTION}/${code}/players/${userId}`).set({
        id: userId,
        name: player.name,
        emoji: player.emoji
    })
}

async function addUserToGame(userId, code, player) {
    await db.collection(GAMES_COLLECTION).doc(code).update({
        chatIds: FieldValue.arrayUnion(userId),
    });
    await db.doc(`${GAMES_COLLECTION}/${code}/players/${userId}`).set({
        id: userId,
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
    if (games.empty) return []
    return Promise.all(games.docs.map(async doc => {
        const players = await db.collection(`${GAMES_COLLECTION}/${doc.id}/players`).get()
        return {
            id: doc.id,
            players: players.empty ? [] : players.docs.map(d => d.data()),
            ...doc.data()
        }
    }))
}

async function updateGame(code, params) {
    await db.doc(`${GAMES_COLLECTION}/${code}`).update(params)
}

async function startGame(code) {
    return await updateGame(code, {started: 1})
}

async function getPreviousMessages(code) {
    const messages = await db.collection(`${GAMES_COLLECTION}/${code}/messages`).orderBy("created", "asc").get()
    if (messages.empty) return []
    return messages.docs.map((m) => ({
        content: m.data().content,
        playerName: m.data().playerName,
        playerId: m.data().playerId
    }))
}

async function addPreviousMessage(code, player, text) {
    await db.collection(`${GAMES_COLLECTION}/${code}/messages`).add({
        content: text,
        playerName: player.name,
        playerId: player.id,
        created: FieldValue.serverTimestamp() 
    })
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
            getPreviousMessages,
            addPreviousMessage
        }
    }
}
