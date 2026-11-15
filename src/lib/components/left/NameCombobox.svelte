<script lang="ts">
  interface Props {
    value?: string;
    options?: string[];
    placeholder?: string;
    onChange?: (val: string) => void;
  }

  let {
    value = '',
    options = [],
    placeholder = 'Name',
    onChange = () => {}
  }: Props = $props();

  const uid = $props.id();
  const listboxId = `${uid}-listbox`;

  let isOpen = $state(false);
  let highlightIndex = $state(-1);
  // svelte-ignore state_referenced_locally
  let draft = $state(value);
  let inputEl = $state<HTMLInputElement | null>(null);

  $effect(() => {
    draft = value;
  });

  let filteredOptions = $derived.by(() => {
    const query = draft.trim().toLowerCase();
    if (!query) {
      return options;
    }
    return options.filter((option) => option.toLowerCase().includes(query));
  });

  function openDropdown(): void {
    isOpen = true;
    highlightIndex = -1;
  }

  function closeDropdown(): void {
    isOpen = false;
    highlightIndex = -1;
  }

  function handleInput(event: Event): void {
    const target = event.currentTarget;
    if (!(target instanceof HTMLInputElement)) {
      return;
    }
    draft = target.value;
    isOpen = true;
    highlightIndex = -1;
    onChange(draft);
  }

  function handleKeydown(event: KeyboardEvent): void {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (filteredOptions.length === 0) {
        return;
      }
      isOpen = true;
      highlightIndex = (highlightIndex + 1) % filteredOptions.length;
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (filteredOptions.length === 0) {
        return;
      }
      isOpen = true;
      highlightIndex = highlightIndex <= 0 ? filteredOptions.length - 1 : highlightIndex - 1;
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const selected = highlightIndex >= 0 ? filteredOptions[highlightIndex] : undefined;
      if (selected !== undefined) {
        selectOption(selected);
      } else {
        closeDropdown();
      }
    } else if (event.key === 'Escape') {
      event.preventDefault();
      closeDropdown();
    }
  }

  function selectOption(option: string): void {
    draft = option;
    onChange(option);
    closeDropdown();
    inputEl?.focus();
  }
</script>

<div class="combobox">
  <input
    bind:this={inputEl}
    type="text"
    role="combobox"
    autocomplete="off"
    aria-autocomplete="list"
    aria-expanded={isOpen}
    aria-controls={listboxId}
    aria-activedescendant={highlightIndex >= 0 ? `${listboxId}-option-${highlightIndex}` : undefined}
    {placeholder}
    value={draft}
    onfocus={openDropdown}
    onblur={closeDropdown}
    oninput={handleInput}
    onkeydown={handleKeydown}
  />
  {#if isOpen && filteredOptions.length > 0}
    <ul class="combobox__dropdown" role="listbox" id={listboxId}>
      {#each filteredOptions as option, index (option)}
        <li
          role="option"
          id={`${listboxId}-option-${index}`}
          class="combobox__option"
          class:is-highlighted={index === highlightIndex}
          aria-selected={index === highlightIndex}
        >
          <button
            type="button"
            onmousedown={(event) => event.preventDefault()}
            onclick={() => selectOption(option)}
          >
            {option}
          </button>
        </li>
      {/each}
    </ul>
  {/if}
</div>

<style>
  .combobox {
    position: relative;
    flex: 1 1 auto;
    width: 100%;
    min-width: 0;
  }

  .combobox > input {
    width: 100%;
    min-width: 0;
    height: 36px;
    padding: 7px 9px;
    border: 1px solid var(--color-border-strong);
    border-radius: var(--radius-control);
    outline: none;
    color: var(--color-text);
    font-size: 0.8125rem;
    line-height: 1.2;
    text-overflow: ellipsis;
    background: var(--color-surface);
    transition:
      border-color var(--transition-fast),
      box-shadow var(--transition-fast);
  }

  .combobox > input::placeholder {
    color: #98a2b3;
  }

  .combobox > input:hover {
    border-color: #aab4c3;
  }

  .combobox > input:focus,
  .combobox > input:focus-visible {
    border-color: var(--color-accent);
    outline: none;
    box-shadow: 0 0 0 3px rgb(49 87 213 / 11%);
  }

  .combobox__dropdown {
    position: absolute;
    top: calc(100% + 5px);
    left: 0;
    z-index: 60;
    width: max-content;
    min-width: 100%;
    max-width: min(230px, calc(100vw - 32px));
    max-height: min(220px, 38vh);
    margin: 0;
    padding: 4px;
    overflow-y: auto;
    overscroll-behavior: contain;
    border: 1px solid var(--color-border);
    border-radius: 8px;
    background: var(--color-surface);
    box-shadow: var(--shadow-dropdown);
    list-style: none;
    transform-origin: top left;
    animation: dropdown-enter 120ms ease-out;
  }

  :global(.row-item__cell--to) .combobox__dropdown {
    right: 0;
    left: auto;
    transform-origin: top right;
  }

  :global(.left-pane__rows > li:nth-last-child(-n + 2):nth-child(n + 4)) .combobox__dropdown {
    top: auto;
    bottom: calc(100% + 5px);
    max-height: min(180px, 32vh);
    transform-origin: bottom left;
  }

  .combobox__option {
    margin: 0;
    padding: 0;
  }

  .combobox__option > button {
    display: block;
    width: 100%;
    padding: 8px 9px;
    overflow-wrap: anywhere;
    border: 0;
    border-radius: 5px;
    color: #344054;
    font-size: 0.8125rem;
    line-height: 1.3;
    text-align: left;
    background: transparent;
    transition:
      color var(--transition-fast),
      background-color var(--transition-fast);
  }

  .combobox__option > button:hover,
  .combobox__option.is-highlighted > button {
    color: #203d9f;
    background: var(--color-accent-soft);
  }

  @keyframes dropdown-enter {
    from {
      opacity: 0;
      transform: translateY(-3px) scale(0.985);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .combobox > input,
    .combobox__option > button {
      transition: none;
    }

    .combobox__dropdown {
      animation: none;
    }
  }
</style>
