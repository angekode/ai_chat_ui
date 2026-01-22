import { StatusCodes } from 'http-status-codes';
export type Message = {
  role: 'assistant' | 'user' | 'system';
  content: string;
  id: number;
}


export async function getMessages(conversationId: number): Promise<Array<Message>> {
  try {
    const httpResponse = await fetch(
      `${import.meta.env.VITE_CHAT_SERVICE_URL}/conversations/${conversationId}/messages`
    );

    if (httpResponse.status !== StatusCodes.OK) {
      return [];
    }

    return await httpResponse.json();

  } catch (error) {
    return [];
  }
}

export async function getResponse(question: string, conversationId: number): Promise<Message | undefined> {
  try {
    const httpResponse = await fetch(
      `${import.meta.env.VITE_CHAT_SERVICE_URL}/conversations/${conversationId}/messages:complete`,
      {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: question }],
          stream: false
        })
      }
    );

    if (httpResponse.status !== StatusCodes.OK) {
      return;
    }

    const body = await httpResponse.json();
    return body?.choices?.[0]?.message;

  } catch (error) {
    return;
  }
}