'use server';

import { LambdaClient, InvokeCommand } from "@aws-sdk/client-lambda";

const lambdaClient = new LambdaClient({
  region: process.env.REGION || '',
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID || '',
    secretAccessKey: process.env.SECRET_ACCESS_KEY || '',
  },
});

export async function invokeLambda(
  functionName: string,
  payload: Record<string, unknown> = {}
): Promise<unknown> {
  try {
    const command = new InvokeCommand({
      FunctionName: functionName,
      Payload: JSON.stringify(payload),
    });

    const response = await lambdaClient.send(command);
    
    if (response.Payload) {
      const result = JSON.parse(Buffer.from(response.Payload).toString());
      return result;
    }
    
    return null;
  } catch (error) {
    console.error('Error invoking Lambda:', error);
    throw error;
  }
}

export interface GameQuestionResponse {
  response: string;
  selectedEvent?: {
    timestamp: number;
    type: string;
    eventType: 'game' | 'skill' | 'kill' | 'level' | 'item' | 'feat';
    data: unknown;
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export async function askGameQuestion(
  question: string,
  gameslug: string
): Promise<GameQuestionResponse> {
  try {
    const functionName = 'lol-game-analyzer-korn';
    const payload = {
      question,
      gameslug,
    };

    const result = await invokeLambda(functionName, payload);
    
    // Handle different response formats
    if (isRecord(result) && typeof result.errorMessage === 'string') {
      throw new Error(result.errorMessage);
    }
    
    if (isRecord(result) && result.body) {
      // If Lambda returns a body (API Gateway format)
      const parsedBody = typeof result.body === 'string' ? JSON.parse(result.body) : result.body;
      if (isRecord(parsedBody)) {
        return {
          response: (typeof parsedBody.response === 'string' ? parsedBody.response : '') ||
                   (typeof parsedBody.answer === 'string' ? parsedBody.answer : '') ||
                   JSON.stringify(parsedBody),
          selectedEvent: isRecord(parsedBody.selectedEvent) ? parsedBody.selectedEvent as GameQuestionResponse['selectedEvent'] : undefined
        };
      }
    }
    
    if (isRecord(result) && (result.response || result.answer)) {
      return {
        response: (typeof result.response === 'string' ? result.response : '') ||
                 (typeof result.answer === 'string' ? result.answer : ''),
        selectedEvent: isRecord(result.selectedEvent) ? result.selectedEvent as GameQuestionResponse['selectedEvent'] : undefined
      };
    }
    
    // Fallback to stringifying the entire result
    return {
      response: typeof result === 'string' ? result : JSON.stringify(result),
      selectedEvent: isRecord(result) && isRecord(result.selectedEvent) 
        ? result.selectedEvent as GameQuestionResponse['selectedEvent'] 
        : undefined
    };
  } catch (error) {
    console.error('Error asking game question:', error);
    throw error;
  }
}

