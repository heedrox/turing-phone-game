// const admin = require('firebase-admin');
const admin = require('firebase-admin');
require('dotenv').config();


admin.initializeApp();

const mockBot = {
    sendMessage: jest.fn()
}


describe('Telegram Bot', () => {

    it('joins a valid game', async () => {
        const res = { sendStatus: jest.fn() }
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
        jest.mock('./infrastructure/telegram-bot-creator', () => ({
          TelegramBotCreator: { create: () => mockBot }
        }))


        const functions = require('./index')
        await functions.telegramBot(req, res);


        expect(res.sendStatus).toHaveBeenCalledWith(200)
        expect(mockBot.sendMessage).toHaveBeenCalledWith(12345, "El código ABC123 no es válido")
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
