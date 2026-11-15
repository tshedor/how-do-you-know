import type { RelationshipRow } from '#lib/types';
import { SeededRandom } from '#lib/graph/SeededRandom';

export class ConnectionGraph {
  private readonly rows: readonly RelationshipRow[];
  private readonly adjacency = new Map<string, Set<string>>();

  constructor(rows: readonly RelationshipRow[]) {
    this.rows = rows;

    for (const row of rows) {
      this.addPerson(row.from);
      this.addPerson(row.to);
      if (row.from === row.to) continue;
      this.adjacency.get(row.from)?.add(row.to);
      this.adjacency.get(row.to)?.add(row.from);
    }
  }

  degree(person: string): number {
    return this.adjacency.get(person)?.size ?? 0;
  }

  canAddEdge(row: RelationshipRow, maxConnectionsPerNode: number): boolean {
    if (!row.from.trim() || !row.to.trim() || row.from.trim() === row.to.trim()) {
      return false;
    }
    if (this.adjacency.get(row.from)?.has(row.to)) return false;
    return (
      this.degree(row.from) < maxConnectionsPerNode &&
      this.degree(row.to) < maxConnectionsPerNode
    );
  }

  findIsolatedPairRows(): RelationshipRow[] {
    const isolatedRows: RelationshipRow[] = [];
    const visited = new Set<string>();

    for (const [person, neighbors] of this.adjacency) {
      if (visited.has(person) || neighbors.size !== 1) continue;
      const [otherPerson] = neighbors;
      if (person === otherPerson || this.degree(otherPerson) !== 1) continue;

      const componentRows = this.rows.filter(
        (row) =>
          (row.from === person && row.to === otherPerson) ||
          (row.from === otherPerson && row.to === person)
      );
      isolatedRows.push(...componentRows);
      visited.add(person);
      visited.add(otherPerson);
    }

    return isolatedRows;
  }

  findBridgeCandidate(
    candidates: readonly RelationshipRow[],
    maxConnectionsPerNode: number,
    rng: SeededRandom
  ): RelationshipRow | null {
    const components = this.findComponents();
    if (components.length < 2) return null;

    const componentByPerson = new Map<string, Set<string>>();
    for (const component of components) {
      for (const person of component) componentByPerson.set(person, component);
    }

    const shuffledCandidates = rng.shuffle(candidates);
    for (const component of [...components].sort((a, b) => a.size - b.size)) {
      for (const row of shuffledCandidates) {
        const fromComponent = componentByPerson.get(row.from);
        const toComponent = componentByPerson.get(row.to);
        if (!fromComponent || !toComponent || fromComponent === toComponent) continue;
        if (!component.has(row.from) && !component.has(row.to)) continue;
        if (this.canAddEdge(row, maxConnectionsPerNode)) return row;
      }
    }

    return null;
  }

  private addPerson(person: string): void {
    if (!this.adjacency.has(person)) this.adjacency.set(person, new Set());
  }

  private findComponents(): Set<string>[] {
    const components: Set<string>[] = [];
    const visited = new Set<string>();

    for (const person of this.adjacency.keys()) {
      if (visited.has(person)) continue;
      const component = new Set<string>();
      const pending = [person];

      while (pending.length > 0) {
        const current = pending.pop();
        if (current === undefined || visited.has(current)) continue;
        visited.add(current);
        component.add(current);
        for (const neighbor of this.adjacency.get(current) ?? []) {
          if (!visited.has(neighbor)) pending.push(neighbor);
        }
      }

      components.push(component);
    }

    return components;
  }
}
