import { describe, expect, it } from 'vitest';
import { ConnectionGraph } from '#lib/graph/ConnectionGraph';
import { DotSerializer } from '#lib/graph/DotSerializer';
import { GraphGenerator } from '#lib/graph/GraphGenerator';
import { SeededRandom } from '#lib/graph/SeededRandom';
import type {
  GraphConfig,
  Orientation,
  PageExportSettings,
  PageSize,
  RelationshipRow
} from '#lib/types';

const baseSettings: PageExportSettings = {
  pageSize: '8.5x11',
  orientation: 'landscape',
  exportFormat: 'PNG',
  nodeFontSize: 42,
  edgeFontSize: 38
};

const baseConfig: GraphConfig = {
  ...baseSettings,
  graphCount: 1,
  maxConnectionsPerNode: 4,
  hiddenEdgeLabelRatio: 0,
  hiddenNodeLabelRatio: 0,
  seed: 123456789
};

function row(
  id: string,
  from: string,
  to: string,
  relation = 'knows'
): RelationshipRow {
  return { id, from, to, relation };
}

function config(patch: Partial<GraphConfig> = {}): GraphConfig {
  return { ...baseConfig, ...patch };
}

describe('SeededRandom', () => {
  it('produces repeatable values and shuffles without mutating the input', () => {
    const first = new SeededRandom(42);
    const second = new SeededRandom(42);
    const input = ['a', 'b', 'c', 'd', 'e'];

    expect([first.next(), first.next(), first.next()]).toEqual([
      second.next(),
      second.next(),
      second.next()
    ]);
    expect(new SeededRandom(42).shuffle(input)).toEqual(new SeededRandom(42).shuffle(input));
    expect(input).toEqual(['a', 'b', 'c', 'd', 'e']);
  });

  it('handles probability boundaries without consuming randomness', () => {
    const bounded = new SeededRandom(7);
    const control = new SeededRandom(7);

    expect(bounded.odds(0)).toBe(false);
    expect(bounded.odds(-1)).toBe(false);
    expect(bounded.odds(1)).toBe(true);
    expect(bounded.odds(2)).toBe(true);
    expect(bounded.next()).toBe(control.next());
  });
});

describe('ConnectionGraph', () => {
  it('rejects self-loops, duplicate undirected edges, and degree overflow', () => {
    const graph = new ConnectionGraph([row('r1', 'A', 'B')]);

    expect(graph.degree('A')).toBe(1);
    expect(graph.degree('missing')).toBe(0);
    expect(graph.canAddEdge(row('self', 'A', 'A'), 4)).toBe(false);
    expect(graph.canAddEdge(row('duplicate', 'B', 'A'), 4)).toBe(false);
    expect(graph.canAddEdge(row('capped', 'A', 'C'), 1)).toBe(false);
    expect(graph.canAddEdge(row('valid', 'A', 'C'), 2)).toBe(true);
  });

  it('finds isolated pairs and bridge candidates within the degree cap', () => {
    const selected = [row('r1', 'A', 'B'), row('r2', 'C', 'D')];
    const bridge = row('bridge', 'B', 'C');
    const graph = new ConnectionGraph(selected);

    expect(graph.findIsolatedPairRows()).toEqual(selected);
    expect(graph.findBridgeCandidate([...selected, bridge], 2, new SeededRandom(9))).toBe(
      bridge
    );
    expect(graph.findBridgeCandidate([bridge], 1, new SeededRandom(9))).toBeNull();
  });
});

describe('GraphGenerator.generate', () => {
  const generator = new GraphGenerator();
  const rows = [
    row('r1', 'Alice', 'Bob', 'Sunday night drum circle'),
    row('r2', 'Bob', 'Carol', 'Work nemesis'),
    row('r3', 'Carol', 'Dan', 'Started drum circle'),
    row('r4', 'Dan', 'Alice', 'Monday night sewing circle'),
    row('r5', 'Alice', 'Carol', 'Wombmates')
  ];

  it('is deterministic for the same rows, config, and seed', () => {
    const generationConfig = config({
      graphCount: 4,
      hiddenEdgeLabelRatio: 0.4,
      hiddenNodeLabelRatio: 0.3
    });

    expect(generator.generate(rows, generationConfig)).toEqual(
      generator.generate(rows, generationConfig)
    );
  });

  it('generates every requested graph count from 1 through 20', () => {
    for (let graphCount = 1; graphCount <= 20; graphCount += 1) {
      const graphs = generator.generate(rows, config({ graphCount }));
      expect(graphs).toHaveLength(graphCount);
      expect(graphs.map((graph) => graph.index)).toEqual(
        Array.from({ length: graphCount }, (_, index) => index)
      );
    }

    expect(generator.generate(rows, config({ graphCount: 0 }))).toHaveLength(1);
    expect(generator.generate(rows, config({ graphCount: 21 }))).toHaveLength(20);
  });

  it('enforces maxConnectionsPerNode on every generated graph', () => {
    const graphs = generator.generate(rows, config({ graphCount: 5, maxConnectionsPerNode: 2 }));

    for (const graph of graphs) {
      const connections = new ConnectionGraph(graph.rows);
      for (const person of new Set(graph.rows.flatMap((item) => [item.from, item.to]))) {
        expect(connections.degree(person)).toBeLessThanOrEqual(2);
      }
    }
  });

  it('shows exact graph-wide name and connection counts for a 20 percent ratio', () => {
    const cycle = [
      row('r1', 'A', 'B'),
      row('r2', 'B', 'C'),
      row('r3', 'C', 'D'),
      row('r4', 'D', 'E'),
      row('r5', 'E', 'A')
    ];
    const [graph] = generator.generate(
      cycle,
      config({ hiddenNodeLabelRatio: 0.8, hiddenEdgeLabelRatio: 0.8 })
    );

    expect(graph.rows).toHaveLength(5);
    expect(graph.visibleNode).toHaveLength(1);
    expect(graph.visibleEdgeRowIds).toHaveLength(1);
    expect(graph.dot.match(/id="person:/g)).toHaveLength(1);
    expect(graph.dot.match(/id="edge:/g)).toHaveLength(1);
  });

  it('hides person labels and omits person IDs when hiddenNodeLabelRatio is 1', () => {
    const [graph] = generator.generate(
      [row('r1', 'Alice', 'Bob')],
      config({ hiddenNodeLabelRatio: 1 })
    );

    expect(graph.visibleNode).toEqual([]);
    expect(graph.dot).toContain('"Alice" [label="", tooltip=""];');
    expect(graph.dot).toContain('"Bob" [label="", tooltip=""];');
    expect(graph.dot).not.toContain('person:');
  });

  it('emits a blank label node for hidden edges and a direct edge for blank visible labels', () => {
    const [hiddenGraph] = generator.generate(
      [row('hidden', 'Alice', 'Bob')],
      config({ hiddenEdgeLabelRatio: 1 })
    );
    const [blankGraph] = generator.generate(
      [row('blank', 'Alice', 'Bob', '   ')],
      config()
    );

    expect(hiddenGraph.visibleEdgeRowIds).toEqual([]);
    expect(hiddenGraph.dot).not.toContain('"Alice" -- "Bob" [tooltip=""];');
    expect(hiddenGraph.dot).toContain('"__label_hidden" [label=" ", tooltip="", fontsize=38');
    expect(hiddenGraph.dot).toContain('"Alice" -- "__label_hidden" [tooltip=""];');
    expect(hiddenGraph.dot).not.toContain('id="edge:hidden"');
    expect(blankGraph.visibleEdgeRowIds).toEqual(['blank']);
    expect(blankGraph.dot).toContain('"Alice" -- "Bob" [tooltip=""];');
    expect(blankGraph.dot).not.toContain('__label_blank');
  });

  it('uses visible edge label-as-node structure and wraps after 12 characters', () => {
    const [graph] = generator.generate(
      [row('r1', 'Alice', 'Bob', 'alpha beta gamma delta epsilon zeta eta theta')],
      config()
    );

    expect(graph.dot).toContain(
      '"__label_r1" [id="edge:r1", label="alpha beta gamma\\ndelta epsilon\\nzeta eta theta", tooltip="", fontsize=38, shape=plaintext, style=filled, fillcolor=white];'
    );
    expect(graph.dot).toContain('"Alice" -- "__label_r1" [tooltip=""];');
    expect(graph.dot).toContain('"__label_r1" -- "Bob" [tooltip=""];');
    expect(graph.dot).not.toContain('"Alice" -- "Bob" [tooltip=""];');
  });

  it('serializes configured node and edge font sizes', () => {
    const [graph] = generator.generate(
      [row('r1', 'Alice', 'Bob')],
      config({ nodeFontSize: 56, edgeFontSize: 31 })
    );

    expect(graph.dot).toContain(
      'node [shape=circle, fontsize=56, width=4.5, height=2, fixedsize=false, penwidth=3]'
    );
    expect(graph.dot).toContain('edge [penwidth=5, style=tapered, fontsize=31]');
    expect(graph.dot).toContain('fontsize="56";');
    expect(graph.dot).toContain('fontsize=31, shape=plaintext');
  });

  it('prunes isolated pairs without pruning a small input to zero rows', () => {
    const isolatedPair = row('pair', 'A', 'B');
    const triangle = [row('t1', 'C', 'D'), row('t2', 'D', 'E'), row('t3', 'E', 'C')];
    const [pruned] = generator.generate([isolatedPair, ...triangle], config());
    const [small] = generator.generate([isolatedPair], config());

    expect(pruned.rows.map((item) => item.id).sort()).toEqual(['t1', 't2', 't3']);
    expect(small.rows).toEqual([isolatedPair]);
  });
});

describe('DOT page layout and escaping', () => {
  const generator = new GraphGenerator();
  const cases: Array<[PageSize, Orientation, string]> = [
    ['8.5x11', 'portrait', 'size="8.5,11!";'],
    ['8.5x11', 'landscape', 'size="11,8.5!";'],
    ['11x17', 'portrait', 'size="11,17!";'],
    ['11x17', 'landscape', 'size="17,11!";'],
    ['8.3x11.7', 'portrait', 'size="8.3,11.7!";'],
    ['8.3x11.7', 'landscape', 'size="11.7,8.3!";']
  ];

  for (const [pageSize, orientation, expected] of cases) {
    it(`uses ${pageSize} dimensions in ${orientation} orientation`, () => {
      const graph = generator.buildStandalone(
        [row('r1', 'Alice', 'Bob')],
        { ...baseSettings, pageSize, orientation },
        [],
        []
      );
      expect(graph.dot).toContain(expected);
    });
  }

  it('escapes quotes and backslashes in names, relations, and label node IDs', () => {
    const serializer = new DotSerializer();
    const dot = serializer.serialize(
      [row('row"1', 'Alice "Al"', 'Bob\\North', 'said "hello" loudly')],
      baseSettings,
      ['Alice "Al"', 'Bob\\North'],
      ['row"1']
    );

    expect(dot).toContain('"Alice \\"Al\\"" [id="person:Alice%20%22Al%22"');
    expect(dot).toContain('"Bob\\\\North" [id="person:Bob%5CNorth"');
    expect(dot).toContain('"__label_row\\"1" [id="edge:row%221"');
    expect(dot).toContain('label="said \\"hello\\"\\nloudly"');
  });

  it('trims and escapes relations without wrapping spaces', () => {
    const dot = new DotSerializer().serialize(
      [row('r1', 'A', 'B', '  "!!!"  ')],
      baseSettings,
      ['A', 'B'],
      ['r1']
    );
    expect(dot).toContain('label="\\"!!!\\""');
  });
});

describe('standalone and view-all graphs', () => {
  const generator = new GraphGenerator();

  it('builds every valid standalone row without a degree cap and applies hidden sets', () => {
    const validRows = [
      row('r1', 'A', 'B'),
      row('r2', 'A', 'C'),
      row('r3', 'A', 'D'),
      row('r4', 'B', 'A', 'reverse duplicate is still a standalone row')
    ];
    const input = [
      ...validRows,
      row('blank', ' ', 'E'),
      row('self', 'A', ' A ')
    ];
    const graph = generator.buildStandalone(input, baseSettings, ['B'], ['r2']);

    expect(graph.index).toBe(0);
    expect(graph.rows).toEqual(validRows);
    expect(graph.rows).not.toBe(validRows);
    expect(graph.visibleNode).toEqual(['A', 'C', 'D']);
    expect(graph.visibleEdgeRowIds).toEqual(['r1', 'r3', 'r4']);
    expect(graph.dot).toContain('"B" [label="", tooltip=""];');
    expect(graph.dot).not.toContain('person:B');
    expect(graph.dot).not.toContain('"A" -- "C" [tooltip=""];');
    expect(graph.dot).toContain('"__label_r2" [label=" ", tooltip="", fontsize=38');
    expect(graph.dot).toContain('"A" -- "__label_r2" [tooltip=""];');
    expect(graph.dot).not.toContain('id="edge:r2"');
    expect(input).toHaveLength(6);
  });

  it('builds view-all as a fully visible standalone graph with index -1', () => {
    const rows = [row('r1', 'Alice', 'Bob'), row('r2', 'Bob', 'Carol')];
    const standalone = generator.buildStandalone(rows, baseSettings, [], []);
    const viewAll = generator.buildViewAll(rows, baseSettings);

    expect(viewAll.index).toBe(-1);
    expect({ ...viewAll, index: 0 }).toEqual(standalone);
    expect(viewAll.visibleNode).toEqual(['Alice', 'Bob', 'Carol']);
    expect(viewAll.visibleEdgeRowIds).toEqual(['r1', 'r2']);
    expect(viewAll.dot).toContain('person:Alice');
    expect(viewAll.dot).toContain('__label_r1');
  });
});
