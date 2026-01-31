<script lang="ts">
  import { onMount } from 'svelte';
  import { getMessages, type Message, getResponse } from '../services/chat.service';
  import { prettyFormatNow } from '../utils/date';
  import MessageBubble from './MessageBubble.svelte';

  let messages : Message[] = $state([]);
  let userInput : string = $state('');

  async function formSubmitted(event: SubmitEvent) {
    event.preventDefault();
    if (userInput.length === 0) {
      return;
    }
    // On crée ajoute la question dans les message pour qu'elle s'affiche directement avant que le service de chat
    // envoie la réponse. On mettra l'id à jour après la réponse du chat. Si il y a une erreur, la question sera 
    // visible mais il faudrait rajouter un message d'erreur.
    const questionMessage : Message = { id: -1, role: 'user', content: userInput, createdAt: prettyFormatNow() };
    messages.push(questionMessage);
    const result = await getResponse(userInput, 1);
    if (result.type === 'result') {
      questionMessage.id = result.questionId; // mise à jour de l'id qui était à -1
      messages.push(result.response);
      userInput = '';
    }
  }

  onMount(async () => {
    console.log('onMount()');
    messages = await getMessages(1);
    console.log(messages);
  });
</script>


<div id="chat__component">
  <ul id="messages-pane">
    {#each messages as message}
      <li class={message.role === 'user' ? 'user-bubble' : 'assistant-bubble' }>
          <MessageBubble content={message.content} date={message.createdAt} role={message.role}></MessageBubble>
      </li>
    {/each}
  </ul>

  <form id="input-form" onsubmit={formSubmitted}>
    <input type="text" bind:value={userInput} placeholder="Saisir votre question">
    <button id="send-button" type="submit">▷</button>
  </form>
</div>


<style>
  #chat__component {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
  }

  #input-form {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;

    height: 130px;
    min-height: 130px;

    background-color: var(--dark-background-color);
    border: var(--border-color) 1px solid;
    border-radius: 0 0 var(--pane-radius) var(--pane-radius);

    input[type="text"] {
      width: 80%;
      height: 60px;
      padding: 0 1rem;
      font-size: large;

      color: var(--input-text-color);
      background-color: var(--input-background-color);
      border-radius: var(--input-radius);
      border: var(--border-color) 1px solid;
      box-shadow: 0 0 20px 3px var(--glow-color);

      outline: none;
      &:focus {
        background-color: var(--input-background-color-focus);
        box-shadow: 0 0 20px 3px var(--glow-color-focus);
      }
    }
  }

  ul#messages-pane {
    flex: 1;
    display: flex;
    flex-direction: column;

    padding: 1rem;
    margin: 0;
    background-image: var(--background-gradient);
    border: var(--border-color) 1px solid;
    border-radius: var(--pane-radius) var(--pane-radius) 0 0;
    list-style: none;
    gap: 1.5rem;
    overflow-y: scroll;
    scrollbar-width: none;
  }

  li.user-bubble {
    align-self: flex-end;
  }

  button#send-button {
    background: none;
    border: none;
    color: var(--dark-text-color);
    font-size: 24px;
    margin-left: 1rem;

    &:hover {
      cursor: pointer;
      color: var(--highlight-color);
    }
  }
</style>