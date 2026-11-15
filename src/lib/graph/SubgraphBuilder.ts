import { ConnectionGraph } from '#lib/graph/ConnectionGraph';
import type { SeededRandom } from '#lib/graph/SeededRandom';
import type { GraphConfig, RelationshipRow } from '#lib/types';

export interface SubgraphResult {
  rows: RelationshipRow[];
  visiblePeople: string[];
  visibleEdgeRowIds: string[];
}

export class SubgraphBuilder {
  build(
    rows: readonly RelationshipRow[],
    config: GraphConfig,
    rng: SeededRandom
  ): SubgraphResult {
    const validRows = rows.filter(
      (row) =>
        row.from.trim().length > 0 &&
        row.to.trim().length > 0 &&
        row.from.trim() !== row.to.trim()
    );
    let selected: RelationshipRow[] = [];

    for (const row of rng.shuffle(validRows)) {
      const graph = new ConnectionGraph(selected);
      if (graph.canAddEdge(row, config.maxConnectionsPerNode)) selected.push(row);
    }

    for (let attempt = 0; attempt < 20 && selected.length > 3; attempt += 1) {
      const isolatedRows = new ConnectionGraph(selected).findIsolatedPairRows();
      if (isolatedRows.length === 0) break;

      const prunedRowSet = new Set(isolatedRows);
      const unprunedRows = selected.filter((row) => !prunedRowSet.has(row));
      if (unprunedRows.length === 0) break;
      selected = unprunedRows;
    }

    for (let attempt = 0; attempt < 50; attempt += 1) {
      const bridge = new ConnectionGraph(selected).findBridgeCandidate(
        validRows,
        config.maxConnectionsPerNode,
        rng
      );
      if (!bridge) break;
      selected.push(bridge);
    }

    const people = [
      ...new Set(selected.flatMap((row) => [row.from, row.to]))
    ];
    const visiblePeople = people.filter(() => !rng.odds(config.hiddenNodeLabelRatio));
    const visibleEdgeRowIds = selected
      .filter(() => !rng.odds(config.hiddenEdgeLabelRatio))
      .map((row) => row.id);

    return {
      rows: selected.map((row) => ({ ...row })),
      visiblePeople,
      visibleEdgeRowIds
    };
  }
}
