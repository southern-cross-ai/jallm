import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Initialize your custom OpenAI client
const client = new OpenAI({
  baseURL: "http://13.239.88.166:8000/v1",
  apiKey: "EMPTY"
});

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json();

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json(
        { error: 'Prompt is required and must be a string' },
        { status: 400 }
      );
    }

    // Construct the haiku generation prompt
    const haikuPrompt = `Write a haiku (5-7-5 syllable pattern) based on this prompt: "${prompt}". 

Please only respond with the haiku, with appropriate line breaks between each line.  Do not add in any commentary about it, including the line number or syllable count.

Please ensure that there are three lines, one with 5 syllables, another with 7 syllables, and one with 5 syllables again (all in that order).

At least once, add a random exclamation that is Australian slang or a cultural reference at the end of a line in parentheses (e.g. "Roses are red (crikey!)").  Do not swear.`;

    // Create a focused conversation for haiku generation
    const messages = [
      { role: "system" as const, content: "You are an expert at writing eloquent and poetic 3-line haikus that strictly follow the 5-7-5 syllable pattern. You also talk like a stereotypical Australian." },
      { role: "user" as const, content: haikuPrompt }
    ];

    // Create streaming response
    const stream = await client.chat.completions.create({
      model: "Joey",
      messages: messages,
      stream: true,
      temperature: 0.8, // Higher temperature for more creative haikus
    });

    let responseText = "";
    
    // Collect the streaming response
    for await (const chunk of stream) {
      const token = chunk.choices[0]?.delta?.content;
      if (token) {
        responseText += token;
      }
    }

    // Clean up the response and ensure proper formatting
    const haiku = responseText.trim();

    return NextResponse.json({ haiku });

  } catch (error: any) {
    console.error('Error generating haiku:', error);
    return NextResponse.json(
      { error: 'Failed to generate haiku: ' + error.message },
      { status: 500 }
    );
  }
}
