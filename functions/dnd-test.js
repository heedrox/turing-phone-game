const functions = require("firebase-functions");
const { Configuration, OpenAIApi } = require("openai");


const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

const allowDomainCors = (request, response) => {
    const origin = request.get('Origin')
    response.set("Access-Control-Allow-Origin", origin ? origin : "*");
}

exports.dndTest = functions.https.onRequest(async (request, response) => {
    allowDomainCors(request, response)
    const question = request.query.question
    const lang = request.query.lang ? request.query.lang : 'en'

    if (!question) {
        response.status(400).send({ error: { code: 400, description: "Please, add a question parameter." }})
        return
    }

    const completion = await openai.createCompletion({
        model: "text-davinci-003",
        prompt:question ,
        temperature: 0,
        max_tokens: 200,

    });

    response.header('Content-type', 'text/json')
    response.send({ result: completion.data  })
})
