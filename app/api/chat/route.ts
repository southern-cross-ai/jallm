import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Initialize your custom OpenAI client
const client = new OpenAI({
  baseURL: "http://13.239.88.166:8000/v1",
  apiKey: "EMPTY"
});

// Store chat history in memory (in production, use a database)
let chatHistory: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
  { role: "system", content: "You are JoeyLLM, an assistant developed by Southern Cross AI." }
];

export async function POST(request: NextRequest) {
  try {
    const { query, resetHistory } = await request.json();

    // Reset chat history if requested
    if (resetHistory) {
      chatHistory = [
        { role: "system", content: "You are JoeyLLM, an assistant developed by Southern Cross AI." }
      ];
      return NextResponse.json({ result: "Chat history reset." });
    }

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Query is required and must be a string' },
        { status: 400 }
      );
    }

    // Add user message to history
    chatHistory.push({ role: "user", content: query });

    // Create streaming response
    const stream = await client.chat.completions.create({
      model: "Joey",
      messages: chatHistory,
      stream: true,
    });

    let responseText = "";
    
    // Collect the streaming response
    for await (const chunk of stream) {
      const token = chunk.choices[0]?.delta?.content;
      if (token) {
        responseText += token;
      }
    }

    // Add assistant response to history
    chatHistory.push({ role: "assistant", content: responseText });

    return NextResponse.json({ 
      result: responseText,
      historyLength: chatHistory.length 
    });

  } catch (error: any) {
    console.error('Chat API Error:', error);
    return NextResponse.json(
      { error: 'Failed to get response from LLM: ' + error.message },
      { status: 500 }
    );
  }
}

// Optional: Add a GET endpoint to retrieve chat history
export async function GET() {
  return NextResponse.json({ 
    history: chatHistory,
    length: chatHistory.length 
  });
}

// Optional: Add a DELETE endpoint to clear chat history
export async function DELETE() {
  chatHistory = [
    { role: "system", content: "You are JoeyLLM, an assistant developed by Southern Cross AI." }
  ];
  return NextResponse.json({ result: "Chat history cleared." });
}