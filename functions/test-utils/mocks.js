function mockTelegramBot() {
    const mockBot = {
        sendMessage: jest.fn()
    }
    jest.mock('../telegram-bot/infrastructure/telegram-bot-creator', () => ({
        TelegramBotCreator: {create: () => mockBot}
    }))
    return mockBot;
}

function mockRandomNumberGenerator(number) {
    const mockRandomNumberGenerator = {
        get: () => number
    }
    jest.mock('../telegram-bot/infrastructure/random-number-generator', () => ({
        RandomNumberGenerator: { create: () => mockRandomNumberGenerator }
    }))
    return mockRandomNumberGenerator
}

function mockDelayedExecutor() {
    const mockExecutor = {
        execute: (fn) => fn()
    }
    jest.mock('../telegram-bot/infrastructure/delayed-executor', () => ({
        DelayedExecutor: { create: () => mockExecutor }
    }))
    return mockExecutor
}

function mockGptMessageGenerator(message) {
    const mockGenerator = {
        generate: async () => message
    }
    jest.mock('../telegram-bot/infrastructure/gpt-message-generator', () => ({
        GptMessageGenerator: { create: () => mockGenerator }
    }))
}

function mockGptThemeGenerator(message) {
    const mockGenerator = {
        generate: async () => message
    }
    jest.mock('../telegram-bot/infrastructure/gpt-theme-generator', () => ({
        GptThemeGenerator: { create: () => mockGenerator }
    }))
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

module.exports = {
    mockTelegramBot,
    mockDelayedExecutor,
    mockGptMessageGenerator,
    mockRandomNumberGenerator,
    mockResponse,
    requestWithChatAndText,
    mockGptThemeGenerator
}