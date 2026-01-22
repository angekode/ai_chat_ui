<script lang="ts">
  import { onMount } from 'svelte';
  import { getMessages, type Message, getResponse } from '../services/chat.service';


  let messages : Message[] = $state([]);
  let userInput : string = $state('');

  async function formSubmitted(event: SubmitEvent) {
    event.preventDefault();
    const response = await getResponse(userInput, 1);
    if (response) {
      messages.push(response);
    }
  }

  onMount(async () => {
    //messages = await getMessages(1);
    messages.push({ id: 1, role: 'assistant', content: 'Ceci est un texte qui ne veut rien dire et sert uniquement à remplir ce carré avec un message' });
    messages.push({ id: 2, role: 'user', content: 'Ceci est un texte qui ne veut rien dire et sert uniquement à remplir ce carré avec un message' });
  });
</script>


<div id="chat__component">
  <ul id="messages-pane">
    {#each messages as message}
      <li class={message.role === 'user' ? "user" : "assistant"}>
          {message.content}
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
  }
  
  li {
    margin: 5px;
    color: var(--text-color);
    padding: 0.8rem;
    width: 300px;
  }

  li.user {
    align-self: flex-end;
    border-radius: 10px 0 10px 10px;
    background-color: var(--user-bubble-background-color);
    border: var(--user-bubble-border-color) 1px solid;
  }
  
  li.assistant {
    border-radius: 0 10px 10px 10px;
    background-color: var(--assistant-bubble-background-color);
    border: var(--assistant-bubble-border-color) 1px solid;
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