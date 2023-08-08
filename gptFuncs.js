const {OpenAIApi} = require('openai');

const openai = new OpenAIApi({
  api_key: 'YOUR-API-KEY-HERE'
});

async function getChatCompletion(prompt) {
  const response = await openai.createChatCompletion({
    model: 'gpt-3.5-turbo',
    messages: [
      { role: 'user', content: prompt }
    ]
  });
  return response.data;
}

module.exports = getChatCompletion;
