import { StatusCodes } from 'http-status-codes';
import zod, { json } from 'zod';
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
 * @throws { ZodError } si le format du message est invalide.
 */
function fromApiMessageToLocalMessage(apiMessage: ApiMessageType): Message {
  apiMessageScheme.parse(apiMessage);
  return {
    role: apiMessage.role,
    content: apiMessage.content,
    id: apiMessage.id,
    createdAt: prettyFormatFromApi(apiMessage.created_at)
  };
}


/**
 * @param conversationId - Identifiant donnée par l'API pour effectuer des opérations dessus (infos, modifications, suppression...).
 * @returns - La liste des messages dans l'historique de la conversation. En cas d'erreur, retourn un tableau vide.
 */
export async function getMessages(conversationId: number): Promise<Array<Message>> {
  try {
    const httpResponse = await fetch(
      `${import.meta.env.VITE_CHAT_SERVICE_URL}/conversations/${conversationId}/messages`
    );
    if (httpResponse.status !== StatusCodes.OK) {
      return [];
    }

    const messages = await httpResponse.json();
    return messages.map(fromApiMessageToLocalMessage);

  } catch (error) {
    return [];
  }
}

/**
 * Objet renvoyé par getResponse contenant la réponse du llm via l'API du service de chat.
 */
type GetResponseResult = {
  type: 'result' 
  response: Message; 
  questionId: number; // Identifiant donnée par l'API pour effectuer des opérations dessus (infos, modifications, suppression...)
} | {
    type: 'error',
    reason: string
};


/**
 * @param question - Chaine brute contenant la question à envoyer.
 * @param conversationId - Identifiant de la conversation donné par l'API du service de chat /users/:userId/conversations.
 * @returns un objet contenant la réponse ou une erreur.
 */
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


type ResponseStream = {
  type: 'message-chunk',
  content: string,
  responseId: number
} | {
  type: 'error',
  reason: string
};

type GetResponseStreamResult = {
  type: 'result'
  stream: AsyncGenerator<ResponseStream>;
  questionId: number;
} | {
  type: 'error',
  reason: string
};

/**
 * @param question - Chaine brute contenant la question à envoyer.
 * @param conversationId - Identifiant de la conversation donné par l'API du service de chat /users/:userId/conversations.
 * @returns un objet contenant le stream et autres informations, ou une erreur
 */
export async function getResponseStream(question: string, conversationId: number): Promise<GetResponseStreamResult> {

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
        body: JSON.stringify({ stream: true })
      }
    );
    if (httpResponse.status !== StatusCodes.OK) {
      return {
        type: 'error',
        reason: 'Erreur du serveur'
      };
    }

    if (!httpResponse.body) {
      throw new Error('Stream de réponse à la question null');
    }

    return {
      type: 'result',
      stream: streamWrapper(httpResponse.body),
      questionId: questionId
    };

  } catch (error) {
    if (error instanceof Error) {
      return { type: 'error', reason: error.message };
    } else {
      return { type: 'error', reason: String(error) };
    }
  }
}


/**
 * Enregistre une question en tant que message à la fin de l'historique de la conversation.
 * 
 * @param  - Chaine brute contenant la question à envoyer à l'API.
 * @param conversationId - Identifiant de la conversation donné par l'API du service de chat /users/:userId/conversations.
 * @returns - L'identifiant de la question enregistrée. Si erreur, renvoie undefined.
 */
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


/**
 * Transforme le stream brut reçu de l'api sous la forme d'event SSE "data: {json}\n\n"
 * en stream de GetResponseResultStream.
 */
async function * streamWrapper(fetchBodyStream: ReadableStream<Uint8Array>): AsyncGenerator<ResponseStream> {

  const textDecoder = new TextDecoder();

  for await (const chunkBytes of fetchBodyStream) {

    const chunkString = textDecoder.decode(chunkBytes, { stream: true });

    const jsonResult = extractJsonFromDataEvent(chunkString);
    if (jsonResult.type === 'error') {
      yield {
        type: 'error',
        reason: jsonResult.message
      };
      return;
    }

    if (jsonResult.type === 'done') {
      return;
    }

    yield {
      type: 'message-chunk',
      content: jsonResult.result.choices[0].delta.content,
      responseId: jsonResult.result.id
    };
  }
}


const apiDataEventJsonScheme = zod.object({
  id: zod.number(),
  choices: zod.array(zod.object({
      finish_reason: zod.literal('stop'),
      index: zod.number(),
      delta: zod.object({
        role: zod.literal('assistant'),
        content: zod.string()
      })
  }))
});


type ApiDataEventJsonType = zod.infer<typeof apiDataEventJsonScheme>;

/**
 * @param dataEvent - une chaine au format: data: {json}\n\n
 * @returns l'objet json, si erreur de format renvoie une description de l'erreur
 */
function extractJsonFromDataEvent(dataEvent: string): 
  { type: 'json', result: ApiDataEventJsonType } | 
  { type: 'error', message: string } | 
  { type: 'done' } {


  if (/data:\s*\[DONE\]/.test(dataEvent)) {
    return { type: 'done' };
  }

  const matches = dataEvent.match(/data:([^\n]+)\n\n/);
  if (!matches || matches.length !== 2) {
    return { type: 'error', message: 'Le format data:... n\'est pas respecté' };
  }

  const jsonString = matches[1];

  try {
    const jsonObject = JSON.parse(jsonString) as object;
    const parseResult = apiDataEventJsonScheme.parse(jsonObject);
    return { type: 'json', result: parseResult as ApiDataEventJsonType };

  } catch (error) {
    if (error instanceof Error) {
      return { type: 'error', message: error.message };
    } else { 
      return { type: 'error', message: String(error) };
    }
  }
}