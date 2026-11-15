import { DEFAULT_CONFIG } from '#lib/constants/sampleData';
import type {
  GeneratedGraph,
  GraphConfig,
  PageExportSettings,
  RelationshipRow
} from '#lib/types';

export class PartyMapGenerator {
  constructor(
    private readonly rows: RelationshipRow[] = [],
    private readonly config: GraphConfig = DEFAULT_CONFIG
  ) {}

  generate(rows: RelationshipRow[], config: GraphConfig): GeneratedGraph[] {
    return [];
  }

  buildViewAll(rows: RelationshipRow[], settings: PageExportSettings): GeneratedGraph {
    return this.emptyGraph();
  }

  buildStandalone(
    rows: RelationshipRow[],
    settings: PageExportSettings,
    hiddenPeople: Iterable<string>,
    hiddenEdgeRowIds: Iterable<string>
  ): GeneratedGraph {
    return this.emptyGraph();
  }

  private emptyGraph(): GeneratedGraph {
    return {
      index: 0,
      dot: '',
      rows: this.rows.map((row) => ({ ...row })),
      visiblePeople: [],
      visibleEdgeRowIds: this.config.graphCount === 0 ? [] : this.rows.map((row) => row.id)
    };
  }
}
