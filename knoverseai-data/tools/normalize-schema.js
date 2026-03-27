#!/usr/bin/env node
/**
 * normalize-schema.js — Telemetry Schema Normalization for Pathogenika
 *
 * Usage: node normalize-schema.js <telemetry.json> [annotations.json]
 *
 * Reads a Pathogenika telemetry file and outputs a normalized version where:
 * - Every event has playerType ("human" or "ai")
 * - Every event has teamName (derived from session_annotations.json)
 * - NodeCaptureEvents get capturedByTeamName if missing
 * - SwitchEvents with method="AIDecision" get playerType="ai"
 * - Writes to a new file with _normalized suffix (never overwrites original)
 */

const fs = require('fs');
const path = require('path');

function main() {
  const args = process.argv.slice(2);
  if (args.length < 1) {
    console.error('Usage: node normalize-schema.js <telemetry.json> [annotations.json]');
    process.exit(1);
  }

  const telemetryPath = path.resolve(args[0]);
  const telemetryDir = path.dirname(telemetryPath);
  const telemetryFile = path.basename(telemetryPath);

  // Load annotations — try explicit arg, then same directory, then default location
  let annotationsPath = args[1]
    ? path.resolve(args[1])
    : path.join(telemetryDir, 'session_annotations.json');

  let annotations = null;
  if (fs.existsSync(annotationsPath)) {
    annotations = JSON.parse(fs.readFileSync(annotationsPath, 'utf-8'));
    console.log(`Loaded annotations from: ${annotationsPath}`);
  } else {
    console.warn('No session_annotations.json found. Will use heuristics only.');
  }

  // Get session metadata from annotations
  const sessionMeta = annotations?.sessions?.[telemetryFile] || null;
  const humanTeam = sessionMeta?.humanTeam ?? null;
  const aiTeam = sessionMeta?.aiTeam ?? null;
  const humanTeamName = sessionMeta?.humanTeamName ?? null;
  const aiTeamName = sessionMeta?.aiTeamName ?? null;
  const playerTypeStatus = sessionMeta?.playerTypeStatus ?? 'unknown';

  console.log(`\nFile: ${telemetryFile}`);
  console.log(`playerTypeStatus: ${playerTypeStatus}`);
  console.log(`Human team: ${humanTeam} (${humanTeamName})`);
  console.log(`AI team: ${aiTeam} (${aiTeamName})`);

  // Team name mapping
  const teamNameMap = {
    1: 'Pathogen',
    2: 'Immune',
  };

  // Load telemetry
  const session = JSON.parse(fs.readFileSync(telemetryPath, 'utf-8'));
  const events = session.events;

  let fixedPlayerType = 0;
  let fixedTeamName = 0;
  let fixedNodeCapture = 0;
  let fixedSwitchAI = 0;

  for (const event of events) {
    const data = event.data || {};

    // --- Determine playerType ---
    let detectedPlayerType = event.playerType || null;

    if (!detectedPlayerType) {
      // Heuristic: check triggerMethod / switchMethod for AI indicators
      const triggerMethod = data.triggerMethod || data.switchMethod || '';
      const eventType = event.eventType;

      if (triggerMethod.includes('AIDecision') || triggerMethod.includes('AI')) {
        detectedPlayerType = 'ai';
      } else if (eventType === 'AIDecisionEvent') {
        detectedPlayerType = 'ai';
      } else {
        // Default to human for untagged events in old sessions
        detectedPlayerType = 'human';
      }
      fixedPlayerType++;
    }

    // Fix: SwitchEvents with method="AIDecision" should be playerType="ai"
    if (event.eventType === 'SwitchEvent') {
      const method = data.switchMethod || '';
      if (method.includes('AIDecision') || method.includes('AI')) {
        if (event.playerType !== 'ai') {
          detectedPlayerType = 'ai';
          fixedSwitchAI++;
        }
      }
    }

    // Fix: AbilityEvents with triggerMethod="AIDecision" should be playerType="ai"
    if (event.eventType === 'AbilityEvent') {
      const method = data.triggerMethod || '';
      if (method.includes('AIDecision')) {
        if (event.playerType !== 'ai') {
          detectedPlayerType = 'ai';
        }
      }
    }

    event.playerType = detectedPlayerType;

    // --- Determine teamName ---
    if (!event.teamName) {
      if (detectedPlayerType === 'human' && humanTeamName) {
        event.teamName = humanTeamName;
      } else if (detectedPlayerType === 'ai' && aiTeamName) {
        event.teamName = aiTeamName;
      } else {
        // Infer from unit type
        const unitType = data.unitType || data.toUnitType || data.currentUnitType || '';
        const pathogenUnits = ['VirusType', 'BacteriaType', 'TuberculosisType', 'PneumoniaType', 'MRSAType'];
        const immuneUnits = ['NeutrophilType', 'NKCellType', 'TCellType', 'MacrophageType', 'DendriticType'];
        if (pathogenUnits.some(u => unitType.includes(u))) {
          event.teamName = 'Pathogen';
        } else if (immuneUnits.some(u => unitType.includes(u))) {
          event.teamName = 'Immune';
        } else {
          event.teamName = 'Unknown';
        }
      }
      fixedTeamName++;
    }

    // --- NodeCaptureEvent: add capturedByTeamName ---
    if (event.eventType === 'NodeCaptureEvent') {
      if (!data.capturedByTeamName && data.capturedByTeam != null) {
        data.capturedByTeamName = teamNameMap[data.capturedByTeam] || `Team ${data.capturedByTeam}`;
        fixedNodeCapture++;
      }
    }
  }

  // Write normalized output
  const ext = path.extname(telemetryFile);
  const base = path.basename(telemetryFile, ext);
  const outputFile = `${base}_normalized${ext}`;
  const outputPath = path.join(telemetryDir, outputFile);

  // Safety: never overwrite original
  if (outputPath === telemetryPath) {
    console.error('ERROR: Output path matches input path. Aborting.');
    process.exit(1);
  }

  fs.writeFileSync(outputPath, JSON.stringify(session, null, 2), 'utf-8');

  console.log(`\nNormalization complete:`);
  console.log(`  playerType filled:     ${fixedPlayerType}`);
  console.log(`  teamName added:        ${fixedTeamName}`);
  console.log(`  NodeCapture teamName:  ${fixedNodeCapture}`);
  console.log(`  SwitchEvent AI fix:    ${fixedSwitchAI}`);
  console.log(`  Total events:          ${events.length}`);
  console.log(`\nOutput: ${outputPath}`);
}

main();
