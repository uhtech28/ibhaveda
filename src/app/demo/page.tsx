"use client";

/**
 * /demo — visual preview of new Undertale-style map components.
 * No auth required. Shows BattleScreen and PersonaSelect with mock data.
 */

import { useState } from "react";
import { BattleScreen } from "@/components/map/BattleScreen";
import { PersonaSelect } from "@/components/map/PersonaSelect";
import { getStageMonster, BOSS_POOL, type BossPoolEntry } from "@/lib/venture/bossDefs";
import type { PersonaDef } from "@/lib/venture/personaDefs";

// Adapt a BossPoolEntry into the shape BattleScreen expects
function poolEntryToBoss(entry: BossPoolEntry, stage: number) {
  return {
    id: entry.id,
    stage,
    name: entry.name,
    title: entry.type,
    hp: 300,
    isSuperboss: false,
    sprite: `boss_${entry.id}`,
    defeatCondition: entry.defeatCondition,
    abilities: [
      { name: "World Corruption", description: entry.worldCorruption, damagePattern: "drain" as const },
    ],
    dialogue: {
      encounter: entry.worldCorruption.split("—")[1]?.trim() ?? entry.worldCorruption,
      low_hp: "You're making progress. I can feel my grip slipping...",
      defeated: entry.slayOutcome,
      mercy: entry.retreatOutcome,
    },
  };
}

export default function DemoPage() {
  const [view, setView] = useState<"menu" | "battle" | "superboss" | "persona">("menu");
  const [selectedPersona, setSelectedPersona] = useState<PersonaDef | null>(null);

  // Stage 1 monster maps to The Fog of Vagueness
  const stageMonster = getStageMonster("venture", "Ideation");
  const stageBoss = poolEntryToBoss(BOSS_POOL[0], 1); // The Unraveller as stage boss demo
  const superboss = { ...poolEntryToBoss(BOSS_POOL[1], 8), hp: 620, isSuperboss: true }; // The Pale Architect as superboss demo

  return (
    <div style={{ minHeight: "100vh", background: "#050810", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, padding: 24 }}>

      {/* Demo menu */}
      {view === "menu" && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
          <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 12, color: "#818cf8", letterSpacing: "0.1em", textAlign: "center", lineHeight: 2 }}>
            IBHAVEDA — COMPONENT DEMO<br />
            <span style={{ fontSize: 8, color: "#475569" }}>refactor/map-undertale</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10, width: 300 }}>
            <DemoButton label="⚔  Stage Boss Battle (Stage 1)" onClick={() => setView("battle")} color="#6366f1" />
            <DemoButton label="★  Superboss Battle (Stage 8)" onClick={() => setView("superboss")} color="#ef4444" />
            <DemoButton label="👤 Persona Selection (12 Personas)" onClick={() => setView("persona")} color="#a855f7" />
          </div>

          {selectedPersona && (
            <div style={{
              fontFamily: "'Press Start 2P', monospace",
              fontSize: 8,
              color: "#94a3b8",
              textAlign: "center",
              border: `2px solid ${selectedPersona.colorPrimary}`,
              padding: "10px 16px",
              background: "#0a0a18",
              lineHeight: 2,
            }}>
              ACTIVE PERSONA<br />
              <span style={{ color: selectedPersona.colorPrimary }}>{selectedPersona.name}</span><br />
              <span style={{ fontSize: 7, color: "#64748b" }}>{selectedPersona.passiveAbility.name}</span>
            </div>
          )}
        </div>
      )}

      {/* Stage 1 boss */}
      {view === "battle" && (
        <BattleScreen
          boss={stageBoss}
          isOpen={true}
          playerName="FOUNDER"
          onOutcome={(outcome, action) => {
            console.log("Outcome:", outcome, action);
            setView("menu");
          }}
          onClose={() => setView("menu")}
        />
      )}

      {/* Stage 8 superboss */}
      {view === "superboss" && (
        <BattleScreen
          boss={superboss}
          isOpen={true}
          playerName="FOUNDER"
          onOutcome={(outcome, action) => {
            console.log("Outcome:", outcome, action);
            setView("menu");
          }}
          onClose={() => setView("menu")}
        />
      )}

      {/* Persona select */}
      {view === "persona" && (
        <PersonaSelect
          isOpen={true}
          currentPersonaId={selectedPersona?.id}
          onSelect={(p) => {
            setSelectedPersona(p);
            setView("menu");
          }}
          onClose={() => setView("menu")}
        />
      )}
    </div>
  );
}

function DemoButton({ label, onClick, color }: { label: string; onClick: () => void; color: string }) {
  return (
    <button
      onClick={onClick}
      style={{
        fontFamily: "'Press Start 2P', monospace",
        fontSize: 9,
        color: "#fff",
        background: "#0a0a18",
        border: `2px solid ${color}`,
        padding: "12px 16px",
        cursor: "pointer",
        letterSpacing: "0.04em",
        textAlign: "left",
        transition: "background 0.1s",
        boxShadow: `0 0 12px ${color}30`,
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = `${color}18`)}
      onMouseLeave={(e) => (e.currentTarget.style.background = "#0a0a18")}
    >
      {label}
    </button>
  );
}
