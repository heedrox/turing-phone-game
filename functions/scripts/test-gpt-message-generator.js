const { GptMessageGenerator } = require("../telegram-bot/infrastructure/gpt-message-generator")

const generator = GptMessageGenerator.create()

const MESSAGES = [

]
const result = await generator.generate(MESSAGES)