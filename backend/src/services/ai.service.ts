import OpenAI from 'openai';
import { config } from '../config';
import { logger } from '../config/logger';

const openai = new OpenAI({ apiKey: config.openai.apiKey });

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatResponse {
  content: string;
  tokensUsed: number;
  model: string;
}

export interface RecommendationInput {
  userId: string;
  context: Record<string, any>;
  limit?: number;
}

export interface PredictionInput {
  dataPoints: number[];
  horizon: number;
  type: 'trend' | 'anomaly' | 'forecast';
}

/**
 * AI Chat completion using OpenAI GPT
 */
export async function chatCompletion(
  messages: ChatMessage[],
  model?: string
): Promise<ChatResponse> {
  try {
    const response = await openai.chat.completions.create({
      model: model || config.openai.model,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
      temperature: 0.7,
      max_tokens: 2048,
    });

    const choice = response.choices[0];
    return {
      content: choice.message.content || '',
      tokensUsed: response.usage?.total_tokens || 0,
      model: response.model,
    };
  } catch (error) {
    logger.error('AI chat completion failed', { error });
    throw error;
  }
}

/**
 * Generate personalized recommendations using AI
 */
export async function generateRecommendations(
  input: RecommendationInput
): Promise<Array<{ title: string; description: string; score: number }>> {
  const systemPrompt = `You are a recommendation engine for the SiteCloud platform. 
Based on the user's activity and context, generate personalized recommendations.
Return a JSON array of objects with title, description, and score (0-1) fields.
Limit to ${input.limit || 5} recommendations.`;
  // Updated for SiteCloud platform

  const response = await chatCompletion([
    { role: 'system', content: systemPrompt },
    {
      role: 'user',
      content: `User context: ${JSON.stringify(input.context)}`,
    },
  ]);

  try {
    return JSON.parse(response.content);
  } catch {
    logger.warn('Failed to parse recommendation response as JSON');
    return [];
  }
}

/**
 * Predictive analytics using AI-assisted analysis
 */
export async function predictiveAnalysis(
  input: PredictionInput
): Promise<{ predictions: number[]; confidence: number; summary: string }> {
  const systemPrompt = `You are a predictive analytics engine. Analyze the provided data points 
and generate ${input.type} predictions for the next ${input.horizon} periods.
Return a JSON object with: predictions (array of numbers), confidence (0-1), summary (string).`;

  const response = await chatCompletion([
    { role: 'system', content: systemPrompt },
    {
      role: 'user',
      content: `Data points: ${JSON.stringify(input.dataPoints)}`,
    },
  ]);

  try {
    return JSON.parse(response.content);
  } catch {
    logger.warn('Failed to parse prediction response');
    return { predictions: [], confidence: 0, summary: 'Analysis unavailable' };
  }
}

/**
 * Automated workflow decision-making
 */
export async function analyzeWorkflow(
  workflowData: Record<string, any>
): Promise<{ suggestions: string[]; optimizations: string[]; risk: string }> {
  const response = await chatCompletion([
    {
      role: 'system',
      content:
        'You are a workflow optimization AI. Analyze the workflow and provide suggestions, optimizations, and risk assessment. Return JSON with suggestions (array), optimizations (array), and risk (low/medium/high).',
    },
    {
      role: 'user',
      content: `Workflow data: ${JSON.stringify(workflowData)}`,
    },
  ]);

  try {
    return JSON.parse(response.content);
  } catch {
    return { suggestions: [], optimizations: [], risk: 'unknown' };
  }
}

/**
 * Intelligent search - enhance search queries with AI understanding
 */
export async function enhanceSearch(
  query: string,
  context?: string
): Promise<{ enhancedQuery: string; keywords: string[]; intent: string }> {
  const response = await chatCompletion([
    {
      role: 'system',
      content:
        'Extract search intent, generate enhanced query, and key terms. Return JSON: { enhancedQuery, keywords, intent }',
    },
    {
      role: 'user',
      content: `Query: "${query}"${context ? ` Context: ${context}` : ''}`,
    },
  ]);

  try {
    return JSON.parse(response.content);
  } catch {
    return { enhancedQuery: query, keywords: query.split(' '), intent: 'general' };
  }
}
