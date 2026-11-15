import type { Orientation, PageSize } from '#lib/types';

const BASE_PAGE_SIZES_INCHES: Record<PageSize, { width: number; height: number }> = {
  '8.5x11': { width: 8.5, height: 11 },
  '11x17': { width: 11, height: 17 },
  '8.3x11.7': { width: 8.3, height: 11.7 }
};

export interface PageDimensions {
  width: number;
  height: number;
}

export function getPageDimensionsInches(pageSize: PageSize, orientation: Orientation): PageDimensions {
  const base = BASE_PAGE_SIZES_INCHES[pageSize];
  return orientation === 'landscape'
    ? { width: base.height, height: base.width }
    : { width: base.width, height: base.height };
}

export function getPixelDimensionsAtDpi(
  pageSize: PageSize,
  orientation: Orientation,
  dpi: number
): PageDimensions {
  const { width, height } = getPageDimensionsInches(pageSize, orientation);
  return { width: Math.round(width * dpi), height: Math.round(height * dpi) };
}

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
})();

export function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) {
    crc = CRC_TABLE[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

const PHYS_CHUNK_TYPE = new Uint8Array([0x70, 0x48, 0x59, 0x73]);

export function injectPng300DpiPhysChunk(pngBytes: Uint8Array, dpi: number): Uint8Array {
  const pixelsPerMeter = Math.round(dpi / 0.0254);
  const physData = new Uint8Array(9);
  const physView = new DataView(physData.buffer);
  physView.setUint32(0, pixelsPerMeter, false);
  physView.setUint32(4, pixelsPerMeter, false);
  physData[8] = 1;

  const crcInput = new Uint8Array(PHYS_CHUNK_TYPE.length + physData.length);
  crcInput.set(PHYS_CHUNK_TYPE, 0);
  crcInput.set(physData, PHYS_CHUNK_TYPE.length);
  const crc = crc32(crcInput);

  const chunk = new Uint8Array(4 + 4 + 9 + 4);
  const chunkView = new DataView(chunk.buffer);
  chunkView.setUint32(0, 9, false);
  chunk.set(PHYS_CHUNK_TYPE, 4);
  chunk.set(physData, 8);
  chunkView.setUint32(17, crc, false);

  const ihdrEnd = findIhdrEnd(pngBytes);
  const output = new Uint8Array(pngBytes.length + chunk.length);
  output.set(pngBytes.subarray(0, ihdrEnd), 0);
  output.set(chunk, ihdrEnd);
  output.set(pngBytes.subarray(ihdrEnd), ihdrEnd + chunk.length);
  return output;
}

function findIhdrEnd(pngBytes: Uint8Array): number {
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
    if (type === 'IHDR') {
      return offset + 12 + length;
    }
    offset += 12 + length;
  }
  throw new Error('IHDR chunk not found in PNG data');
}

export const PNG_300_DPI = 300;

export async function svgToPng300DpiBytes(
  svg: string,
  pageSize: PageSize,
  orientation: Orientation
): Promise<Uint8Array> {
  const { width, height } = getPixelDimensionsAtDpi(pageSize, orientation, PNG_300_DPI);
  const pngBytes = await rasterizeSvgToPng(svg, width, height);
  return injectPng300DpiPhysChunk(pngBytes, PNG_300_DPI);
}

async function rasterizeSvgToPng(svg: string, width: number, height: number): Promise<Uint8Array> {
  const svgBlob = new Blob([svg], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(svgBlob);
  try {
    const image = await loadImage(url);
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Canvas 2D context unavailable');
    }
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, width, height);
    context.drawImage(image, 0, 0, width, height);
    return await canvasToPngBytes(canvas);
  } finally {
    URL.revokeObjectURL(url);
  }
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Failed to load SVG image for rasterization'));
    image.src = url;
  });
}

async function canvasToPngBytes(canvas: HTMLCanvasElement): Promise<Uint8Array> {
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
  if (!blob) {
    throw new Error('Failed to encode canvas as PNG');
  }
  return new Uint8Array(await blob.arrayBuffer());
}
