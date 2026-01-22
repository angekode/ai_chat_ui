<script>
  let { content, date, role } = $props();
</script>


<div class="message-bubble__container">
  <p class={role === 'user' ? 'user-content' : 'assistant-content' }>{content}</p>
  <aside class={role === 'user' ? 'user-date' : 'assistant-date' }>{date}</aside>
</div>


<style>
  .message-bubble__container {
    width: 80ch;
  }
  p {
    color: var(--text-color);
    font-size: small;
    padding: 1.5rem;
    margin: 0;
    line-height: 2;
  }

  p.user-content {
    align-self: flex-end;
    border-radius: 15px 0 15px 15px;
    background-color: var(--user-bubble-background-color);
    border: var(--user-bubble-border-color) 1px solid;
  }
  
  p.assistant-content {
    border-radius: 0 15px 15px 15px;
    background-color: var(--assistant-bubble-background-color);
    border: var(--assitant-bubble-border-color) 1px solid;
  }

  aside {
    font-size: small;
    text-align: right;
    margin-top: 0.2rem;
    margin-right: 1rem;
  }

  aside.user-date {
    color: var(--user-bubble-date-color);
  }

  aside.assistant-date {
    color: var(--assistant-bubble-date-color);
  }
</style>