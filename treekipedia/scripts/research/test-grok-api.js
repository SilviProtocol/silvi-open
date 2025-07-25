#!/usr/bin/env node

/**
 * Grok API Test Script
 * 
 * Tests various Grok API configurations to understand its behavior
 */

const axios = require('axios');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const XAI_API_KEY = process.env.XAI_API_KEY;
const XAI_API_URL = 'https://api.x.ai/v1/chat/completions';

console.log('🧪 Grok API Test Suite\n');

// Test 1: Basic API call without web search
async function testBasicCall() {
  console.log('Test 1: Basic API call (no web search)');
  
  const payload = {
    model: 'grok-3-mini',
    messages: [
      {
        role: 'user',
        content: 'What is 2+2? Reply with just the number.'
      }
    ],
    temperature: 0,
    max_tokens: 100
  };
  
  try {
    const response = await axios.post(XAI_API_URL, payload, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${XAI_API_KEY}`
      }
    });
    
    console.log('✅ Success!');
    console.log('Full response structure:');
    console.log(JSON.stringify(response.data, null, 2));
    console.log('Message content:', response.data.choices[0].message.content);
    console.log('Usage:', response.data.usage);
    console.log('---\n');
    return true;
  } catch (error) {
    console.error('❌ Failed:', error.response?.data || error.message);
    console.log('---\n');
    return false;
  }
}

// Test 2: Web search with low settings
async function testWebSearchLow() {
  console.log('Test 2: Web search with LOW settings');
  
  const payload = {
    model: 'grok-3-mini',
    messages: [
      {
        role: 'user',
        content: 'What is the current weather in San Francisco? Give a brief answer.'
      }
    ],
    temperature: 0.3,
    max_tokens: 100,
    reasoning_effort: 'low',
    web_search_options: {
      search_context_size: 'low'
    }
  };
  
  try {
    const start = Date.now();
    const response = await axios.post(XAI_API_URL, payload, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${XAI_API_KEY}`
      }
    });
    
    console.log('✅ Success!');
    console.log('Duration:', Date.now() - start, 'ms');
    console.log('Response:', response.data.choices[0].message.content.substring(0, 200) + '...');
    console.log('Usage:', response.data.usage);
    console.log('Sources used:', response.data.usage?.num_sources_used || 'unknown');
    console.log('---\n');
    return true;
  } catch (error) {
    console.error('❌ Failed:', error.response?.data || error.message);
    console.log('---\n');
    return false;
  }
}

// Test 3: JSON response format
async function testJSONResponse() {
  console.log('Test 3: JSON response format');
  
  const payload = {
    model: 'grok-3-mini',
    messages: [
      {
        role: 'system',
        content: 'You must respond ONLY with valid JSON. No additional text before or after the JSON.'
      },
      {
        role: 'user',
        content: 'Create a JSON object with two fields: "name" (value: "oak tree") and "height" (value: 30). Return only the JSON.'
      }
    ],
    temperature: 0,
    max_tokens: 100
  };
  
  try {
    const response = await axios.post(XAI_API_URL, payload, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${XAI_API_KEY}`
      }
    });
    
    const content = response.data.choices[0].message.content;
    console.log('✅ Success!');
    console.log('Response:', content);
    
    // Try to parse as JSON
    try {
      const parsed = JSON.parse(content);
      console.log('✅ Valid JSON:', parsed);
    } catch (e) {
      console.log('⚠️  Invalid JSON:', e.message);
    }
    
    console.log('---\n');
    return true;
  } catch (error) {
    console.error('❌ Failed:', error.response?.data || error.message);
    console.log('---\n');
    return false;
  }
}

// Test 4: Complex botanical query with medium settings
async function testBotanicalQuery() {
  console.log('Test 4: Botanical query with MEDIUM settings');
  
  const payload = {
    model: 'grok-3-mini',
    messages: [
      {
        role: 'system',
        content: 'You are a botanical expert. Return your response as JSON with fields for each characteristic found.'
      },
      {
        role: 'user',
        content: 'Research Ginkgo biloba and provide JSON with these fields: growth_form, leaf_type, maximum_height. Use "Data not available" for missing data.'
      }
    ],
    temperature: 0.3,
    max_tokens: 500,
    reasoning_effort: 'medium',
    web_search_options: {
      search_context_size: 'medium'
    }
  };
  
  try {
    const start = Date.now();
    const response = await axios.post(XAI_API_URL, payload, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${XAI_API_KEY}`
      },
      timeout: 30000 // 30 second timeout
    });
    
    const content = response.data.choices[0].message.content;
    console.log('✅ Success!');
    console.log('Duration:', Date.now() - start, 'ms');
    console.log('Response:', content);
    console.log('Usage:', response.data.usage);
    console.log('Reasoning tokens:', response.data.usage?.completion_tokens_details?.reasoning_tokens || 0);
    console.log('---\n');
    return true;
  } catch (error) {
    console.error('❌ Failed:', error.response?.data || error.message);
    if (error.code === 'ECONNABORTED') {
      console.log('⏱️  Request timed out after 30 seconds');
    }
    console.log('---\n');
    return false;
  }
}

// Test 5: High reasoning effort test
async function testHighReasoning() {
  console.log('Test 5: HIGH reasoning effort test');
  
  const payload = {
    model: 'grok-3-mini',
    messages: [
      {
        role: 'user',
        content: 'What is the maximum height of a Ginkgo biloba tree? Respond with just a number in meters.'
      }
    ],
    temperature: 0,
    max_tokens: 50,
    reasoning_effort: 'high',
    web_search_options: {
      search_context_size: 'high'
    }
  };
  
  try {
    const start = Date.now();
    const response = await axios.post(XAI_API_URL, payload, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${XAI_API_KEY}`
      },
      timeout: 60000 // 60 second timeout for high reasoning
    });
    
    console.log('✅ Success!');
    console.log('Duration:', Date.now() - start, 'ms');
    console.log('Response:', response.data.choices[0].message.content);
    console.log('Total tokens:', response.data.usage?.total_tokens);
    console.log('Reasoning tokens:', response.data.usage?.completion_tokens_details?.reasoning_tokens || 0);
    console.log('---\n');
    return true;
  } catch (error) {
    console.error('❌ Failed:', error.response?.data || error.message);
    console.log('---\n');
    return false;
  }
}

// Test 6: Available models
async function testListModels() {
  console.log('Test 6: List available models');
  
  try {
    const response = await axios.get('https://api.x.ai/v1/models', {
      headers: {
        'Authorization': `Bearer ${XAI_API_KEY}`
      }
    });
    
    console.log('✅ Available models:');
    response.data.data.forEach(model => {
      console.log(`  - ${model.id}`);
    });
    console.log('---\n');
    return true;
  } catch (error) {
    console.error('❌ Failed:', error.response?.data || error.message);
    console.log('---\n');
    return false;
  }
}

// Run all tests
async function runTests() {
  if (!XAI_API_KEY) {
    console.error('❌ XAI_API_KEY not found in .env file');
    return;
  }
  
  console.log('API Key format:', XAI_API_KEY.substring(0, 10) + '...');
  console.log('API URL:', XAI_API_URL);
  console.log('---\n');
  
  const tests = [
    testBasicCall,
    testWebSearchLow,
    testJSONResponse,
    testBotanicalQuery,
    testHighReasoning,
    testListModels
  ];
  
  let passed = 0;
  for (const test of tests) {
    const result = await test();
    if (result) passed++;
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log(`\n📊 Test Results: ${passed}/${tests.length} passed`);
}

// Run the tests
runTests().catch(console.error);