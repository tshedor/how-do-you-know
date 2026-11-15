import { get } from 'svelte/store';
import type { Readable } from 'svelte/store';
import {
  GENERATOR_URL_PARAM,
  STANDALONE_URL_PARAM,
  decodeGeneratorState,
  decodeStandaloneState,
  encodeGeneratorState,
  encodeStandaloneState
} from './urlCodec';
import {
  generatorConfigStore,
  generatorRowsStore,
  setGeneratorConfig,
  setGeneratorRows
} from '#lib/stores/generatorState';
import {
  hydrateStandaloneState,
  standaloneHiddenEdgesStore,
  standaloneHiddenPeopleStore,
  standaloneRowsStore,
  standaloneSettingsStore
} from '#lib/stores/standaloneState';

const SYNC_DEBOUNCE_MS = 150;

interface UrlSyncOptions {
  param: string;
  hydrate: (encoded: string) => void;
  encode: () => string;
  stores: Array<Readable<unknown>>;
}

function initUrlSync(options: UrlSyncOptions): () => void {
  if (typeof window === 'undefined') {
    return () => undefined;
  }

  const { param, hydrate, encode, stores } = options;

  let timer: ReturnType<typeof setTimeout> | null = null;

  const writeUrl = (): void => {
    const url = new URL(window.location.href);
    const encoded = encode();
    if (url.searchParams.get(param) === encoded) {
      return;
    }
    url.searchParams.set(param, encoded);
    window.history.replaceState(null, '', `${url.pathname}${url.search}`);
  };

  const scheduleWrite = (): void => {
    if (timer !== null) {
      clearTimeout(timer);
    }
    timer = setTimeout(() => {
      timer = null;
      writeUrl();
    }, SYNC_DEBOUNCE_MS);
  };

  const applyUrl = (): void => {
    const encoded = new URLSearchParams(window.location.search).get(param);
    if (encoded) {
      hydrate(encoded);
    }
  };

  applyUrl();

  const unsubscribers = stores.map((store) => store.subscribe(scheduleWrite));
  window.addEventListener('popstate', applyUrl);

  return () => {
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }
    window.removeEventListener('popstate', applyUrl);
    unsubscribers.forEach((unsubscribe) => unsubscribe());
  };
}

export function initGeneratorUrlSync(): () => void {
  return initUrlSync({
    param: GENERATOR_URL_PARAM,
    hydrate: (encoded) => {
      const state = decodeGeneratorState(encoded);
      if (!state) {
        return;
      }
      setGeneratorRows(state.rows);
      setGeneratorConfig(state.config);
    },
    encode: () => encodeGeneratorState(get(generatorRowsStore), get(generatorConfigStore)),
    stores: [generatorRowsStore, generatorConfigStore]
  });
}

export function initStandaloneUrlSync(): () => void {
  return initUrlSync({
    param: STANDALONE_URL_PARAM,
    hydrate: (encoded) => {
      const state = decodeStandaloneState(encoded);
      if (!state) {
        return;
      }
      hydrateStandaloneState(state);
    },
    encode: () =>
      encodeStandaloneState({
        rows: get(standaloneRowsStore),
        hiddenPeople: get(standaloneHiddenPeopleStore),
        hiddenEdgeRowIds: get(standaloneHiddenEdgesStore),
        settings: get(standaloneSettingsStore)
      }),
    stores: [
      standaloneRowsStore,
      standaloneHiddenPeopleStore,
      standaloneHiddenEdgesStore,
      standaloneSettingsStore
    ]
  });
}
