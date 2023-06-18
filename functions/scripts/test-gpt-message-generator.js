const { GptMessageGenerator } = require("../telegram-bot/infrastructure/gpt-message-generator")
require('dotenv').config()

const generator = GptMessageGenerator.create()

const MESSAGES = [
    {
        content: "¿Cuáles son vuestras películas favoritas?",
        playerName: "starter",
        playerId: 0
    },
    {
        content: "Ayer justo vimos The Flash, nos gustó mucho. Mola mucho cómo al final todo vuelve a ser como era entonces.",
        playerName: "Amapola Curiosa",
        playerId: 12345
    },
    {
        content: "Yo no he visto esa película, pero prefiero películas más clásicas como Dumbo",
        playerName: "Leon durmiente",
        playerId: 236452
    },

]

const TOTAL_PREDICTABILITY = 0

;(async () => {
    try {
        const result = await generator.generate(MESSAGES, TOTAL_PREDICTABILITY)
        console.log(result)
    } catch (error) {
        console.error(error)
    }
    
    
})()
