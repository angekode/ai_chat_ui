<script lang="ts">
  import { onMount, tick } from 'svelte';
  import MessageBubble from './MessageBubble.svelte';
  import { scrollIdToBottom } from '../services/scrolling';
  import chatState from './Chat.svelte.js';


  let userInput : string = $state('');

  async function formSubmitted(event: SubmitEvent) {
    event.preventDefault();
    chatState.sendMessage(userInput, 1);
    userInput = ''; // string est immutable donc on ne modifie pas la valeur que sendMessage qui est async lira après, car userInput est juste réassigné et pas muté
    await tick();
    scrollIdToBottom('messages-pane');
  }

  onMount(async () => {
    await chatState.loadConversation(1);
    await tick();
    scrollIdToBottom('messages-pane');
  });
</script>


<div id="chat__component">
  <ul id="messages-pane">
    {#each chatState.messages as message}
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
