// const admin = require('firebase-admin');
const admin = require('firebase-admin');
require('dotenv').config();
admin.initializeApp();


function mockTelegramBot() {
    const mockBot = {
        sendMessage: jest.fn()
    }
    jest.mock('./infrastructure/telegram-bot-creator', () => ({
        TelegramBotCreator: {create: () => mockBot}
    }))
    return mockBot;
}

function requestWithChatAndText(id, text) {
    return {
        body: {
            message: {
                chat: {
                    id,
                },
                text
            },
        },
    };
}

function mockResponse() {
    return {sendStatus: jest.fn()};
}

describe('Telegram Bot', () => {

    beforeEach(async () => {
        const snapshot = await admin.firestore().collection('partidas').get()
        await Promise.all(snapshot.docs.map(doc => doc.ref.delete()));
    })
    afterEach(async () => {
        const snapshot = await admin.firestore().collection('partidas').get()
        await Promise.all(snapshot.docs.map(doc => doc.ref.delete()));
        jest.resetModules()
    })
    describe('when creating new game', () => {
        it('creates a new game', async () => {
            const res = mockResponse()
            const req = requestWithChatAndText(12345, '/create');
            const mockBot = mockTelegramBot();

            const functions = require('./index')
            await functions.telegramBot(req, res);

            expect(res.sendStatus).toHaveBeenCalledWith(200)
            expect(mockBot.sendMessage).toHaveBeenCalledWith(
                12345,
                expect.stringMatching(/^Se ha creado una nueva partida/),
                { parse_mode: 'Markdown' }
            )
        })
        it('removes from previous game if already joined', async () => {
            await admin.firestore().collection('partidas').doc('CDE456').set({
                chatIds: [12345]
            });
            const res = mockResponse()
            const req = requestWithChatAndText(12345, '/create');
            const mockBot = mockTelegramBot();

            const functions = require('./index')
            await functions.telegramBot(req, res);

            expect(res.sendStatus).toHaveBeenCalledWith(200)
            expect(mockBot.sendMessage).toHaveBeenCalledWith(
                12345,
                expect.stringMatching(/^Se ha creado una nueva partida/),
                { parse_mode: 'Markdown' }
            )
            const previousGame = await admin.firestore().collection('partidas').doc('CDE456').get()
            expect(previousGame.data().chatIds).toStrictEqual([])
        })
    })

    describe('when joining', () => {
        it('does not join if not valid game', async () => {
            const res = mockResponse()
            const req = requestWithChatAndText(12345, '/join ABC123');
            const mockBot = mockTelegramBot();


            const functions = require('./index')
            await functions.telegramBot(req, res);


            expect(res.sendStatus).toHaveBeenCalledWith(200)
            expect(mockBot.sendMessage).toHaveBeenCalledWith(12345, "El código ABC123 no es válido")

        });

        it('joins if valid game', async () => {
            const res = mockResponse()
            await admin.firestore().collection('partidas').doc('ABC123').set({
                chatIds: [98765]
            });
            const req = requestWithChatAndText(12345, '/join ABC123');
            const mockBot = mockTelegramBot();

            const functions = require('./index')
            await functions.telegramBot(req, res);

            expect(res.sendStatus).toHaveBeenCalledWith(200)
            expect(mockBot.sendMessage).toHaveBeenCalledWith(12345, "Te has unido a la partida con código ABC123")
        });

        it('does not join if already in another game', async () => {
            const res = mockResponse()
            await admin.firestore().collection('partidas').doc('ABC123').set({
                chatIds: [98765]
            });
            await admin.firestore().collection('partidas').doc('DEF456').set({
                chatIds: [12345]
            });
            const req = requestWithChatAndText(12345, '/join ABC123');
            const mockBot = mockTelegramBot();

            const functions = require('./index')
            await functions.telegramBot(req, res);

            expect(res.sendStatus).toHaveBeenCalledWith(200)
            expect(mockBot.sendMessage).toHaveBeenCalledWith(12345, "Te has unido a la partida con código ABC123")

        })

        it('does not join if already in the game', async () => {
            const res = mockResponse()
            await admin.firestore().collection('partidas').doc('ABC123').set({
                chatIds: [12345]
            });
            const req = requestWithChatAndText(12345, '/join ABC123');
            const mockBot = mockTelegramBot();

            const functions = require('./index')
            await functions.telegramBot(req, res);

            expect(res.sendStatus).toHaveBeenCalledWith(200)
            expect(mockBot.sendMessage).toHaveBeenCalledWith(12345, "Ya estás en la partida ABC123.")
        })
    })
});
