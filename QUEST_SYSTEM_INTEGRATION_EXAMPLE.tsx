/**
 * QUEST SYSTEM INTEGRATION EXAMPLE
 *
 * This file demonstrates how to integrate the quest system components
 * with the checkpoint data from CHECKPOINT_DEFINITIONS.
 *
 * Copy and adapt these patterns into your map/checkpoint pages.
 */

"use client";

import { useAtom } from "jotai";
import { useEffect } from "react";
import { currentQuestAtom, goldCountAtom, stageInfoAtom } from "@/lib/stores/hudStore";
import { CHECKPOINT_DEFINITIONS } from "@convex/ventureConstants";
import { VENTURE_BIOMES } from "@/lib/phaser/config/venture-biomes";

const getStageCheckpointCount = (stage: number) =>
  CHECKPOINT_DEFINITIONS.filter((definition) => definition.stage === stage).length || 4;

// ============================================================================
// EXAMPLE 1: Update Quest When Checkpoint is Selected
// ============================================================================

export function ExampleQuestIntegration() {
  const [currentQuest, setCurrentQuest] = useAtom(currentQuestAtom);
  const [gold, setGold] = useAtom(goldCountAtom);
  const [stageInfo, setStageInfo] = useAtom(stageInfoAtom);

  /**
   * Call this when user clicks a checkpoint marker on the map
   */
  const handleCheckpointClick = (stage: number, checkpoint: number, checkpointData: any) => {
    // Find checkpoint definition
    const cpDef = CHECKPOINT_DEFINITIONS.find(
      (d) => d.stage === stage && d.checkpoint === checkpoint
    );

    if (!cpDef) {
      console.warn(`No checkpoint definition found for stage ${stage}, checkpoint ${checkpoint}`);
      return;
    }

    // Update quest display
    setCurrentQuest({
      checkpointName: cpDef.name,
      stage: stage,
      checkpoint: checkpoint,
      tasks: [
        {
          label: "T1 Easy",
          description: cpDef.t1.prompt,
          tool: cpDef.t1.tool,
          done: checkpointData.t1Completed ?? false,
        },
        {
          label: "T2 Medium",
          description: cpDef.t2.prompt,
          tool: cpDef.t2.tool,
          done: checkpointData.t2Completed ?? false,
        },
        {
          label: "T3 Stretch",
          description: cpDef.t3.prompt,
          tool: cpDef.t3.tool,
          done: checkpointData.t3Completed ?? false,
        },
      ],
    });

    // Also update stage info to match
    const biome = VENTURE_BIOMES.find((b) => b.id === stage);
    if (biome) {
      setStageInfo({
        stageName: biome.name,
        stageIcon: biome.icon,
        biomeName: biome.biomeName,
        stage: stage,
        currentCheckpoint: checkpoint,
        totalCheckpointsInStage: getStageCheckpointCount(stage),
      });
    }
  };

  return null; // This is just an example, not a real component
}

// ============================================================================
// EXAMPLE 2: Update Gold from Checkpoint Progress
// ============================================================================

export function ExampleGoldSync() {
  const [gold, setGold] = useAtom(goldCountAtom);

  // Assuming you have checkpoint data from Convex
  useEffect(() => {
    // Example: Calculate gold from completed checkpoints
    const calculateGold = (checkpoints: any[]) => {
      const completed = checkpoints.filter((cp) =>
        cp.t1Completed && cp.t2Completed && cp.t3Completed
      );

      // 10 gold per completed checkpoint
      return completed.length * 10;
    };

    // Update gold when checkpoint data changes
    // setGold(calculateGold(checkpointsFromConvex));
  }, []);

  return null;
}

// ============================================================================
// EXAMPLE 3: Real-Time Quest Updates (When Tasks Complete)
// ============================================================================

export function ExampleQuestUpdates() {
  const [currentQuest, setCurrentQuest] = useAtom(currentQuestAtom);
  const [gold, setGold] = useAtom(goldCountAtom);

  /**
   * Call this when a task is completed
   */
  const handleTaskComplete = (taskLevel: "t1" | "t2" | "t3") => {
    if (!currentQuest) return;

    // Update the specific task
    const taskIndex = taskLevel === "t1" ? 0 : taskLevel === "t2" ? 1 : 2;
    const updatedTasks = [...currentQuest.tasks];
    updatedTasks[taskIndex] = {
      ...updatedTasks[taskIndex],
      done: true,
    };

    setCurrentQuest({
      ...currentQuest,
      tasks: updatedTasks,
    });

    // Award gold (example: 5 gold per task)
    setGold((prev) => prev + 5);

    // Check if all tasks complete
    const allComplete = updatedTasks.every((t) => t.done);
    if (allComplete) {
      // Bonus gold for completing all tasks
      setGold((prev) => prev + 10);
      console.log("🎉 Quest complete!");
    }
  };

  return null;
}

// ============================================================================
// EXAMPLE 4: Full Integration Pattern (Map Page)
// ============================================================================

export function ExampleMapPageIntegration() {
  const [currentQuest, setCurrentQuest] = useAtom(currentQuestAtom);
  const [gold, setGold] = useAtom(goldCountAtom);
  const [stageInfo, setStageInfo] = useAtom(stageInfoAtom);

  // Example: Initialize from Convex data
  useEffect(() => {
    // When venture data loads from Convex
    const initializeQuestSystem = (ventureData: any) => {
      const activeStage = ventureData.currentStage ?? 1;
      const activeCheckpoint = ventureData.currentCheckpoint ?? 1;

      // Get checkpoint from database
      const checkpoint = ventureData.checkpoints?.find(
        (cp: any) => cp.stage === activeStage && cp.checkpoint === activeCheckpoint
      );

      // Get definition
      const cpDef = CHECKPOINT_DEFINITIONS.find(
        (d) => d.stage === activeStage && d.checkpoint === activeCheckpoint
      );

      // Get biome
      const biome = VENTURE_BIOMES.find((b) => b.id === activeStage);

      // Set quest
      if (cpDef) {
        setCurrentQuest({
          checkpointName: cpDef.name,
          stage: activeStage,
          checkpoint: activeCheckpoint,
          tasks: [
            {
              label: "T1 Easy",
              description: cpDef.t1.prompt,
              tool: cpDef.t1.tool,
              done: checkpoint?.t1Completed ?? false,
            },
            {
              label: "T2 Medium",
              description: cpDef.t2.prompt,
              tool: cpDef.t2.tool,
              done: checkpoint?.t2Completed ?? false,
            },
            {
              label: "T3 Stretch",
              description: cpDef.t3.prompt,
              tool: cpDef.t3.tool,
              done: checkpoint?.t3Completed ?? false,
            },
          ],
        });
      }

      // Set stage info
      if (biome) {
        setStageInfo({
          stageName: biome.name,
          stageIcon: biome.icon,
          biomeName: biome.biomeName,
          stage: activeStage,
          currentCheckpoint: activeCheckpoint,
          totalCheckpointsInStage: getStageCheckpointCount(activeStage),
        });
      }

      // Calculate and set gold
      const completedCheckpoints = ventureData.checkpoints?.filter(
        (cp: any) => cp.t1Completed && cp.t2Completed && cp.t3Completed
      ) ?? [];
      setGold(completedCheckpoints.length * 10);
    };

    // Call with your venture data
    // initializeQuestSystem(ventureFromConvex);
  }, []);

  return null;
}

// ============================================================================
// EXAMPLE 5: Checkpoint Panel Integration
// ============================================================================

export function ExampleCheckpointPanel() {
  const [currentQuest, setCurrentQuest] = useAtom(currentQuestAtom);

  /**
   * When user opens a checkpoint panel, sync the quest display
   */
  const openCheckpointPanel = (stage: number, checkpoint: number) => {
    const cpDef = CHECKPOINT_DEFINITIONS.find(
      (d) => d.stage === stage && d.checkpoint === checkpoint
    );

    if (!cpDef) return;

    // Get checkpoint status from database
    // const checkpointData = await fetchCheckpointStatus(stage, checkpoint);

    setCurrentQuest({
      checkpointName: cpDef.name,
      stage,
      checkpoint,
      tasks: [
        {
          label: "T1 Easy",
          description: cpDef.t1.prompt,
          tool: cpDef.t1.tool,
          done: false, // Replace with checkpointData.t1Completed
        },
        {
          label: "T2 Medium",
          description: cpDef.t2.prompt,
          tool: cpDef.t2.tool,
          done: false, // Replace with checkpointData.t2Completed
        },
        {
          label: "T3 Stretch",
          description: cpDef.t3.prompt,
          tool: cpDef.t3.tool,
          done: false, // Replace with checkpointData.t3Completed
        },
      ],
    });
  };

  return null;
}

// ============================================================================
// EXAMPLE 6: Clear Quest (When Closing Checkpoint)
// ============================================================================

export function ExampleClearQuest() {
  const [currentQuest, setCurrentQuest] = useAtom(currentQuestAtom);

  /**
   * Call this when user closes checkpoint panel
   */
  const closeCheckpointPanel = () => {
    setCurrentQuest(null); // Quest panel will auto-hide
  };

  return null;
}

// ============================================================================
// EXAMPLE 7: Biome Transition with Centered Title
// ============================================================================

export function ExampleBiomeTransition() {
  const [stageInfo, setStageInfo] = useAtom(stageInfoAtom);

  /**
   * Show dramatic centered title when entering new biome
   */
  const enterNewBiome = (stage: number) => {
    const biome = VENTURE_BIOMES.find((b) => b.id === stage);
    if (!biome) return;

    setStageInfo({
      stageName: biome.name,
      stageIcon: biome.icon,
      biomeName: biome.biomeName,
      stage,
      currentCheckpoint: 1,
      totalCheckpointsInStage: getStageCheckpointCount(stage),
    });

    // Use StageInfo with centered prop:
    // <StageInfo {...stageInfo} centered={true} />
    // Display for 3 seconds, then hide
  };

  return null;
}

// ============================================================================
// EXAMPLE 8: Subscribe to Quest Completion
// ============================================================================

export function ExampleQuestCompletionHandler() {
  const [currentQuest] = useAtom(currentQuestAtom);

  useEffect(() => {
    if (!currentQuest) return;

    const allTasksComplete = currentQuest.tasks.every((t) => t.done);

    if (allTasksComplete) {
      console.log("🎉 All tasks complete!");

      // Trigger celebration animations
      // Show completion modal
      // Award badges
      // Unlock next checkpoint
    }
  }, [currentQuest]);

  return null;
}

// ============================================================================
// USAGE IN YOUR MAP PAGE
// ============================================================================

/**
 * Add to your src/app/map/page.tsx:
 *
 * 1. Import atoms:
 *    import { currentQuestAtom, goldCountAtom, stageInfoAtom } from "@/lib/stores/hudStore";
 *
 * 2. Add hooks:
 *    const [currentQuest, setCurrentQuest] = useAtom(currentQuestAtom);
 *    const [gold, setGold] = useAtom(goldCountAtom);
 *    const [stageInfo, setStageInfo] = useAtom(stageInfoAtom);
 *
 * 3. On checkpoint click:
 *    handleCheckpointClick(stage, checkpoint, checkpointData);
 *
 * 4. On venture load:
 *    initializeQuestSystem(ventureData);
 *
 * 5. On task completion:
 *    handleTaskComplete("t1"); // or "t2", "t3"
 *
 * 6. Components render automatically via HUD.tsx:
 *    - QuestList appears when currentQuestAtom is set
 *    - GoldCounter shows goldCountAtom value
 *    - StageInfo shows stageInfoAtom data
 */

// ============================================================================
// QUICK START
// ============================================================================

/**
 * Minimal integration (copy this into your map page):
 */

export function QuickStartExample() {
  const [currentQuest, setCurrentQuest] = useAtom(currentQuestAtom);
  const [gold, setGold] = useAtom(goldCountAtom);

  // When checkpoint selected
  const onCheckpointSelect = (stage: number, cp: number, data: any) => {
    const def = CHECKPOINT_DEFINITIONS.find(d => d.stage === stage && d.checkpoint === cp);
    if (!def) return;

    setCurrentQuest({
      checkpointName: def.name,
      stage,
      checkpoint: cp,
      tasks: [
        { label: "T1 Easy", description: def.t1.prompt, tool: def.t1.tool, done: data.t1Completed },
        { label: "T2 Medium", description: def.t2.prompt, tool: def.t2.tool, done: data.t2Completed },
        { label: "T3 Stretch", description: def.t3.prompt, tool: def.t3.tool, done: data.t3Completed },
      ],
    });
  };

  // When task completed
  const onTaskComplete = (taskLevel: "t1" | "t2" | "t3") => {
    setGold(prev => prev + 5); // Award 5 gold
    // Update task status in database
    // Refresh currentQuest from database
  };

  return null;
}
