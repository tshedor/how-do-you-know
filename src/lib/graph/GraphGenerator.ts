import { DotSerializer } from '#lib/graph/DotSerializer';
import { SeededRandom } from '#lib/graph/SeededRandom';
import { SubgraphBuilder } from '#lib/graph/SubgraphBuilder';
import type {
  GeneratedGraph,
  GraphConfig,
  PageExportSettings,
  RelationshipRow
} from '#lib/types';

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

export class GraphGenerator {
  private readonly subgraphBuilder = new SubgraphBuilder();
  private readonly dotSerializer = new DotSerializer();

  generate(rows: RelationshipRow[], config: GraphConfig): GeneratedGraph[] {
    const graphCount = Math.trunc(clamp(config.graphCount, 1, 20));
    const rng = new SeededRandom(config.seed);

    return Array.from({ length: graphCount }, (_, index) => {
      const subgraph = this.subgraphBuilder.build(rows, config, rng);
      return {
        index,
        rows: subgraph.rows,
        visibleNode: subgraph.visibleNode,
        visibleEdgeRowIds: subgraph.visibleEdgeRowIds,
        dot: this.dotSerializer.serialize(
          subgraph.rows,
          config,
          subgraph.visibleNode,
          subgraph.visibleEdgeRowIds
        )
      };
    });
  }

  buildStandalone(
    rows: RelationshipRow[],
    settings: PageExportSettings,
    hiddenNode: Iterable<string>,
    hiddenEdgeRowIds: Iterable<string>
  ): GeneratedGraph {
    const selectedRows = rows
      .filter(
        (row) =>
          row.from.trim().length > 0 &&
          row.to.trim().length > 0 &&
          row.from.trim() !== row.to.trim()
      )
      .map((row) => ({ ...row }));
    const hiddenNodeSet = new Set(hiddenNode);
    const hiddenEdgeSet = new Set(hiddenEdgeRowIds);
    const people = [...new Set(selectedRows.flatMap((row) => [row.from, row.to]))];
    const visibleNode = people.filter((person) => !hiddenNodeSet.has(person));
    const visibleEdgeRowIds = selectedRows
      .filter((row) => !hiddenEdgeSet.has(row.id))
      .map((row) => row.id);

    return {
      index: 0,
      rows: selectedRows,
      visibleNode,
      visibleEdgeRowIds,
      dot: this.dotSerializer.serialize(
        selectedRows,
        settings,
        visibleNode,
        visibleEdgeRowIds,
        true
      )
    };
  }

  buildViewAll(rows: RelationshipRow[], settings: PageExportSettings): GeneratedGraph {
    return {
      ...this.buildStandalone(rows, settings, [], []),
      index: -1
    };
  }
}
