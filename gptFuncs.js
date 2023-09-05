
// Description: Functions for interacting with OpenAI's GPT-3.5 API
async function getChatCompletion(promptReq,openAiInstance) {
  // Validation for promptReq.text
  try {
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
  } catch (error) {
    console.error(`Error in getChatCompletion: ${error.message}`);
    return {response: ['Error with openAI API']}
    //throw new Error(`Error in getChatCompletion: ${error.message}`);
  }
}

// pass prompt through openAI safety filters
async function checkContentSafety(promptReq, openAiInstance) {
  try {
    const response = await openAiInstance.createModeration({
      input: promptReq.promptText,
    })
    const moderationResponse = await response.data;
    if (moderationResponse.results[0].flagged === false) {
      return 'safe'
    }
    else {
      return 'unsafe'
    }
  } catch (error) {
    console.error(`Error in checkContentSafety: ${error.message}`);
    return {response: ['Error with openAI API']}
    //throw new Error(`Error in checkContentSafety: ${error.message}`);
  }
}

// submits outline to gpt-3.5 to generate article
async function getArticle(prompt,openAiInstance) {
  try {
    const modResults = await checkContentSafety(prompt,openAiInstance)
    if (modResults === 'safe') {
      context = [{role: "system", content: "You will be given a keyword, sentence or phrase, you will need to return an article that follows the outline."}]
      context.push({ role: 'user', content: prompt.promptText })
      const response = await openAiInstance.createChatCompletion({
        model: 'gpt-3.5-turbo',
        messages: context,
        max_tokens: 200
      });
      const textResponse = await response.data.choices[0].message.content;
      const Article = textResponse + '\n\n************************\n THIS ARTICLE IS SHORTENED FOR DEMO PURPOSES \n************************\n'
      // Convert Article Response To List To Standardize Responses And Make It Easier To Add More Article Responses In The Future
      return {response: [Article]}
    } else {
      return {response: ['Content Moderation Fail. Please Try Again']}
    }
  } catch (error) {
    console.error(`Error in getArticle: ${error.message}`);
    return {response: ['Error with openAI API']}
    //throw new Error(`Error in getArticle: ${error.message}`);
  }
}

async function getSubheadingCompletion(prompt,context,openAiInstance) {
  try {
    const modResults = await checkContentSafety(prompt,openAiInstance)
    if (modResults === 'safe') {
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
  } catch (error) {
    console.error(`Error in getSubheadingCompletion: ${error.message}`);
    return {response: ['Error with openAI API']}
    //throw new Error(`Error in getSubheadingCompletion: ${error.message}`);
  }
}

module.exports = {
  getChatCompletion,
  getArticle
}
