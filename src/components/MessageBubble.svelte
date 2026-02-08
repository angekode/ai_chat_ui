<script>
  import Markdown from "svelte-exmarkdown";
  let { content, date, role } = $props();
</script>


<div class="message-bubble__container">
  <div class={role === 'user' ? 'user-content' : 'assistant-content' }>
    <div class="markdown-body"><!-- -->
      <Markdown md={content} />
    </div>
  </div>
  <aside class={role === 'user' ? 'user-date' : 'assistant-date' }>{date}</aside>
</div>


<style>
  .message-bubble__container {
    width: 80ch;
  }

  .user-content, .assistant-content  {
    color: var(--text-color);
    font-size: small;
    padding: 1.5rem;
    margin: 0;
    line-height: 2;
  }

  .user-content {
    align-self: flex-end;
    border-radius: 15px 0 15px 15px;
    background-color: var(--user-bubble-background-color);
    border: var(--user-bubble-border-color) 1px solid;
  }
  
  .assistant-content {
    border-radius: 0 15px 15px 15px;
    background-color: var(--assistant-bubble-background-color);
    border: var(--assitant-bubble-border-color) 1px solid;
  }

  .user-content .markdown-body,
  .assistant-content .markdown-body {
    font-family: inherit;
    font-size: inherit;
    line-height: inherit;
    --fgColor-default: var(--text-color);
    --bgColor-default: transparent;
    --bgColor-muted: #000; /* pre */
    --bgColor-neutral-muted: rgba(0, 0, 0, 0.35); /* inline code */
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