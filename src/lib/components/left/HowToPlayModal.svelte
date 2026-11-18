<script lang="ts">
  let { open = false, onClose = () => {} }: { open?: boolean; onClose?: () => void } = $props();

  let dialogEl = $state<HTMLDivElement | null>(null);

  $effect(() => {
    if (open) {
      dialogEl?.focus();
    }
  });
</script>

{#if open}
  <button
    type="button"
    class="how-to-play-backdrop"
    aria-label="Close how-to-play guide"
    onclick={onClose}
  ></button>
  <div
    bind:this={dialogEl}
    class="how-to-play-modal"
    role="dialog"
    aria-modal="true"
    aria-labelledby="how-to-play-title"
    tabindex="-1"
  >
    <header class="how-to-play-modal__header">
      <h2 id="how-to-play-title">How Do You Know: The Game</h2>
      <button
        type="button"
        class="how-to-play-modal__close"
        aria-label="Close how-to-play guide"
        onclick={onClose}
      >
        &times;
      </button>
    </header>
    <p>Tired of "so what do you do"? Allergic to such and such? Give your guests something to talk about.</p>
    <ol class="how-to-play-modal__steps">
      <li>Add names of everyone at your next party.</li>
      <li>
        Add connections between names. Favor fun facts that start a story:
        <em>&ldquo;Runner-up to the break room Olympics&rdquo;</em> instead of
        <em style="color: #707070">&ldquo;Work.&rdquo;</em>
      </li>
      <li>Take it offline. Print the graphs and have your guests fill out missing spaces.</li>
    </ol>
    <p style="text-align:right"><a href="https://github.com/tshedor/how-do-you-know">Made by Tim</a></p>
  </div>
{/if}

<style>
  .how-to-play-backdrop {
    position: fixed;
    inset: 0;
    z-index: 190;
    padding: 0;
    border: 0;
    background: rgb(15 23 42 / 45%);
    backdrop-filter: blur(2px);
  }

  .how-to-play-modal {
    position: fixed;
    top: 50%;
    left: 50%;
    z-index: 200;
    width: min(90vw, 30rem);
    max-height: calc(100dvh - 2rem);
    padding: 1.25rem 1.5rem 1.5rem;
    overflow-y: auto;
    border: 1px solid var(--color-border);
    border-radius: 12px;
    background: var(--color-surface);
    box-shadow: var(--shadow-dropdown);
    transform: translate(-50%, -50%);
    text-align: left;
  }

  .how-to-play-modal:focus-visible {
    outline: none;
  }

  .how-to-play-modal__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    margin-bottom: 0.9rem;
  }

  .how-to-play-modal__header h2 {
    margin: 0;
    color: var(--color-text);
    font-size: 1.125rem;
    font-weight: 700;
    line-height: 1.25;
  }

  .how-to-play-modal__close {
    display: inline-flex;
    flex: none;
    align-items: center;
    justify-content: center;
    width: 2rem;
    height: 2rem;
    padding: 0;
    border: 0;
    border-radius: 0.45rem;
    background: transparent;
    color: var(--color-text-muted);
    font-size: 1.5rem;
    line-height: 1;
  }

  .how-to-play-modal__close:hover {
    background: var(--color-surface-subtle);
    color: var(--color-text);
  }

  .how-to-play-modal__steps {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    margin: 0;
    padding-left: 1.35rem;
    color: var(--color-text);
    font-size: 0.9375rem;
    line-height: 1.5;
  }

  .how-to-play-modal__steps li::marker {
    color: var(--color-accent-hover);
    font-weight: 700;
  }

  .how-to-play-modal__steps em,
  a {
    font-style: normal;
    font-weight: 600;
    color: var(--color-accent-hover);
  }

  a {
    font-size: 12px;
  }
</style>
