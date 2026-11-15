import { describe, expect, it } from 'vitest';
import { parseRelationshipsCsv } from '#lib/csv';

describe('parseRelationshipsCsv', () => {
  it('imports three columns and accepts an optional header', () => {
    expect(parseRelationshipsCsv('From,To,Connection\nAlice,Bob,Friends')).toEqual([
      { from: 'Alice', to: 'Bob', relation: 'Friends' }
    ]);
    expect(parseRelationshipsCsv('Dan,Stan,Drum circle')).toEqual([
      { from: 'Dan', to: 'Stan', relation: 'Drum circle' }
    ]);
  });

  it('supports BOMs, CRLF, quoted commas, escaped quotes, and multiline fields', () => {
    const csv = '\ufeff"Alice, A.","Bob ""B""","Friends,\r\nColleagues"\r\n';
    expect(parseRelationshipsCsv(csv)).toEqual([
      { from: 'Alice, A.', to: 'Bob "B"', relation: 'Friends,\r\nColleagues' }
    ]);
  });

  it('rejects rows without exactly three columns', () => {
    expect(() => parseRelationshipsCsv('Alice,Bob')).toThrow(
      'must have exactly three columns: From,To,Connection'
    );
  });

  it('rejects unclosed quoted fields', () => {
    expect(() => parseRelationshipsCsv('"Alice,Bob,Friends')).toThrow('unclosed quoted field');
  });
});
