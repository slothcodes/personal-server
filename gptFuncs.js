
// Description: Functions for interacting with OpenAI's GPT-3.5 API
async function getChatCompletion(promptReq,openAiInstance) {
  // Validation for promptReq.text
  console.log('incoming prompt',promptReq)
  if (!promptReq.promptText || typeof promptReq.promptText !== 'string') {
      return({list: ['Invalid prompt']});
  }
  // switch for routing prompts based on type 
  switch (promptReq.promptType) {
    case 'questions':
      context = [{role: "system", content: "You will be given a keyword, sentence or phrase, you will need to return an array of 15 question subheadings that are in the following format: '1 subheading, 2 subheading'"}]
      return await getSubheadingCompletion(promptReq,context,openAiInstance);
    case 'mistakes':
      context = [{role: "system", content: "You will be given a keyword, sentence or phrase, you will need to return an array of 15 mistakes subheadings that are in the following format: '1 subheading, 2 subheading'"}]
      return await getSubheadingCompletion(promptReq,context,openAiInstance);
    case 'myths':
      context = [{role: "system", content: "You will be given a keyword, sentence or phrase, you will need to return an array of 15 myths subheadings that are in the following format: '1 subheading, 2 subheading'"}]
      return await getSubheadingCompletion(promptReq,context,openAiInstance);
    case 'facts':
      context = [{role: "system", content: "You will be given a keyword, sentence or phrase, you will need to return an array of 15 facts subheadings that are in the following format: '1 subheading, 2 subheading'"}]
      return await getSubheadingCompletion(promptReq,context,openAiInstance);
    case 'tips':
      context = [{role: "system", content: "You will be given a keyword, sentence or phrase, you will need to return an array of 15 tips subheadings that are in the following format: '1 subheading, 2 subheading'"}]
      return await getSubheadingCompletion(promptReq,context,openAiInstance);
    case 'benefits':
      context = [{role: "system", content: "You will be given a keyword, sentence or phrase, you will need to return an array of 15 benefits subheadings that are in the following format: '1 subheading, 2 subheading'"}]
      return await getSubheadingCompletion(promptReq,context,openAiInstance);
  }
}

// pass prompt through openAI safety filters
async function checkContentSafety(promptReq,openAiInstance) {
  try {
    const response = await openAiInstance.createContentFilter({
      prompt: promptReq.promptText,
      labels: ['safe', 'unsafe'],
      query: 'safe'
    });
    return response.data.label;   
  } catch (err) {
    console.log(err);
  }
}



// submits outline to gpt-3.5 to generate article
async function getArticle(prompt,openAiInstance) {
  if (checkContentSafety(prompt,openAiInstance) === 'safe') {
    context = [{role: "system", content: "You will be given a keyword, sentence or phrase, you will need to return an article that follows the outline."}]
    context.push({ role: 'user', content: prompt.promptText })
    const response = await openAiInstance.createChatCompletion({
      model: 'gpt-3.5-turbo',
      messages: context,
      max_tokens: 100
    });
    const textResponse = await response.data.choices[0].message.content;
    // Convert Article Response To List To Standardize Responses And Make It Easier To Add More Article Responses In The Future
    return {response: [textResponse]}
  } else {
    return {response: ['Content Moderation Fail. Please Try Again']}
  }
}

async function getSubheadingCompletion(prompt,context,openAiInstance) {
  if (checkContentSafety(prompt,openAiInstance) === 'safe') {
    context.push({ role: 'user', content: prompt.promptText })
    const response = await openAiInstance.createChatCompletion({
      model: 'gpt-3.5-turbo',
      messages: context});
      const textResponse = await response.data.choices[0].message.content;
      const subheadingList = textResponse.split('subheading:');
      return {response: subheadingList}
  } else {
    return {response: ['Content Moderation Fail. Please Try Again']}
  }
}

module.exports = {
  getChatCompletion,
  getArticle
}
