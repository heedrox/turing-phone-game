const functions = require("firebase-functions");
const { Configuration, OpenAIApi } = require("openai");

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//   functions.logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });


const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

const PROMPT_TEMPLATE = (question) => `The following is a conversation with an AI assistant. The assistant is joyful, clever and very friendly, and always answers with one sentence. Human: ${question} IA: `

const allowDomainCors = (request, response) => {
    const origin = request.get('Origin')
    response.set("Access-Control-Allow-Origin", origin ? origin : "*");
}
exports.aiTest = functions.https.onRequest(async (request, response) => {
    allowDomainCors(request, response)
    const question = request.query.question

    if (!question) {
        response.status(400).send({ error: { code: 400, description: "Please, add a question parameter." }})
        return
    }
    const completion = await openai.createCompletion({
        model: "text-curie-001",
        prompt: PROMPT_TEMPLATE(question),
        temperature: 0,
        max_tokens: 200,
    });

    response.send(completion.data.choices[0].text)
})
