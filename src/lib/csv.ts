import type { RelationshipRow } from '#lib/types';

export type RelationshipCsvRow = Omit<RelationshipRow, 'id'>;

export function parseRelationshipsCsv(source: string): RelationshipCsvRow[] {
  const input = source.charCodeAt(0) === 0xfeff ? source.slice(1) : source;
  const records: string[][] = [];
  let record: string[] = [];
  let field = '';
  let inQuotes = false;

  const finishField = (): void => {
    record.push(field);
    field = '';
  };

  const finishRecord = (): void => {
    finishField();
    if (record.some((value) => value.trim() !== '')) {
      records.push(record);
    }
    record = [];
  };

  for (let index = 0; index < input.length; index += 1) {
    const character = input[index];
    if (inQuotes) {
      if (character === '"') {
        if (input[index + 1] === '"') {
          field += '"';
          index += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += character;
      }
    } else if (character === '"') {
      if (field.length > 0) {
        throw new Error('Quoted CSV fields must start at the beginning of a column.');
      }
      inQuotes = true;
    } else if (character === ',') {
      finishField();
    } else if (character === '\n' || character === '\r') {
      if (character === '\r' && input[index + 1] === '\n') {
        index += 1;
      }
      finishRecord();
    } else {
      field += character;
    }
  }

  if (inQuotes) {
    throw new Error('The CSV contains an unclosed quoted field.');
  }
  if (field.length > 0 || record.length > 0) {
    finishRecord();
  }

  if (
    records[0]?.length === 3 &&
    records[0].every(
      (value, index) => value.trim().toLowerCase() === ['from', 'to', 'connection'][index]
    )
  ) {
    records.shift();
  }

  return records.map((values, index) => {
    if (values.length !== 3) {
      throw new Error(`CSV row ${index + 1} must have exactly three columns: From,To,Connection.`);
    }
    return {
      from: values[0].trim(),
      to: values[1].trim(),
      relation: values[2].trim()
    };
  });
}
