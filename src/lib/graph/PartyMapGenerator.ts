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

export class PartyMapGenerator {
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
        visiblePeople: subgraph.visiblePeople,
        visibleEdgeRowIds: subgraph.visibleEdgeRowIds,
        dot: this.dotSerializer.serialize(
          subgraph.rows,
          config,
          subgraph.visiblePeople,
          subgraph.visibleEdgeRowIds
        )
      };
    });
  }

  buildStandalone(
    rows: RelationshipRow[],
    settings: PageExportSettings,
    hiddenPeople: Iterable<string>,
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
    const hiddenPeopleSet = new Set(hiddenPeople);
    const hiddenEdgeSet = new Set(hiddenEdgeRowIds);
    const people = [...new Set(selectedRows.flatMap((row) => [row.from, row.to]))];
    const visiblePeople = people.filter((person) => !hiddenPeopleSet.has(person));
    const visibleEdgeRowIds = selectedRows
      .filter((row) => !hiddenEdgeSet.has(row.id))
      .map((row) => row.id);

    return {
      index: 0,
      rows: selectedRows,
      visiblePeople,
      visibleEdgeRowIds,
      dot: this.dotSerializer.serialize(
        selectedRows,
        settings,
        visiblePeople,
        visibleEdgeRowIds
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
