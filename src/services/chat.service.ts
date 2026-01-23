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
    console.log('responseId: ' + body?.id);
    return {
      id: body?.id,
      role: 'assistant',
      content: body?.choices?.[0]?.message.content,
      createdAt: prettyFormatNow()
    };

  } catch (error) {
    return;
  }
}