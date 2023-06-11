// const admin = require('firebase-admin');
const admin = require('firebase-admin');
const functions = require("./index");
require('dotenv').config();

if (admin.apps.length === 0) {
    admin.initializeApp();
}

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

    it('returns gracefully when no message', async () => {
        const res = mockResponse()
        const req = { }
        const mockBot = mockTelegramBot();

        const functions = require('./index')
        await functions.telegramBot(req, res);

        expect(res.sendStatus).toHaveBeenCalledWith(200)
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
            const games = await admin.firestore().collection('partidas').get()
            expect(games.docs[0].data().chatIds).toContain(12345)
            const createdCode = games.docs[0].id
            const players = await admin.firestore().doc(`partidas/${createdCode}/players/12345`).get()
            expect(players.data()).toStrictEqual({
                id: 12345,
                name: expect.stringMatching(/^.{4,}$/),
                emoji: expect.stringMatching(/^.{2,}$/)
            })
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
            const game = await admin.firestore().doc('partidas/ABC123').get()
            expect(game.data().chatIds).toContain(12345)
            const players = await admin.firestore().doc(`partidas/ABC123/players/12345`).get()
            expect(players.data()).toStrictEqual({
                id: 12345,
                name: expect.stringMatching(/^.{4,}$/),
                emoji: expect.stringMatching(/^.{4,}$/)
            })
        });

        it('removes from another game if already in another game', async () => {
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

            const previousGame = await admin.firestore().collection('partidas').doc('DEF456').get()
            expect(previousGame.data().chatIds).toStrictEqual([])
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

    describe('when starting', () => {
        it('does not start game if user is not in game', async () => {
            const res = mockResponse()
            const req = requestWithChatAndText(12345, '/start');
            const mockBot = mockTelegramBot();

            const functions = require('./index')
            await functions.telegramBot(req, res);

            expect(res.sendStatus).toHaveBeenCalledWith(200)
            expect(mockBot.sendMessage).toHaveBeenCalledWith(12345, 'No te has unido a ninguna partida. Usa el comando "/join CODIGO" para unirte a una, o "/create" para crear una nueva.')
        })
        it('starts game', async () => {
            const res = mockResponse()
            const req = requestWithChatAndText(12345, '/start');
            const mockBot = mockTelegramBot();
            await admin.firestore().collection('partidas').doc('ABC123').set({
                chatIds: [12345, 67890, 19283]
            });

            const functions = require('./index')
            await functions.telegramBot(req, res);

            expect(res.sendStatus).toHaveBeenCalledWith(200)
            const game = await admin.firestore().doc('partidas/ABC123').get()
            expect(game.data().started).toStrictEqual(1)
            expect(mockBot.sendMessage).toHaveBeenCalledWith(12345, '¡Empieza la partida, suerte!')
            expect(mockBot.sendMessage).toHaveBeenCalledWith(67890, '¡Empieza la partida, suerte!')
            expect(mockBot.sendMessage).toHaveBeenCalledWith(19283, '¡Empieza la partida, suerte!')
        })
        it('does not start game if not 2 players at least', async () => {
            const res = mockResponse()
            const req = requestWithChatAndText(12345, '/start');
            const mockBot = mockTelegramBot();
            await admin.firestore().collection('partidas').doc('ABC123').set({
                chatIds: [12345]
            });

            const functions = require('./index')
            await functions.telegramBot(req, res);

            expect(res.sendStatus).toHaveBeenCalledWith(200)
            const game = await admin.firestore().doc('partidas/ABC123').get()
            expect(game.data().started).not.toStrictEqual(1)
            expect(mockBot.sendMessage).toHaveBeenCalledWith(12345, 'Todavía no se ha unido ningún jugador. Invita al menos a un jugador con el código ABC123 para empezar.')
        })
    })
    describe('when writing any message', () => {
        it('does not broadcast message if not in a game', async () => {
            const res = mockResponse()
            const req = requestWithChatAndText(12345, 'Hello!');
            const mockBot = mockTelegramBot();

            const functions = require('./index')
            await functions.telegramBot(req, res);

            expect(res.sendStatus).toHaveBeenCalledWith(200)
            expect(mockBot.sendMessage).toHaveBeenCalledWith(12345, 'No te has unido a ninguna partida. Usa el comando "/join CODIGO" para unirte a una, o "/create" para crear una nueva.')
        })
        it('broadcasts message when in a non started game', async () => {
            const res = mockResponse()
            await admin.firestore().collection('partidas').doc('ABC123').set({
                chatIds: [12345, 67890, 19283]
            });
            const req = requestWithChatAndText(12345, 'Hello!');
            const mockBot = mockTelegramBot();

            const functions = require('./index')
            await functions.telegramBot(req, res);

            expect(res.sendStatus).toHaveBeenCalledWith(200)
            expect(mockBot.sendMessage).toHaveBeenCalledWith(67890, 'Hello!')
            expect(mockBot.sendMessage).toHaveBeenCalledWith(19283, 'Hello!')
        })
        it('broadcasts message with username and emoji when im started game', async () => {
            const res = mockResponse()
            await admin.firestore().collection('partidas').doc('ABC123').set({
                chatIds: [12345, 67890, 19283],
                started: 1
            });
            await admin.firestore().doc('partidas/ABC123/players/12345').set({
                id: 12345,
                name: 'name1',
                emoji: 'emoji1'
            })
            await admin.firestore().doc('partidas/ABC123/players/67890').set({
                id: 67890,
                name: 'name2',
                emoji: 'emoji2'
            })
            await admin.firestore().doc('partidas/ABC123/players/19283').set({
                id: 19283,
                name: 'name3',
                emoji: 'emoji3'
            })
            const req = requestWithChatAndText(12345, 'Hello!');
            const mockBot = mockTelegramBot();

            const functions = require('./index')
            await functions.telegramBot(req, res);

            expect(res.sendStatus).toHaveBeenCalledWith(200)
            expect(mockBot.sendMessage).toHaveBeenCalledWith(67890, '*emoji1 name1*: Hello!')
            expect(mockBot.sendMessage).toHaveBeenCalledWith(19283, '*emoji1 name1*: Hello!')
        })
    })
});
