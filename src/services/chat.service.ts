import { StatusCodes } from 'http-status-codes';
import zod from 'zod';
import { prettyFormatFromApi, prettyFormatNow } from '../utils/date';

export type Message = {
  role: 'assistant' | 'user' | 'system';
  content: string;
  id: number;
  createdAt: string
}

const apiMessageScheme = zod.object({
  role: zod.enum(['assistant', 'user', 'system']),
  content: zod.string(),
  id: zod.number(),
  created_at: zod.string()
});

type ApiMessageType = zod.infer<typeof apiMessageScheme>;


/**
 * @throws { ZodError } si le format du message est invalide 
 */
function fromApiMessageToLocalMessage(apiMessage: ApiMessageType): Message {
  apiMessageScheme.parse(apiMessage);
  console.log('messageId: ' + apiMessage.id);
  return {
    role: apiMessage.role,
    content: apiMessage.content,
    id: apiMessage.id,
    createdAt: prettyFormatFromApi(apiMessage.created_at)
  };
}


export async function getMessages(conversationId: number): Promise<Array<Message>> {
  try {
    const httpResponse = await fetch(
      `${import.meta.env.VITE_CHAT_SERVICE_URL}/conversations/${conversationId}/messages`
    );

    if (httpResponse.status !== StatusCodes.OK) {
      return [];
    }

    console.log('getMessages')
    const messages = await httpResponse.json();
    console.log(messages);
    return messages.map(fromApiMessageToLocalMessage);

  } catch (error) {
    return [];
  }
}


type GetResponseResult = {
  type: 'result'
  response: Message;
  questionId: number;
} | {
    type: 'error',
    reason: string
};

export async function getResponse(question: string, conversationId: number): Promise<GetResponseResult> {

  const questionId = await postQuestion(question, conversationId);
  if (!questionId) {
    return {
      type: 'error',
      reason: 'Erreur à l\'envoie de la question'
    };
  }

  try {
    
    const httpResponse = await fetch(
      `${import.meta.env.VITE_CHAT_SERVICE_URL}/conversations/${conversationId}/messages:complete`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stream: false })
      }
    );
    if (httpResponse.status !== StatusCodes.OK) {
      return {
        type: 'error',
        reason: 'Erreur du serveur'
      };
    }

    const body = await httpResponse.json();

    return {
      type: 'result',
      response: {
        id: body?.id,
        role: 'assistant',
        content: body?.choices?.[0]?.message.content,
        createdAt: prettyFormatNow()
      },
      questionId: questionId
    };

  } catch (error) {
    if (error instanceof Error) {
      return {
        type: 'error',
        reason: error.message
      };
    } else {
      return {
        type: 'error',
        reason: String(error)
      };
    }
  }
}

async function postQuestion(question: string, conversationId: number): Promise<number | undefined> {
  try {

    const httpResponse = await fetch(
      `${import.meta.env.VITE_CHAT_SERVICE_URL}/conversations/${conversationId}/messages`,
      {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({
          role: 'user',
          content: question
        })
      }
    );
    if (httpResponse.status !== StatusCodes.CREATED) {
      return;
    }

    const bodyJson = await httpResponse.json();
    return bodyJson.id;

  } catch (error) {
    return;
  }
}