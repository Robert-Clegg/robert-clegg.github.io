#!/usr/bin/env node
/**
 * replay-diff.js — Behavioral Diff Tool for Pathogenika Telemetry
 *
 * Usage:
 *   node replay-diff.js <file1.json> [file2.json]
 *
 * If one file:  compare human vs AI within that session
 * If two files: compare human across both sessions
 *
 * Output: text summary to stdout + HTML report to replay-diff-report.html
 */

const fs = require('fs');
const path = require('path');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function loadSession(filePath) {
  const raw = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(raw);
}

function shannonEntropy(counts) {
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  if (total === 0) return 0;
  let H = 0;
  for (const c of Object.values(counts)) {
    if (c === 0) continue;
    const p = c / total;
    H -= p * Math.log2(p);
  }
  return H;
}

function mean(arr) {
  if (arr.length === 0) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function stdev(arr) {
  if (arr.length < 2) return 0;
  const m = mean(arr);
  return Math.sqrt(arr.reduce((s, v) => s + (v - m) ** 2, 0) / (arr.length - 1));
}

function variance(arr) {
  if (arr.length < 2) return 0;
  const m = mean(arr);
  return arr.reduce((s, v) => s + (v - m) ** 2, 0) / (arr.length - 1);
}

// ---------------------------------------------------------------------------
// Metrics computation
// ---------------------------------------------------------------------------

function computeMetrics(events, label) {
  const timestamps = events.map(e => e.timestamp);
  const duration = events.length > 0
    ? Math.max(...timestamps) - Math.min(...timestamps)
    : 0;

  // Decision rate over time (events per 10s window)
  const windowSize = 10;
  const windows = {};
  for (const e of events) {
    const bucket = Math.floor(e.timestamp / windowSize) * windowSize;
    windows[bucket] = (windows[bucket] || 0) + 1;
  }
  const windowCounts = Object.values(windows);
  const windowKeys = Object.keys(windows).map(Number).sort((a, b) => a - b);

  // Action diversity (Shannon entropy of event types)
  const typeCounts = {};
  for (const e of events) {
    typeCounts[e.eventType] = (typeCounts[e.eventType] || 0) + 1;
  }
  const entropy = shannonEntropy(typeCounts);

  // Spatial coverage (position variance from events with posX/posZ)
  const posXs = [];
  const posZs = [];
  for (const e of events) {
    const d = e.data || {};
    const px = d.posX ?? d.playerX ?? d.fromX ?? null;
    const pz = d.posZ ?? d.playerZ ?? d.fromZ ?? null;
    if (px !== null && pz !== null) {
      posXs.push(px);
      posZs.push(pz);
    }
  }
  const spatialVarianceX = variance(posXs);
  const spatialVarianceZ = variance(posZs);
  const spatialCoverage = Math.sqrt(spatialVarianceX + spatialVarianceZ);

  // Response patterns: time between SwitchEvents
  const switchTimes = events
    .filter(e => e.eventType === 'SwitchEvent')
    .map(e => e.timestamp);
  const switchIntervals = [];
  for (let i = 1; i < switchTimes.length; i++) {
    switchIntervals.push(switchTimes[i] - switchTimes[i - 1]);
  }

  // Response patterns: time between ability uses
  const abilityTimes = events
    .filter(e => e.eventType === 'AbilityEvent')
    .map(e => e.timestamp);
  const abilityIntervals = [];
  for (let i = 1; i < abilityTimes.length; i++) {
    abilityIntervals.push(abilityTimes[i] - abilityTimes[i - 1]);
  }

  return {
    label,
    totalEvents: events.length,
    duration: duration.toFixed(1),
    eventsPerSecond: duration > 0 ? (events.length / duration).toFixed(2) : '0',
    windowCounts,
    windowKeys,
    decisionRateMean: mean(windowCounts).toFixed(2),
    decisionRateStd: stdev(windowCounts).toFixed(2),
    entropy: entropy.toFixed(3),
    typeCounts,
    spatialCoverage: spatialCoverage.toFixed(1),
    spatialVarianceX: spatialVarianceX.toFixed(1),
    spatialVarianceZ: spatialVarianceZ.toFixed(1),
    positionCount: posXs.length,
    switchCount: switchTimes.length,
    switchIntervalMean: mean(switchIntervals).toFixed(2),
    switchIntervalStd: stdev(switchIntervals).toFixed(2),
    abilityCount: abilityTimes.length,
    abilityIntervalMean: mean(abilityIntervals).toFixed(2),
    abilityIntervalStd: stdev(abilityIntervals).toFixed(2),
    positions: posXs.map((x, i) => ({ x, z: posZs[i] })),
  };
}

// ---------------------------------------------------------------------------
// Text report
// ---------------------------------------------------------------------------

function printComparison(mA, mB) {
  const line = (label, a, b) => {
    const diff = Number(a) - Number(b);
    const sign = diff > 0 ? '+' : '';
    console.log(`  ${label.padEnd(30)} ${String(a).padStart(10)}  ${String(b).padStart(10)}  (${sign}${diff.toFixed(2)})`);
  };

  console.log(`\n${'='.repeat(72)}`);
  console.log(`BEHAVIORAL DIFF: ${mA.label} vs ${mB.label}`);
  console.log(`${'='.repeat(72)}`);
  console.log(`  ${'Metric'.padEnd(30)} ${mA.label.padStart(10)}  ${mB.label.padStart(10)}  Delta`);
  console.log(`  ${'-'.repeat(66)}`);
  line('Total Events', mA.totalEvents, mB.totalEvents);
  line('Duration (s)', mA.duration, mB.duration);
  line('Events/sec', mA.eventsPerSecond, mB.eventsPerSecond);
  line('Decision Rate (mean/10s)', mA.decisionRateMean, mB.decisionRateMean);
  line('Decision Rate (std)', mA.decisionRateStd, mB.decisionRateStd);
  line('Action Diversity (entropy)', mA.entropy, mB.entropy);
  line('Spatial Coverage', mA.spatialCoverage, mB.spatialCoverage);
  line('Switch Count', mA.switchCount, mB.switchCount);
  line('Switch Interval Mean (s)', mA.switchIntervalMean, mB.switchIntervalMean);
  line('Switch Interval Std', mA.switchIntervalStd, mB.switchIntervalStd);
  line('Ability Count', mA.abilityCount, mB.abilityCount);
  line('Ability Interval Mean (s)', mA.abilityIntervalMean, mB.abilityIntervalMean);
  line('Ability Interval Std', mA.abilityIntervalStd, mB.abilityIntervalStd);

  console.log(`\nEvent Type Distribution:`);
  const allTypes = new Set([...Object.keys(mA.typeCounts), ...Object.keys(mB.typeCounts)]);
  for (const t of [...allTypes].sort()) {
    const a = mA.typeCounts[t] || 0;
    const b = mB.typeCounts[t] || 0;
    console.log(`  ${t.padEnd(25)} ${String(a).padStart(6)}  ${String(b).padStart(6)}`);
  }
  console.log('');
}

// ---------------------------------------------------------------------------
// HTML report
// ---------------------------------------------------------------------------

function generateHTML(mA, mB, sessionFileA, sessionFileB) {
  const allTypes = [...new Set([...Object.keys(mA.typeCounts), ...Object.keys(mB.typeCounts)])].sort();

  // Decision rate chart data
  const allBuckets = [...new Set([...mA.windowKeys, ...mB.windowKeys])].sort((a, b) => a - b);
  const maxRate = Math.max(...mA.windowCounts, ...mB.windowCounts, 1);

  // Build SVG bar chart for decision rate
  const chartW = 700, chartH = 250, pad = 50;
  const barW = Math.max(2, Math.min(12, (chartW - pad * 2) / (allBuckets.length * 2 + 1)));
  const scaleY = (chartH - pad * 2) / maxRate;

  let decisionBars = '';
  const aMap = {};
  mA.windowKeys.forEach((k, i) => { aMap[k] = mA.windowCounts[i]; });
  const bMap = {};
  mB.windowKeys.forEach((k, i) => { bMap[k] = mB.windowCounts[i]; });

  allBuckets.forEach((bucket, i) => {
    const x = pad + i * (barW * 2 + 2);
    const vA = aMap[bucket] || 0;
    const vB = bMap[bucket] || 0;
    const hA = vA * scaleY;
    const hB = vB * scaleY;
    decisionBars += `<rect x="${x}" y="${chartH - pad - hA}" width="${barW}" height="${hA}" fill="#00e5ff" opacity="0.8"/>`;
    decisionBars += `<rect x="${x + barW}" y="${chartH - pad - hB}" width="${barW}" height="${hB}" fill="#FFD700" opacity="0.8"/>`;
  });

  // Pie chart for each
  function pieChart(counts, cx, cy, r) {
    const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    const total = entries.reduce((s, e) => s + e[1], 0);
    if (total === 0) return '';
    const colors = ['#00e5ff', '#FFD700', '#ff6384', '#36a2eb', '#cc65fe', '#ff9f40', '#4bc0c0', '#9966ff', '#ff6633', '#33cc33'];
    let svg = '';
    let angle = 0;
    entries.forEach(([type, count], i) => {
      const slice = (count / total) * Math.PI * 2;
      const x1 = cx + r * Math.cos(angle);
      const y1 = cy + r * Math.sin(angle);
      const x2 = cx + r * Math.cos(angle + slice);
      const y2 = cy + r * Math.sin(angle + slice);
      const large = slice > Math.PI ? 1 : 0;
      svg += `<path d="M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${large} 1 ${x2},${y2} Z" fill="${colors[i % colors.length]}" opacity="0.85"/>`;
      // Label
      const mid = angle + slice / 2;
      const lx = cx + (r + 15) * Math.cos(mid);
      const ly = cy + (r + 15) * Math.sin(mid);
      if (count / total > 0.05) {
        svg += `<text x="${lx}" y="${ly}" fill="#ccc" font-size="9" text-anchor="middle">${type.replace('Event', '')} ${(count / total * 100).toFixed(0)}%</text>`;
      }
      angle += slice;
    });
    return svg;
  }

  // Scatter plot for positions
  function scatterPlot(posA, posB, width, height) {
    const all = [...posA, ...posB];
    if (all.length === 0) return '<text x="50%" y="50%" fill="#888" text-anchor="middle">No position data</text>';
    const minX = Math.min(...all.map(p => p.x));
    const maxX = Math.max(...all.map(p => p.x));
    const minZ = Math.min(...all.map(p => p.z));
    const maxZ = Math.max(...all.map(p => p.z));
    const rangeX = maxX - minX || 1;
    const rangeZ = maxZ - minZ || 1;
    const p = 30;
    const sx = (v) => p + ((v - minX) / rangeX) * (width - 2 * p);
    const sz = (v) => p + ((v - minZ) / rangeZ) * (height - 2 * p);
    let svg = '';
    posA.forEach(pt => {
      svg += `<circle cx="${sx(pt.x)}" cy="${sz(pt.z)}" r="2.5" fill="#00e5ff" opacity="0.5"/>`;
    });
    posB.forEach(pt => {
      svg += `<circle cx="${sx(pt.x)}" cy="${sz(pt.z)}" r="2.5" fill="#FFD700" opacity="0.5"/>`;
    });
    return svg;
  }

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Replay Diff Report</title>
<style>
  body { background: #0d1117; color: #c9d1d9; font-family: 'Segoe UI', sans-serif; margin: 20px; }
  h1 { color: #00e5ff; }
  h2 { color: #FFD700; margin-top: 30px; }
  .card { background: #161b22; border-radius: 8px; padding: 16px; margin: 12px 0; border: 1px solid #30363d; }
  table { border-collapse: collapse; width: 100%; }
  th, td { padding: 6px 12px; text-align: right; border-bottom: 1px solid #30363d; }
  th { color: #00e5ff; text-align: left; }
  td:first-child, th:first-child { text-align: left; }
  .legend { display: flex; gap: 20px; margin: 10px 0; }
  .legend span { display: flex; align-items: center; gap: 6px; }
  .dot-cyan { width: 12px; height: 12px; border-radius: 50%; background: #00e5ff; display: inline-block; }
  .dot-gold { width: 12px; height: 12px; border-radius: 50%; background: #FFD700; display: inline-block; }
  svg { display: block; margin: 10px auto; }
  .meta { color: #8b949e; font-size: 13px; }
</style>
</head>
<body>
<h1>Replay Behavioral Diff</h1>
<p class="meta">Generated: ${new Date().toISOString().slice(0, 19)}</p>
<p class="meta">Source A: ${path.basename(sessionFileA)} | Source B: ${path.basename(sessionFileB || sessionFileA)}</p>

<div class="legend">
  <span><span class="dot-cyan"></span> ${mA.label}</span>
  <span><span class="dot-gold"></span> ${mB.label}</span>
</div>

<h2>Summary Metrics</h2>
<div class="card">
<table>
  <tr><th>Metric</th><th>${mA.label}</th><th>${mB.label}</th><th>Delta</th></tr>
  <tr><td>Total Events</td><td>${mA.totalEvents}</td><td>${mB.totalEvents}</td><td>${mA.totalEvents - mB.totalEvents}</td></tr>
  <tr><td>Duration (s)</td><td>${mA.duration}</td><td>${mB.duration}</td><td>${(mA.duration - mB.duration).toFixed(1)}</td></tr>
  <tr><td>Events/sec</td><td>${mA.eventsPerSecond}</td><td>${mB.eventsPerSecond}</td><td>${(mA.eventsPerSecond - mB.eventsPerSecond).toFixed(2)}</td></tr>
  <tr><td>Decision Rate (mean/10s)</td><td>${mA.decisionRateMean}</td><td>${mB.decisionRateMean}</td><td>${(mA.decisionRateMean - mB.decisionRateMean).toFixed(2)}</td></tr>
  <tr><td>Decision Rate (std)</td><td>${mA.decisionRateStd}</td><td>${mB.decisionRateStd}</td><td>${(mA.decisionRateStd - mB.decisionRateStd).toFixed(2)}</td></tr>
  <tr><td>Action Diversity (entropy)</td><td>${mA.entropy}</td><td>${mB.entropy}</td><td>${(mA.entropy - mB.entropy).toFixed(3)}</td></tr>
  <tr><td>Spatial Coverage</td><td>${mA.spatialCoverage}</td><td>${mB.spatialCoverage}</td><td>${(mA.spatialCoverage - mB.spatialCoverage).toFixed(1)}</td></tr>
  <tr><td>Switch Count</td><td>${mA.switchCount}</td><td>${mB.switchCount}</td><td>${mA.switchCount - mB.switchCount}</td></tr>
  <tr><td>Switch Interval (mean s)</td><td>${mA.switchIntervalMean}</td><td>${mB.switchIntervalMean}</td><td>${(mA.switchIntervalMean - mB.switchIntervalMean).toFixed(2)}</td></tr>
  <tr><td>Ability Count</td><td>${mA.abilityCount}</td><td>${mB.abilityCount}</td><td>${mA.abilityCount - mB.abilityCount}</td></tr>
  <tr><td>Ability Interval (mean s)</td><td>${mA.abilityIntervalMean}</td><td>${mB.abilityIntervalMean}</td><td>${(mA.abilityIntervalMean - mB.abilityIntervalMean).toFixed(2)}</td></tr>
</table>
</div>

<h2>Decision Rate Over Time (events per 10s window)</h2>
<div class="card">
<svg width="${chartW}" height="${chartH}" viewBox="0 0 ${chartW} ${chartH}">
  <line x1="${pad}" y1="${chartH - pad}" x2="${chartW - pad}" y2="${chartH - pad}" stroke="#30363d"/>
  <line x1="${pad}" y1="${pad}" x2="${pad}" y2="${chartH - pad}" stroke="#30363d"/>
  <text x="${chartW / 2}" y="${chartH - 5}" fill="#8b949e" text-anchor="middle" font-size="11">Time (s)</text>
  <text x="10" y="${chartH / 2}" fill="#8b949e" text-anchor="middle" font-size="11" transform="rotate(-90,10,${chartH / 2})">Events</text>
  ${decisionBars}
</svg>
</div>

<h2>Action Diversity (Event Type Distribution)</h2>
<div class="card" style="display:flex; justify-content:space-around;">
<div style="text-align:center;">
  <p>${mA.label} (H=${mA.entropy})</p>
  <svg width="280" height="280" viewBox="0 0 280 280">
    ${pieChart(mA.typeCounts, 140, 140, 90)}
  </svg>
</div>
<div style="text-align:center;">
  <p>${mB.label} (H=${mB.entropy})</p>
  <svg width="280" height="280" viewBox="0 0 280 280">
    ${pieChart(mB.typeCounts, 140, 140, 90)}
  </svg>
</div>
</div>

<h2>Event Type Breakdown</h2>
<div class="card">
<table>
  <tr><th>Event Type</th><th>${mA.label}</th><th>${mB.label}</th></tr>
  ${allTypes.map(t => `<tr><td>${t}</td><td>${mA.typeCounts[t] || 0}</td><td>${mB.typeCounts[t] || 0}</td></tr>`).join('\n  ')}
</table>
</div>

<h2>Spatial Position Scatter</h2>
<div class="card">
<svg width="500" height="400" viewBox="0 0 500 400">
  <rect width="500" height="400" fill="#0d1117"/>
  ${scatterPlot(mA.positions, mB.positions, 500, 400)}
</svg>
<p class="meta">${mA.label}: ${mA.positionCount} points | ${mB.label}: ${mB.positionCount} points</p>
</div>

</body>
</html>`;

  return html;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  const args = process.argv.slice(2);
  if (args.length < 1) {
    console.error('Usage: node replay-diff.js <file1.json> [file2.json]');
    console.error('  One file:  compare human vs AI within that session');
    console.error('  Two files: compare human across both sessions');
    process.exit(1);
  }

  const file1 = path.resolve(args[0]);
  const file2 = args[1] ? path.resolve(args[1]) : null;

  const session1 = loadSession(file1);
  let mA, mB, labelA, labelB;

  if (!file2) {
    // Compare human vs AI within one session
    console.log(`Analyzing single session: ${path.basename(file1)}`);
    console.log(`Match duration: ${session1.matchDuration}s | Total events: ${session1.totalEvents}`);

    const humanEvents = session1.events.filter(e => {
      // If playerType is present, use it
      if (e.playerType) return e.playerType === 'human';
      // If no playerType, check triggerMethod
      const tm = e.data?.triggerMethod || e.data?.switchMethod || '';
      return !tm.includes('AIDecision') && !tm.includes('AI');
    });

    const aiEvents = session1.events.filter(e => {
      if (e.playerType) return e.playerType === 'ai';
      const tm = e.data?.triggerMethod || e.data?.switchMethod || '';
      return tm.includes('AIDecision') || tm.includes('AI');
    });

    if (aiEvents.length === 0) {
      console.log('\nNo AI events found in this session (pre-AI or no playerType tagging).');
      console.log('All events will be attributed to human. Use two-file mode for cross-session comparison.');
    }

    mA = computeMetrics(humanEvents, 'Human');
    mB = computeMetrics(aiEvents, 'AI');
  } else {
    // Compare human across two sessions
    const session2 = loadSession(file2);
    console.log(`Comparing sessions:`);
    console.log(`  A: ${path.basename(file1)} (${session1.totalEvents} events, ${session1.matchDuration}s)`);
    console.log(`  B: ${path.basename(file2)} (${session2.totalEvents} events, ${session2.matchDuration}s)`);

    const humanEvents1 = session1.events.filter(e => {
      if (e.playerType) return e.playerType === 'human';
      const tm = e.data?.triggerMethod || e.data?.switchMethod || '';
      return !tm.includes('AIDecision') && !tm.includes('AI');
    });

    const humanEvents2 = session2.events.filter(e => {
      if (e.playerType) return e.playerType === 'human';
      const tm = e.data?.triggerMethod || e.data?.switchMethod || '';
      return !tm.includes('AIDecision') && !tm.includes('AI');
    });

    mA = computeMetrics(humanEvents1, 'Session A');
    mB = computeMetrics(humanEvents2, 'Session B');
  }

  printComparison(mA, mB);

  const htmlReport = generateHTML(mA, mB, file1, file2);
  const reportPath = path.join(path.dirname(file1), 'replay-diff-report.html');
  fs.writeFileSync(reportPath, htmlReport, 'utf-8');
  console.log(`\nHTML report written to: ${reportPath}`);
}

main();
