import * as fs from 'fs';
import * as csv from "csv/sync";
import { exec } from 'child_process';
import { setTimeout } from 'node:timers/promises';


// Run the pipeline
import { generate, parse, transform, stringify } from "csv/sync";

function rowsToGrouping(rows) {
  return rows.reduce((acc, row) => {
    if (!acc[row.from]) acc[row.from] = new Set();
    if (!acc[row.to]) acc[row.to] = new Set();
    acc[row.from].add(row.to);
    acc[row.to].add(row.from);
    return acc;
  }, {});
}

function invalidRows(rows) {
  const grouping = rowsToGrouping(rows);

  const keys = Object.keys(grouping).filter((me) => {
    if (grouping[me].size > 1) return false;
    const myOnlyOne = [...grouping[me]][0];
    if (grouping[myOnlyOne].size > 1) return false;
    const theirOnlyOne = [...grouping[myOnlyOne]][0];
    return me == theirOnlyOne;
  });
  return rows.filter((r) => keys.includes(r.from));
}

function shuffle(array) {
  const copy = [...array];

  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }

  return copy;
}

function walkRows(rows) {
  const connectedTo = {};
  const grouping = rowsToGrouping(rows);

  function subset(originalName, subGroup) {
    for (const name of [...subGroup]) {
      const shouldRecurse = !connectedTo[originalName].has(name);
      connectedTo[originalName].add(name);
      if (shouldRecurse) subset(originalName, grouping[name]);
    }
  }

  for (const name of Object.keys(grouping)) {
    if (!connectedTo[name]) connectedTo[name] = new Set();
    subset(name, grouping[name]);
  }

  return connectedTo;
}

function findConnection(rows, all) {
  const grouping = rowsToGrouping(rows);
  const allConnections = walkRows(rows);
  const totalRows = Object.values(allConnections);
  if (totalRows.every((r) => r.size == totalRows[0].size) && (totalRows.length - 1) != totalRows[0].size) {
    return null;
  }

  totalRows.sort((a, b) => a.size - b.size);

  const shuffled = shuffle(all);
  for (const group of totalRows) {
    for (const row of shuffled) {
      if (!grouping[row.from]) continue;
      if (!grouping[row.to]) continue;
      if (grouping[row.from].has(row.to)) continue;
      if (grouping[row.to].has(row.from)) continue;
      if (!group.has(row.from) && !group.has(row.to)) continue;
      return row;
    }
  }
}

function createRows(unusedRecords,all,used,attempt = 0) {
  const rows = [];
  for (let i = 0; i < unusedRecords.length; i++) {
    if (rows.length > 17) {
      break;
    }

    if (rows.length > 11 && !invalidRows(rows).length) {
      break;
    }

    rows.push(unusedRecords[i]);
  }

  if (invalidRows(rows).length && attempt < 20) {
    const invalid = new Set([...invalidRows(rows)]);
    const removed = rows.filter((row) => {
      return !invalid.has(row);
    });

    return createRows(removed, all, used, attempt + 1);
  }

  let connection = findConnection(rows, all);
  if (connection) {
    let connectionAttempts = 0;
    while (connectionAttempts < 50 && connection) {
      rows.push(connection);
      connection = findConnection(rows, all);
      connectionAttempts++;
    }
  }

  for (const row of rows) {
    used.add(row);
  }

  return rows;
}

function createMap(rows, graphViz = true) {
  const odds = (percent = 0.5) => Math.random() < percent;
  const uniquePeople = [...new Set([...rows.map((r) => r.from), ...rows.map((r) => r.to)])];

  if (graphViz) {
    const body = rows.map(function (row) {
      const text = row.relation.match(/\b[\w']+(?:[^\w\n]+[\w']+){0,2}\b/g);
      // const showText = odds(0.9);

      const out = `  "${row.from}" -- "${row.to}"`;
      // if (!showText) return out;
      const labelId = row.from.replaceAll(' ', '') + row.to.replaceAll(' ', '');
      return `  ${labelId} [label="${text.join('\\n')}", fontsize=38, shape=plaintext, style=filled, fillcolor=white];
  "${row.from}" -- ${labelId};
  ${labelId} -- "${row.to}";`;
    }).join('\n');

    const shownAmount = Math.ceil(rows.length * .18);

    const header = `strict graph G {
  size="11,8.5!";
  ratio="fill";
  margin=0;
  node [shape=circle, fontsize=42, width=4.5, height=2, penwidth=3]
  edge [penwidth=5, style=tapered];
  fontsize="42";
  labeljust = "l";
  labelfloat=true;

  # Force the layout engine to actively push overlapping nodes apart
  overlap=false;

  # Optional: Automatically clear overlaps using a spring-force algorithm
  splines=true;

`;
    const footer = `
}`;

    const people = uniquePeople.map((p, i) => {
      return `  "${p}" [label="${p}"]`;
    }).join('\n');

    return header + people + '\n\n' + body + footer;
  }

  const people = uniquePeople.map(function (p, i) {
    return `  rectangle "${odds(0.9) ? p : ' '}" as ${p.replaceAll(' ', '')}`;
  }).join('\n');
  const header = `@startuml
  skinparam stateDiagramEdgeLabelStyle node
  skinparam ranksep 20
  scale 1100x850
  skinparam dpi 300
  skinparam rectangle {
    Padding 500
    MinimumWidth 200
    MaximumWidth 200
    RoundCorner 100
    Margin 30
    BackGroundColor Transparent
    BackGroundColor Transparent
  }
  <style>
    rectangle {
      Padding 40
      MinimumWidth 140
    }
  </style>

`;

  const body = rows.map(function (row) {
    const text = row.relation.match(/\b[\w']+(?:[^\w\n]+[\w']+){0,2}\b/g).join('\\l');

    const out = `  ${row.from.replaceAll(' ', '')} -- ${row.to.replaceAll(' ', '')}`
    if (odds(0.7)) return out;
    return `${out} : "${text}"`;
  }).join('\n');

  const footer = `
@enduml`;

  return header + people + '\n\n' + body + footer;
}


async function main(source) {
  const graphvizDir = `graphviz.${source}`;
  fs.rmSync(graphvizDir, { recursive: true, force: true });
  fs.mkdir(graphvizDir, () => {});

  // fs.rmSync(pumlDir, { recursive: true, force: true });
  // fs.mkdir(pumlDir, () => {});

  // fs.rmSync(`${pumlDir}.out`, { recursive: true, force: true });
  // fs.mkdir(`${pumlDir}.out`, () => {});

  let genCount = 0;
  const generatedRows = [];

  const data = fs.readFileSync(`${source}.csv`).toLocaleString();

  const used = new Set();
  const rawRecords = parse(data);
  const all = shuffle(rawRecords).reduce((acc, curr) => {
    const from = curr[0];
    const to = curr[1];
    const relation = curr[2];
    return [{from,to,relation}, ...acc];
  }, []);

  while (used.size != all.length) {
    if (genCount > 20) {
      console.warn(`Missing ${all.length - used.size}`);
      break;
    }

    const sorted = shuffle(all);
    generatedRows.push(createRows(sorted, all, used));
    genCount++;
  }

  const missing = new Set([...all]).symmetricDifference(used);
  for (const row of missing) {
    loop2:
    for (const rows of generatedRows) {
      loop3:
      for (const genRow of rows) {
        if ((genRow.from === row.from || genRow.to === row.from) || (genRow.to === row.to || genRow.from === row.to)) {
          rows.push(row);
          used.add(row);
          break loop2;
        }
      }
    }
  }

  for (let i = 0; i < generatedRows.length; i++) {
    fs.writeFile(`${graphvizDir}/gen${i}.dot`, createMap(generatedRows[i]), err => {
      if (err) {
        console.error(err);
      } else {
        // file written successfully
      }
    });

    await exec(`dot -Tpng -Gdpi=300 ${graphvizDir}/gen${i}.dot -o ${graphvizDir}/output${i}.png`);
  }

  // for (let i = 0; i < generatedRows.length; i++) {
  //   fs.writeFile(`${pumlDir}/gen${i}.puml`, createMap(generatedRows[i], false), err => {
  //     if (err) {
  //       console.error(err);
  //     } else {
  //       // file written successfully
  //     }
  //   });
  // }
  // await exec(`java -jar plantuml.jar ${pumlDir}/ --outputDir ${pumlDir}.out/ --format png`);
}

async function runAll() {
  await main('relations');
}
runAll();
