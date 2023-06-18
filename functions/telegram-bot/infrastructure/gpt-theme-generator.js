const fetch = require("node-fetch");

const ROLE_SYSTEM_INSTRUCTIONS = `Eres un recomendador de temas para conversaciones a grupos. Los temas pueden ser muy variopintos y usas todo tu corpus para extraer diferentes temas. Los temas están englobados en contextos. Los contextos pueden ser de:
- Geografía
- Espectáculos
- Historia
- Arte y Literatura
- Ciencia
- Deportes

Respondes diciendo el contexto, seguido de dos puntos, y luego el tema. El tema lo expones en forma de pregunta de opinión. 

Solo recomiendas un tema.`;

const queryGpt = async (previousMessages, temperature = 1) => {
    const openAiKey = process.env.OPENAI_API_KEY
    const messages = [
        {
            role: "system", content: ROLE_SYSTEM_INSTRUCTIONS,
        }
    ]
    
    const body = JSON.stringify({
        model: "gpt-3.5-turbo",
        messages,
        temperature: 1,
        max_tokens: 2048,
    })
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "post",
        body,
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${openAiKey}`,
            "Hello-From": "turing-phone-game.If you see this many times, maybe you should consider hiring me.",
        },
    });

    if (!response.ok) {
        throw response;
    }

    const responseJson = await response.json();
    const messageContent = responseJson.choices[0].message.content;


    return messageContent;
};

exports.GptThemeGenerator = {
    create: () => ({
        generate: async (previousMessages) => {
            return await queryGpt(previousMessages)
        }
    })
}