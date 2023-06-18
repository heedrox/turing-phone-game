const admin = require('firebase-admin');
const { removeDatabase } = require('../test-utils/remove-database')
const { mockDelayedExecutor, mockGptMessageGenerator, mockRandomNumberGenerator, mockResponse, mockTelegramBot, requestWithChatAndText, mockGptThemeGenerator } = require('../test-utils/mocks')

require('dotenv').config();

if (admin.apps.length === 0) {
    admin.initializeApp();
}

describe('Telegram Bot', () => {

    beforeEach(async () => {
        const snapshot = await admin.firestore().collection('partidas').get()
        await Promise.all(snapshot.docs.map(doc => doc.ref.delete()));
        await removeDatabase(admin.firestore());
    })
    afterEach(async () => {
        const snapshot = await admin.firestore().collection('partidas').get()
        await Promise.all(snapshot.docs.map(doc => doc.ref.delete()));
        await removeDatabase(admin.firestore());
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
            const game = games.docs[0].data()
            expect(game.chatIds).toContain(12345)
            const createdCode = games.docs[0].id
            const players = await admin.firestore().doc(`partidas/${createdCode}/players/12345`).get()
            expect(players.data()).toStrictEqual({
                id: 12345,
                name: expect.stringMatching(/^.{4,}$/),
                emoji: expect.stringMatching(/^.{2,}$/)
            })
            expect(game.aiName).toBeDefined()
            expect(game.aiEmoji).toBeDefined()
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

    describe('when executing go', () => {
        it('does not start game if user is not in game', async () => {
            const res = mockResponse()
            const req = requestWithChatAndText(12345, '/go');
            const mockBot = mockTelegramBot();

            const functions = require('./index')
            await functions.telegramBot(req, res);

            expect(res.sendStatus).toHaveBeenCalledWith(200)
            expect(mockBot.sendMessage).toHaveBeenCalledWith(12345, 'No te has unido a ninguna partida. Usa el comando "/join CODIGO" para unirte a una, o "/create" para crear una nueva.')
        })
        it('starts game, suggesting a theme', async () => {
            const res = mockResponse()
            const req = requestWithChatAndText(12345, '/go');
            const mockBot = mockTelegramBot();
            await admin.firestore().collection('partidas').doc('ABC123').set({
                chatIds: [12345, 67890, 19283]
            });
            mockGptThemeGenerator('Contexto: Pregunta de opinión.')

            const functions = require('./index')
            await functions.telegramBot(req, res);

            expect(res.sendStatus).toHaveBeenCalledWith(200)
            const game = await admin.firestore().doc('partidas/ABC123').get()
            expect(game.data().started).toStrictEqual(1)
            expect(mockBot.sendMessage).toHaveBeenCalledWith(12345, '¡Empieza la partida, suerte! Contexto: Pregunta de opinión.')
            expect(mockBot.sendMessage).toHaveBeenCalledWith(67890, '¡Empieza la partida, suerte! Contexto: Pregunta de opinión.')
            expect(mockBot.sendMessage).toHaveBeenCalledWith(19283, '¡Empieza la partida, suerte! Contexto: Pregunta de opinión.')
            const messages = await admin.firestore().collection('partidas/ABC123/messages').get()                 
            const docs = messages.docs.map(d => d.data())
            expect(docs).toContainEqual({
                "created": expect.anything(),
                "content": "¡Empieza la partida, suerte! Contexto: Pregunta de opinión.",
                "playerName": "ai",
                "playerId": 0
            })
        })
        it('does not start game if not 2 players at least', async () => {
            const res = mockResponse()
            const req = requestWithChatAndText(12345, '/go');
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
        describe('when not started game', () => {
            it('broadcasts message without username and emoji', async () => {
                const res = mockResponse()
                await admin.firestore().collection('partidas').doc('ABC123').set({
                    chatIds: [12345, 67890, 19283]
                });
                await admin.firestore().doc('partidas/ABC123/players/12345').set({
                    id: 12345,
                    name: 'name1',
                    emoji: 'emoji1'
                })
                const req = requestWithChatAndText(12345, 'Hello!');
                const mockBot = mockTelegramBot();
    
                const functions = require('./index')
                await functions.telegramBot(req, res);
    
                expect(res.sendStatus).toHaveBeenCalledWith(200)
                expect(mockBot.sendMessage).toHaveBeenCalledWith(67890, 'Hello!', { parse_mode: 'HTML' })
                expect(mockBot.sendMessage).toHaveBeenCalledWith(19283, 'Hello!', { parse_mode: 'HTML' })
            })
            it('answers back the user that it must start with /go command', async () => {
                const res = mockResponse()
                await admin.firestore().collection('partidas').doc('ABC123').set({
                    chatIds: [12345, 67890, 19283]
                });
                await admin.firestore().doc('partidas/ABC123/players/12345').set({
                    id: 12345,
                    name: 'name1',
                    emoji: 'emoji1'
                })
                const req = requestWithChatAndText(12345, 'Hello!');
                const mockBot = mockTelegramBot();
    
                const functions = require('./index')
                await functions.telegramBot(req, res);
    
                expect(res.sendStatus).toHaveBeenCalledWith(200)
                expect(mockBot.sendMessage).toHaveBeenCalledWith(12345, `Recuerda que la partida no ha empezado todavía. Puedes escribir "/go" para comenzarla.`)
            })
            it('does not persist messages', async () => {
                const res = mockResponse()
                await admin.firestore().collection('partidas').doc('ABC123').set({
                    chatIds: [12345, 67890, 19283]
                });
                await admin.firestore().doc('partidas/ABC123/players/12345').set({
                    id: 12345,
                    name: 'name1',
                    emoji: 'emoji1'
                })
                const req = requestWithChatAndText(12345, 'Hello!');
                const mockBot = mockTelegramBot();
    
                const functions = require('./index')
                await functions.telegramBot(req, res);
    
                const messages = await admin.firestore().collection('partidas/ABC123/messages').get()                 
                expect(messages.docs.length).toBe(0)
            })
        })
       
        describe('when started game', () => {
            beforeEach(async () => {
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
                await admin.firestore().doc('partidas/ABC123').update({
                    aiName: 'name-ai',
                    aiEmoji: 'emoji-ai'
                })
                mockDelayedExecutor()
            })
            it('broadcasts message with username and emoji', async () => {
                const res = mockResponse()
                const req = requestWithChatAndText(12345, 'Hello!');
                const mockBot = mockTelegramBot();
                mockRandomNumberGenerator(0.25);
    
                const functions = require('./index')
                await functions.telegramBot(req, res);
    
                expect(res.sendStatus).toHaveBeenCalledWith(200)
                expect(mockBot.sendMessage).toHaveBeenCalledWith(67890, '<b>emoji1 name1</b>: Hello!', { parse_mode: 'HTML' })
                expect(mockBot.sendMessage).toHaveBeenCalledWith(19283, '<b>emoji1 name1</b>: Hello!', { parse_mode: 'HTML' })
            })
            it('persists them in database', async () => {
                const res = mockResponse()
                const req = requestWithChatAndText(12345, 'Hello!');
                const mockBot = mockTelegramBot();
                mockRandomNumberGenerator(0.25);
    
                const functions = require('./index')
                await functions.telegramBot(req, res);
                
                const messages = await admin.firestore().collection('partidas/ABC123/messages').get()                 
                expect(messages.docs[0].data()).toStrictEqual({
                    "created": expect.anything(),
                    "content": "Hello!",
                    "playerName": "name1",
                    "playerId": 12345
                })
            })
            it('gets an answer from GPT if greater than 50% chance', async () => {

                const res = mockResponse()
                const req = requestWithChatAndText(12345, 'Hello!');
                const mockBot = mockTelegramBot();
                mockRandomNumberGenerator(0.75);
                mockGptMessageGenerator('HelloGPT!')
    
                const functions = require('./index')
                await functions.telegramBot(req, res);
    
                expect(res.sendStatus).toHaveBeenCalledWith(200)
                expect(mockBot.sendMessage).toHaveBeenCalledWith(67890, '<b>emoji-ai name-ai</b>: HelloGPT!', { parse_mode: 'HTML' })
                expect(mockBot.sendMessage).toHaveBeenCalledWith(19283, '<b>emoji-ai name-ai</b>: HelloGPT!', { parse_mode: 'HTML' })
                expect(mockBot.sendMessage).toHaveBeenCalledWith(12345, '<b>emoji-ai name-ai</b>: HelloGPT!', { parse_mode: 'HTML' })
            }) 
            it('the answer from GPT is persisted', async () => {
                const res = mockResponse()
                const req = requestWithChatAndText(12345, 'Hello!');
                mockTelegramBot();
                mockRandomNumberGenerator(0.75);
                mockGptMessageGenerator('HelloGPT!')
    
                const functions = require('./index')
                await functions.telegramBot(req, res);
    
                expect(res.sendStatus).toHaveBeenCalledWith(200)
                const messages = await admin.firestore().collection('partidas/ABC123/messages').get()                 
                const docs = messages.docs.map(d => d.data())
                expect(docs).toContainEqual({
                    "created": expect.anything(),
                    "content": "Hello!",
                    "playerName": "name1",
                    "playerId": 12345
                })
                expect(docs).toContainEqual({
                    "created": expect.anything(),
                    "content": "HelloGPT!",
                    "playerName": "name-ai",
                    "playerId": "ai"
                })
            }) 
            it('does not get an answer from GPT if less than 50% chance', async () => {
                const res = mockResponse()
                const req = requestWithChatAndText(12345, 'Hello!');
                const mockBot = mockTelegramBot();
                mockRandomNumberGenerator(0.25);
                mockGptMessageGenerator('HelloGPT!')
    
                const functions = require('./index')
                await functions.telegramBot(req, res);
    
                expect(res.sendStatus).toHaveBeenCalledWith(200)
                expect(mockBot.sendMessage).not.toHaveBeenCalledWith(67890, '<b>emoji-ai name-ai</b>: HelloGPT!', { parse_mode: 'HTML' })
                expect(mockBot.sendMessage).not.toHaveBeenCalledWith(19283, '<b>emoji-ai name-ai</b>: HelloGPT!', { parse_mode: 'HTML' })
                expect(mockBot.sendMessage).not.toHaveBeenCalledWith(12345, '<b>emoji-ai name-ai</b>: HelloGPT!', { parse_mode: 'HTML' })
            }) 
        })
    })
});
