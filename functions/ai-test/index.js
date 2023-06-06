const {Configuration, OpenAIApi} = require("openai");

const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

const TEMPLATES_EN = [
    (q) => `The following is a conversation with an AI assistant. The assistant is joyful, clever and very friendly, and always answers with medium length sentences. Human: ${q} IA: `,
    (q) => `The following is a conversation with an AI assistant. The assistant is neutral, not very clever; always answers with a medium length sentences. Human: ${q} IA: `,
    (q) => `The following is a conversation with an AI assistant. The assistant is sometimes grumpy, although very clever. Always answers with a medium length sentences. Human: ${q} IA: `,
    (q) => q
]

const TEMPLATES_ES = [
    (q) => `Lo siguiente es una conversación con una IA. La IA es divertida, inteligente y amigable. El humano pregunta: ${q} La IA responde en español: `,
    (q) => `Lo siguiente es una conversación con una IA. La IA es neutral, no muy inteligente, siempre responde con frases de longitud media. El humano pregunta: ${q} La IA responde en español: `,
    (q) => `Lo siguiente es una conversación con una IA. La IA es gruñona, pero muy inteligente. Responde con frases de longitud media. El humano pregunta: ${q} La IA responde en español: `,
    (q) => `${q}. Responde en español: `,
]

const TEMPLATES = {
    es: TEMPLATES_ES,
    en: TEMPLATES_EN
}
const getRandomTemplate = (lang) => TEMPLATES[lang][Math.floor(Math.random()*TEMPLATES[lang].length)];
const PROMPT_TEMPLATE = (question, lang) => (getRandomTemplate(lang))(question);


const allowDomainCors = (request, response) => {
    const origin = request.get('Origin')
    response.set("Access-Control-Allow-Origin", origin ? origin : "*");
}

exports.aiTest = async (request, response) => {
    allowDomainCors(request, response)
    const question = request.query.question
    const lang = request.query.lang ? request.query.lang : 'en'

    if (!question) {
        response.status(400).send({ error: { code: 400, description: "Please, add a question parameter." }})
        return
    }

    const completion = await openai.createCompletion({
        model: "text-davinci-001",
        prompt: PROMPT_TEMPLATE(question, lang),
        temperature: 0,
        max_tokens: 200,

    });

    response.send({ possibleAnswer: completion.data.choices[0].text.trim() } )
}
