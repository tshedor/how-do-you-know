import { describe, expect, it } from 'vitest';
import { unzipSync } from 'fflate';
import type { PageExportSettings, RenderedGraph } from '#lib/types';
import { buildGraphsZipBytes } from '../index';
import {
  crc32,
  getPixelDimensionsAtDpi,
  getPageDimensionsInches,
  injectPng300DpiPhysChunk
} from '../png300Dpi';

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

function buildChunk(type: string, data: Uint8Array): Uint8Array {
  const chunk = new Uint8Array(4 + 4 + data.length + 4);
  const view = new DataView(chunk.buffer);
  view.setUint32(0, data.length, false);
  for (let i = 0; i < 4; i++) {
    chunk[4 + i] = type.charCodeAt(i);
  }
  chunk.set(data, 8);
  view.setUint32(chunk.length - 4, crc32(chunk.subarray(4, chunk.length - 4)), false);
  return chunk;
}

function buildMinimalPng(): Uint8Array {
  const ihdrData = new Uint8Array(13);
  const view = new DataView(ihdrData.buffer);
  view.setUint32(0, 1, false);
  view.setUint32(4, 1, false);
  ihdrData[8] = 8;
  ihdrData[9] = 0;
  ihdrData[10] = 0;
  ihdrData[11] = 0;
  ihdrData[12] = 0;

  const idat = buildChunk('IDAT', new Uint8Array([0x00, 0x00]));
  const iend = buildChunk('IEND', new Uint8Array());

  const total = PNG_SIGNATURE.length + 12 + 13 + idat.length + iend.length;
  const png = new Uint8Array(total);
  png.set(PNG_SIGNATURE, 0);
  png.set(buildChunk('IHDR', ihdrData), PNG_SIGNATURE.length);
  png.set(idat, PNG_SIGNATURE.length + 12 + 13);
  png.set(iend, PNG_SIGNATURE.length + 12 + 13 + idat.length);
  return png;
}

function buildChunkList(pngBytes: Uint8Array): Array<{ type: string; data: Uint8Array }> {
  const chunks: Array<{ type: string; data: Uint8Array }> = [];
  const view = new DataView(pngBytes.buffer, pngBytes.byteOffset, pngBytes.byteLength);
  let offset = 8;
  while (offset + 12 <= pngBytes.length) {
    const length = view.getUint32(offset, false);
    const type = String.fromCharCode(
      pngBytes[offset + 4],
      pngBytes[offset + 5],
      pngBytes[offset + 6],
      pngBytes[offset + 7]
    );
    chunks.push({ type, data: pngBytes.subarray(offset + 8, offset + 8 + length) });
    offset += 12 + length;
  }
  return chunks;
}

describe('getPageDimensionsInches', () => {
  it('returns portrait dimensions for letter size', () => {
    expect(getPageDimensionsInches('8.5x11', 'portrait')).toEqual({ width: 8.5, height: 11 });
  });

  it('swaps dimensions for landscape orientation', () => {
    expect(getPageDimensionsInches('8.5x11', 'landscape')).toEqual({ width: 11, height: 8.5 });
    expect(getPageDimensionsInches('11x17', 'landscape')).toEqual({ width: 17, height: 11 });
  });

  it('supports A4 size', () => {
    expect(getPageDimensionsInches('8.3x11.7', 'portrait')).toEqual({ width: 8.3, height: 11.7 });
  });
});

describe('getPixelDimensionsAtDpi', () => {
  it('computes 300 DPI pixel dimensions for letter portrait', () => {
    expect(getPixelDimensionsAtDpi('8.5x11', 'portrait', 300)).toEqual({ width: 2550, height: 3300 });
  });

  it('computes 300 DPI pixel dimensions for tabloid landscape', () => {
    expect(getPixelDimensionsAtDpi('11x17', 'landscape', 300)).toEqual({ width: 5100, height: 3300 });
  });

  it('computes 300 DPI pixel dimensions for A4 landscape', () => {
    expect(getPixelDimensionsAtDpi('8.3x11.7', 'landscape', 300)).toEqual({ width: 3510, height: 2490 });
  });
});

describe('injectPng300DpiPhysChunk', () => {
  it('inserts a pHYs chunk with 11811 px/m and unit 1 after IHDR', () => {
    const result = injectPng300DpiPhysChunk(buildMinimalPng(), 300);
    const chunks = buildChunkList(result);

    expect(chunks[0].type).toBe('IHDR');
    expect(chunks[1].type).toBe('pHYs');
    expect(chunks[1].data.length).toBe(9);

    const view = new DataView(chunks[1].data.buffer, chunks[1].data.byteOffset, chunks[1].data.byteLength);
    expect(view.getUint32(0, false)).toBe(11811);
    expect(view.getUint32(4, false)).toBe(11811);
    expect(chunks[1].data[8]).toBe(1);
  });

  it('writes a valid CRC32 over the pHYs chunk type and data', () => {
    const result = injectPng300DpiPhysChunk(buildMinimalPng(), 300);
    const chunks = buildChunkList(result);
    const phys = chunks[1];
    const view = new DataView(result.buffer, result.byteOffset, result.byteLength);

    expect(phys.type).toBe('pHYs');
    const storedCrc = view.getUint32(8 + 12 + 13 + 17, false);
    const expectedCrc = crc32(new Uint8Array([0x70, 0x48, 0x59, 0x73, ...phys.data]));
    expect(storedCrc).toBe(expectedCrc);
  });

  it('keeps the original chunks intact after IHDR', () => {
    const original = buildMinimalPng();
    const result = injectPng300DpiPhysChunk(original, 300);
    const chunks = buildChunkList(result);

    expect(chunks.length).toBe(4);
    expect(chunks[2].type).toBe('IDAT');
    expect(chunks[3].type).toBe('IEND');
    expect(result.length).toBe(original.length + 21);
    expect(Array.from(result.subarray(0, 8))).toEqual(PNG_SIGNATURE);
  });

  it('throws for PNG data without an IHDR chunk', () => {
    const notAPng = new Uint8Array(PNG_SIGNATURE);
    expect(() => injectPng300DpiPhysChunk(notAPng, 300)).toThrow(/IHDR/);
  });
});

describe('buildGraphsZipBytes', () => {
  const settings: PageExportSettings = {
    pageSize: '8.5x11',
    orientation: 'landscape',
    exportFormat: 'SVG',
    nodeFontSize: 12,
    edgeFontSize: 10
  };

  function makeGraph(index: number, svg: string): RenderedGraph {
    return {
      index,
      dot: `digraph { ${index} }`,
      rows: [],
      visibleNode: [],
      visibleEdgeRowIds: [],
      svg
    };
  }

  it('bundles numbered graph entries plus view-all.svg', async () => {
    const graphs = [makeGraph(0, '<svg>one</svg>'), makeGraph(1, '<svg>two</svg>')];
    const viewAllGraph = makeGraph(99, '<svg>view all</svg>');

    const bytes = await buildGraphsZipBytes(graphs, viewAllGraph, settings);
    const files = unzipSync(bytes);

    expect(Object.keys(files).sort()).toEqual(['graph-1.svg', 'graph-2.svg', 'view-all.svg']);
    expect(new TextDecoder().decode(files['view-all.svg'])).toBe('<svg>view all</svg>');
    expect(new TextDecoder().decode(files['graph-1.svg'])).toBe('<svg>one</svg>');
    expect(new TextDecoder().decode(files['graph-2.svg'])).toBe('<svg>two</svg>');
  });

  it('omits view-all.svg when no view-all graph is provided', async () => {
    const graphs = [makeGraph(0, '<svg>one</svg>')];
    const bytes = await buildGraphsZipBytes(graphs, null, settings);
    const files = unzipSync(bytes);

    expect(Object.keys(files).sort()).toEqual(['graph-1.svg']);
  });
});
