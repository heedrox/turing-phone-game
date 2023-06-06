// const admin = require('firebase-admin');
const admin = require('firebase-admin');
const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config();


admin.initializeApp();

const functions = require('./index')
const botApi = jest.mock('node-telegram-bot-api');

describe('Telegram Bot', () => {

    it('joins a valid game', async () => {
        const req = {
            body: {
                message: {
                    chat: {
                        id: 12345,
                    },
                    text: '/join ABC123',
                },
            },
        };

        await functions.telegramBot(req);


        expect(botApi.sendMessage).toHaveBeenCalledWith('xx')
    });

    xit('should create a new partida', async () => {
        const req = {
            body: {
                message: {
                    chat: {
                        id: 12345,
                    },
                    text: '/create',
                },
            },
        };

        await functions.telegramBot(req, {});

        expect(botStub).toHaveBeenCalledTimes(1);
        expect(botStub).toHaveBeenCalledWith('YOUR_TELEGRAM_TOKEN');
        expect(sendMessageStub).toHaveBeenCalledTimes(1);
        expect(sendMessageStub).toHaveBeenCalledWith(expect.any(Number), expect.stringContaining('Se ha creado una nueva partida'));
        expect(db.collection).toHaveBeenCalledTimes(2);
        expect(db.collection).toHaveBeenCalledWith('partidas');
        expect(db.doc).toHaveBeenCalledTimes(1);
        expect(db.doc).toHaveBeenCalledWith(expect.any(String));
        expect(db.set).toHaveBeenCalledTimes(1);
        expect(db.set).toHaveBeenCalledWith({
            chatIds: expect.arrayContaining([12345]),
        });
    });
});
