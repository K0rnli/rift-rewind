'use server';

import { LambdaClient, InvokeCommand } from "@aws-sdk/client-lambda";

const lambdaClient = new LambdaClient({
  region: process.env.AWS_REGION || '',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

export async function invokeLambda(
  functionName: string,
  payload: any = {}
): Promise<any> {
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
    data: any;
  };
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
    if (result.errorMessage) {
      throw new Error(result.errorMessage);
    }
    
    if (result.body) {
      // If Lambda returns a body (API Gateway format)
      const parsedBody = typeof result.body === 'string' ? JSON.parse(result.body) : result.body;
      return {
        response: parsedBody.response || parsedBody.answer || JSON.stringify(parsedBody),
        selectedEvent: parsedBody.selectedEvent
      };
    }
    
    if (result.response || result.answer) {
      return {
        response: result.response || result.answer,
        selectedEvent: result.selectedEvent
      };
    }
    
    // Fallback to stringifying the entire result
    return {
      response: typeof result === 'string' ? result : JSON.stringify(result),
      selectedEvent: result.selectedEvent
    };
  } catch (error) {
    console.error('Error asking game question:', error);
    throw error;
  }
}

