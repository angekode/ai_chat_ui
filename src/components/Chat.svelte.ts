import { getMessages, type Message, getResponseStream } from '../services/chat.service';
import { prettyFormatNow } from '../utils/date';


const chatState = $state({
  
  messages : new Array<Message>(),

  add(id: number, role: Message['role'], content: string, date: string): Message {
    this.messages.push({ id: id, role: role, content: content, createdAt: date });
    return this.messages[this.messages.length - 1];
  },


  getLastMessage(): Message | undefined {
    if (this.messages.length < 1) {
      return undefined;
    }
    return this.messages[this.messages.length-1];
  },


  async loadConversation(conversationId: number): Promise<void> {
    const newMessages = await getMessages(conversationId);
    // Pour garantir que les instances de "this.messages" récupérées par des tiers soient toujours
    // valables on ne remplace pas "this.messages", on le modifie avec cette syntaxe complexe.
    this.messages.splice(0, this.messages.length, ...newMessages);
  },


  async sendMessage(question: string, conversationId: number): Promise<void> {
    // On stocke la question avec un id dummy
    const questionMessage = this.add(-1, 'user', question, prettyFormatNow());
    // On crée une réponse vide pour la mettre à jour pendant le stream
    const responseMessage = this.add(-1, 'assistant', '', prettyFormatNow());
    // On récupère un stream pour la réponse
    const result = await getResponseStream(question, conversationId);
    if (result.type === 'error') {
      console.error(result.reason);
      return;
    }

    // L'API génère un id pour la question,
    // l'id de la réponse sera envoyé dans le stream
    questionMessage.id = result.questionId;

    for await (const chunk of result.stream) {
      if (chunk.type === 'error') {
        responseMessage.content += ` (erreur: ${chunk.reason})`;
        break;
      }
      responseMessage.content += chunk.content;
      if (responseMessage.id === -1) {
        responseMessage.id = chunk.responseId;
      }
    }
  }
});


export default chatState;
