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
