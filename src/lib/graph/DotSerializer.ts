import type {
  Orientation,
  PageExportSettings,
  PageSize,
  RelationshipRow
} from '#lib/types';

const PAGE_SIZES: Record<PageSize, readonly [number, number]> = {
  '8.5x11': [8.5, 11],
  '11x17': [11, 17],
  '8.3x11.7': [8.3, 11.7]
};

export function getPageDimensions(
  pageSize: PageSize,
  orientation: Orientation
): readonly [number, number] {
  const [short, long] = PAGE_SIZES[pageSize];
  return orientation === 'portrait' ? [short, long] : [long, short];
}

export function escapeDotString(value: string): string {
  return value.replaceAll('\\', '\\\\').replaceAll('"', '\\"');
}

export function wrapEdgeLabel(relation: string): string {
  const lines: string[] = [];
  let remaining = relation.trim();

  while (remaining.length > 12) {
    const wrapIndex = remaining.indexOf(' ', 12);
    if (wrapIndex === -1) break;
    lines.push(remaining.slice(0, wrapIndex));
    remaining = remaining.slice(wrapIndex + 1).trimStart();
  }

  lines.push(remaining);
  return lines.map(escapeDotString).join('\\n');
}

export class DotSerializer {
  serialize(
    rows: readonly RelationshipRow[],
    settings: PageExportSettings,
    visibleNode: Iterable<string>,
    visibleEdgeRowIds: Iterable<string>,
    preserveHiddenEdgeSpace = false
  ): string {
    const [width, height] = getPageDimensions(settings.pageSize, settings.orientation);
    const visibleNodeSet = new Set(visibleNode);
    const visibleEdgeSet = new Set(visibleEdgeRowIds);
    const people = [...new Set(rows.flatMap((row) => [row.from, row.to]))];
    const lines = [
      'strict graph G {',
      `  size="${width},${height}!";`,
      '  ratio="fill";',
      '  margin=0;',
      `  node [shape=circle, fontsize=${settings.nodeFontSize}, width=4.5, height=2, penwidth=3]`,
      `  edge [penwidth=5, style=tapered, fontsize=${settings.edgeFontSize}]`,
      `  fontsize="${settings.nodeFontSize}";`,
      '  labeljust="l";',
      '  labelfloat=true;',
      '  overlap=false;',
      '  splines=true;',
      ''
    ];

    for (const person of people) {
      const escapedPerson = escapeDotString(person);
      if (visibleNodeSet.has(person)) {
        lines.push(
          `  "${escapedPerson}" [id="person:${encodeURIComponent(person)}", label="${escapedPerson}", tooltip=""];`
        );
      } else {
        lines.push(`  "${escapedPerson}" [label="", tooltip=""];`);
      }
    }

    for (const row of rows) {
      const escapedFrom = escapeDotString(row.from);
      const escapedTo = escapeDotString(row.to);
      const isEdgeVisible = visibleEdgeSet.has(row.id);
      const preserveHiddenSpace = !isEdgeVisible && preserveHiddenEdgeSpace;
      if (
        (!isEdgeVisible && !preserveHiddenSpace) ||
        (isEdgeVisible && row.relation.trim().length === 0)
      ) {
        lines.push(`  "${escapedFrom}" -- "${escapedTo}" [tooltip=""];`);
        continue;
      }

      const escapedRowId = escapeDotString(row.id);
      const labelId = `__label_${escapedRowId}`;
      const edgeIdAttribute = isEdgeVisible ? `id="edge:${encodeURIComponent(row.id)}", ` : '';
      const label = isEdgeVisible ? wrapEdgeLabel(row.relation) : ' ';
      lines.push(
        `  "${labelId}" [${edgeIdAttribute}label="${label}", tooltip="", fontsize=${settings.edgeFontSize}, shape=plaintext, style=filled, fillcolor=white];`,
        `  "${escapedFrom}" -- "${labelId}" [tooltip=""];`,
        `  "${labelId}" -- "${escapedTo}" [tooltip=""];`
      );
    }

    lines.push('}');
    return lines.join('\n');
  }
}
