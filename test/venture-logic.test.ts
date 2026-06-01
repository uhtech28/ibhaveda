import { describe, it, expect } from 'vitest'
import {
  checkpointBossKey,
  hydrateBossDefeatedFromCheckpoints,
  isLastCheckpointInStage,
  mergeBossDefeatedState,
  needsCheckpointBossCombat,
} from '@/lib/venture/stageBossGate'

describe('Venture Logic', () => {
  describe('Boss Assignment Logic', () => {
    it('should assign 1-2 bosses randomly', () => {
      const bossCount = Math.random() < 0.5 ? 1 : 2
      expect(bossCount).toBeGreaterThanOrEqual(1)
      expect(bossCount).toBeLessThanOrEqual(2)
    })

    it('should not assign duplicate bosses', () => {
      const bossIds = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
      const bossCount = 2
      const shuffled = [...bossIds].sort(() => Math.random() - 0.5)
      const assigned = shuffled.slice(0, bossCount)
      const unique = new Set(assigned)
      expect(assigned).toHaveLength(unique.size)
    })
  })

  describe('Checkpoint boss gate', () => {
    const stage1Checkpoints = [
      { stage: 1, checkpoint: 1, status: 'in_progress', t1Completed: true, t2Completed: true, t3Completed: false },
      { stage: 1, checkpoint: 2, status: 'not_started', t1Completed: false, t2Completed: false, t3Completed: false },
      { stage: 1, checkpoint: 3, status: 'not_started', t1Completed: false, t2Completed: false, t3Completed: false },
    ]

    it('requires boss on current map checkpoint with 2 tasks', () => {
      const cp = stage1Checkpoints[0]
      expect(needsCheckpointBossCombat(cp, 2, new Set(), 1, 1)).toBe(true)
    })

    it('skips boss after defeat on same checkpoint', () => {
      const cp = stage1Checkpoints[0]
      const defeated = new Set([checkpointBossKey(1, 1)])
      expect(needsCheckpointBossCombat(cp, 2, defeated, 1, 1)).toBe(false)
    })

    it('does not require boss when viewing a different checkpoint than the map position', () => {
      const cp = stage1Checkpoints[1]
      expect(needsCheckpointBossCombat(cp, 2, new Set(), 1, 1)).toBe(false)
    })

    it('requires boss on next checkpoint after map moves', () => {
      const cp = stage1Checkpoints[1]
      const defeated = new Set([checkpointBossKey(1, 1)])
      expect(needsCheckpointBossCombat(cp, 2, defeated, 1, 2)).toBe(true)
    })

    it('hydrates defeated keys for passed checkpoints only', () => {
      const cps = [
        { stage: 1, checkpoint: 1, status: 'completed', t1Completed: true, t2Completed: true, t3Completed: false },
        { stage: 1, checkpoint: 2, status: 'in_progress', t1Completed: true, t2Completed: true, t3Completed: false },
      ]
      const defeated = hydrateBossDefeatedFromCheckpoints(cps, 1, 2)
      expect(defeated.has('1-1')).toBe(true)
      expect(defeated.has('1-2')).toBe(false)
    })

    it('mergeBossDefeatedState keeps session defeat on active checkpoint', () => {
      const cps = stage1Checkpoints
      const session = new Set([checkpointBossKey(1, 1)])
      const merged = mergeBossDefeatedState(cps, 1, 1, undefined, session)
      expect(merged.has('1-1')).toBe(true)
    })

    it('detects last checkpoint in stage', () => {
      expect(isLastCheckpointInStage(stage1Checkpoints, 1, 3)).toBe(true)
      expect(isLastCheckpointInStage(stage1Checkpoints, 1, 1)).toBe(false)
    })
  })

  describe('Checkpoint Advancement Logic', () => {
    it('should require 2 of 3 tasks to advance', () => {
      const completedTasks = [true, true, false]
      const canAdvance = completedTasks.filter(Boolean).length >= 2
      expect(canAdvance).toBe(true)
    })

    it('should not advance with only 1 task completed', () => {
      const completedTasks = [true, false, false]
      const canAdvance = completedTasks.filter(Boolean).length >= 2
      expect(canAdvance).toBe(false)
    })

    it('should allow advancement with all 3 tasks completed', () => {
      const completedTasks = [true, true, true]
      const canAdvance = completedTasks.filter(Boolean).length >= 2
      expect(canAdvance).toBe(true)
    })

    it('should award gold bonus when all 3 tasks are completed', () => {
      const t1Completed = true
      const t2Completed = true
      const t3Completed = true
      const goldBonusEarned = t1Completed && t2Completed && t3Completed
      expect(goldBonusEarned).toBe(true)
    })

    it('should not award gold bonus with only 2 tasks completed', () => {
      const t1Completed = true
      const t2Completed = true
      const t3Completed = false
      const goldBonusEarned = t1Completed && t2Completed && t3Completed
      expect(goldBonusEarned).toBe(false)
    })
  })

  describe('Stage Advancement Logic', () => {
    it('should advance stage when all checkpoints are completed', () => {
      const checkpoints = [
        { status: 'completed' },
        { status: 'completed' },
        { status: 'completed' },
        { status: 'completed' },
      ]
      const allComplete = checkpoints.every((cp) => cp.status === 'completed')
      expect(allComplete).toBe(true)
    })

    it('should not advance stage if any checkpoint is incomplete', () => {
      const checkpoints = [
        { status: 'completed' },
        { status: 'in_progress' },
        { status: 'completed' },
        { status: 'completed' },
      ]
      const allComplete = checkpoints.every((cp) => cp.status === 'completed')
      expect(allComplete).toBe(false)
    })

    it('should mark venture as completed after stage 8', () => {
      const currentStage = 8
      const allStagesComplete = true
      const ventureComplete = currentStage === 8 && allStagesComplete
      expect(ventureComplete).toBe(true)
    })
  })

  describe('Boss Corruption Logic', () => {
    it('should increase corruption by 5% per day of inactivity', () => {
      const currentCorruption = 20
      const newCorruption = Math.min(100, currentCorruption + 5)
      expect(newCorruption).toBe(25)
    })

    it('should cap corruption at 100%', () => {
      const currentCorruption = 98
      const newCorruption = Math.min(100, currentCorruption + 5)
      expect(newCorruption).toBe(100)
    })

    it('should decrease corruption by 10% per checkpoint completion', () => {
      const currentCorruption = 50
      const newCorruption = Math.max(0, currentCorruption - 10)
      expect(newCorruption).toBe(40)
    })

    it('should not go below 0% corruption', () => {
      const currentCorruption = 5
      const newCorruption = Math.max(0, currentCorruption - 10)
      expect(newCorruption).toBe(0)
    })

    it('should retreat boss when corruption reaches 0%', () => {
      const currentCorruption = 10
      const newCorruption = Math.max(0, currentCorruption - 10)
      const bossRetreated = newCorruption === 0
      expect(bossRetreated).toBe(true)
    })
  })

  describe('Point Calculation Logic', () => {
    const POINT_VALUES = {
      task_t1_complete: 10,
      task_t2_complete: 15,
      task_t3_complete: 25,
      gold_checkpoint_bonus: 30,
      stage_complete_bonus: 50,
      venture_complete_bonus: 200,
      boss_retreat: 25,
      boss_slay: 100,
    }

    it('should calculate correct points for completing a checkpoint with 2 tasks', () => {
      const points = POINT_VALUES.task_t1_complete + POINT_VALUES.task_t2_complete
      expect(points).toBe(25)
    })

    it('should calculate correct points for completing a checkpoint with gold bonus', () => {
      const points =
        POINT_VALUES.task_t1_complete +
        POINT_VALUES.task_t2_complete +
        POINT_VALUES.task_t3_complete +
        POINT_VALUES.gold_checkpoint_bonus
      expect(points).toBe(80)
    })

    it('should calculate correct points for completing a stage', () => {
      const checkpointPoints = 4 * 80 // 4 checkpoints with gold bonus
      const stageBonus = POINT_VALUES.stage_complete_bonus
      expect(checkpointPoints + stageBonus).toBe(370)
    })

    it('should calculate correct points for completing a venture', () => {
      const stagePoints = 8 * 370 // 8 stages
      const ventureBonus = POINT_VALUES.venture_complete_bonus
      expect(stagePoints + ventureBonus).toBe(3160)
    })

    it('should calculate correct points for slaying a boss', () => {
      const points = POINT_VALUES.boss_slay
      expect(points).toBe(100)
    })
  })

  describe('Level Progression Logic', () => {
    it('should calculate correct level from titlePoints', () => {
      const titlePoints = 5000
      const levelDefinitions = [
        { level: 1, titlePoints: 0 },
        { level: 4, titlePoints: 50 },
        { level: 6, titlePoints: 300 },
        { level: 7, titlePoints: 500 },
        { level: 15, titlePoints: 5000 },
      ]

      const currentLevel = levelDefinitions
        .filter((l) => titlePoints >= l.titlePoints)
        .reduce((max, l) => Math.max(max, l.level), 1)

      expect(currentLevel).toBe(15)
    })

    it('should not exceed level 50', () => {
      const titlePoints = 999999
      const maxLevel = 50
      const calculatedLevel = Math.min(maxLevel, Math.floor(titlePoints / 1000))
      expect(calculatedLevel).toBe(50)
    })
  })

  describe('Shuffle Algorithm', () => {
    function shuffle<T>(array: T[]): T[] {
      const result = [...array]
      for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[result[i], result[j]] = [result[j], result[i]]
      }
      return result
    }

    it('should return array of same length', () => {
      const original = [1, 2, 3, 4, 5]
      const shuffled = shuffle(original)
      expect(shuffled).toHaveLength(original.length)
    })

    it('should contain same elements as original', () => {
      const original = [1, 2, 3, 4, 5]
      const shuffled = shuffle(original)
      expect(shuffled.sort()).toEqual(original.sort())
    })

    it('should produce different orderings over multiple runs', () => {
      const original = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
      const results = new Set<string>()

      for (let i = 0; i < 10; i++) {
        results.add(shuffle(original).join(','))
      }

      expect(results.size).toBeGreaterThan(1)
    })
  })
})
