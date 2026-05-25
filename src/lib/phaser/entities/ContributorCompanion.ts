/**
 * ContributorCompanion.ts
 *
 * Renders an accepted contributor as a companion sprite following the main player.
 * Features hover tooltips, click integration, smooth RPG follow physics, and spawn animations.
 */

import * as Phaser from "phaser";
import { eventBridge } from "../utils/event-bridge";

export interface ContributorData {
  requestId: string;
  userId: string;
  displayName: string;
  username: string;
  avatar: string;
  personaGender: "male" | "female";
  role: string;
  level: number;
  xp: number;
  isOnline: boolean;
}

export class ContributorCompanion extends Phaser.GameObjects.Container {
  contributorData: ContributorData;
  readonly gender: "male" | "female";
  
  private sprite: Phaser.GameObjects.Sprite;
  private shadowEllipse: Phaser.GameObjects.Ellipse;
  private tooltipContainer: Phaser.GameObjects.Container | null = null;
  
  private isWalking = false;
  private orbitRadius = 64;

  constructor(scene: Phaser.Scene, x: number, y: number, data: ContributorData) {
    super(scene, x, y);
    this.contributorData = data;
    this.gender = data.personaGender || "male";

    // ── 1. Shadow (Scaled down slightly compared to player) ──
    this.shadowEllipse = new Phaser.GameObjects.Ellipse(
      scene,
      0,
      0,
      36,
      10,
      0x000000,
      0.2
    );
    this.add(this.shadowEllipse);
    this.sendToBack(this.shadowEllipse);

    // ── 2. Pixel-Art Sprite (Scaled to 2.3 for ideal companion size) ──
    const spriteSheetKey =
      this.gender === "male"
        ? "persona_male_idle_sheet"
        : "persona_female_idle_sheet";

    this.sprite = new Phaser.GameObjects.Sprite(scene, 0, 0, spriteSheetKey, 0);
    this.sprite.setOrigin(0.5, 40 / 48);
    this.sprite.setScale(2.3);
    this.add(this.sprite);

    // ── 3. Make interactive for hover & click events ──
    // Create an interactive hitbox matching the sprite size (approx 64x96 px offset upwards)
    this.sprite.setInteractive(
      new Phaser.Geom.Rectangle(-16, -48, 32, 48),
      Phaser.Geom.Rectangle.Contains
    );

    // Setup input listeners
    this.sprite.on("pointerover", this.onHoverOver, this);
    this.sprite.on("pointerout", this.onHoverOut, this);
    this.sprite.on("pointerdown", this.onClick, this);

    // ── 4. Add to scene and trigger spawn animation ──
    scene.add.existing(this);
    
    this.setAlpha(0);
    this.setScale(0);
    scene.tweens.add({
      targets: this,
      alpha: 1,
      scale: 1,
      duration: 500,
      ease: "Back.easeOut",
    });

    this.playIdle();
  }

  /**
   * Smooth RPG follow update using linear interpolation (LERP).
   */
  updateCompanion(playerX: number, playerY: number, index: number, total: number): void {
    if (!this.scene) return;

    // Calculate ideal target coordinate in a neat circular cluster/orbit behind player
    const angle = (index * 2 * Math.PI) / Math.max(1, total) + Math.PI / 4;
    const targetX = playerX + Math.cos(angle) * this.orbitRadius;
    const targetY = playerY + Math.sin(angle) * this.orbitRadius;

    const dx = targetX - this.x;
    const dy = targetY - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // LERP movement factors: slow down closer to destination to look incredibly natural
    const lerpFactor = 0.06;

    if (distance > 6) {
      this.x += dx * lerpFactor;
      this.y += dy * lerpFactor;

      // Play walk animation
      if (!this.isWalking) {
        this.isWalking = true;
        const walkAnimKey =
          this.gender === "male" ? "persona_male_walk" : "persona_female_walk";
        if (this.scene.anims.exists(walkAnimKey)) {
          this.sprite.play(walkAnimKey, true);
        }
      }

      // Flip sprite to face movement direction
      if (Math.abs(dx) > 0.5) {
        this.sprite.setFlipX(dx > 0);
      }
    } else {
      // Reached destination - play static idle
      this.playIdle();
    }
  }

  private playIdle(): void {
    if (!this.isWalking) return;
    this.isWalking = false;

    if (this.sprite && this.sprite.anims) {
      this.sprite.anims.stop();
      const spriteSheetKey =
        this.gender === "male"
          ? "persona_male_idle_sheet"
          : "persona_female_idle_sheet";
      this.sprite.setTexture(spriteSheetKey, 0);
    }
  }

  private onHoverOver(pointer: Phaser.Input.Pointer): void {
    if (!this.scene) return;

    // Scale up slightly for tactile tactile feedback
    this.scene.tweens.add({
      targets: this.sprite,
      scaleX: this.sprite.flipX ? -2.5 : 2.5,
      scaleY: 2.5,
      duration: 150,
      ease: "Quad.easeOut",
    });

    // Create premium gaming-style hover tooltip if it doesn't exist
    if (!this.tooltipContainer) {
      this.createTooltip();
    }
    
    if (this.tooltipContainer) {
      this.tooltipContainer.setVisible(true);
      this.tooltipContainer.setAlpha(0);
      this.scene.tweens.add({
        targets: this.tooltipContainer,
        alpha: 1,
        y: -130,
        duration: 200,
        ease: "Back.easeOut",
      });
    }
  }

  private onHoverOut(): void {
    if (!this.scene) return;

    // Scale back to normal
    this.scene.tweens.add({
      targets: this.sprite,
      scaleX: this.sprite.flipX ? -2.3 : 2.3,
      scaleY: 2.3,
      duration: 150,
      ease: "Quad.easeIn",
    });

    // Fade and hide tooltip
    if (this.tooltipContainer) {
      this.scene.tweens.add({
        targets: this.tooltipContainer,
        alpha: 0,
        y: -120,
        duration: 150,
        ease: "Quad.easeIn",
        onComplete: () => {
          if (this.tooltipContainer) {
            this.tooltipContainer.setVisible(false);
          }
        },
      });
    }
  }

  private onClick(): void {
    console.log("[Phaser] Clicked companion sprite:", this.contributorData.displayName);
    eventBridge.dispatchToReact({
      type: "CONTRIBUTOR_SPRITE_CLICKED",
      contributor: this.contributorData,
    });
  }

  /**
   * Build a premium achievement-style tooltip popup floating above head.
   */
  private createTooltip(): void {
    if (!this.scene) return;

    const roleColors: Record<string, number> = {
      owner: 0xf59e0b, // Gold
      admin: 0xa78bfa, // Purple
      moderator: 0x38bdf8, // Sky Blue
      contributor: 0x2dd4bf, // Teal
    };
    
    const roleTextColors: Record<string, string> = {
      owner: "#F59E0B",
      admin: "#A78BFA",
      moderator: "#38BDF8",
      contributor: "#2DD4BF",
    };

    const roleColor = roleColors[this.contributorData.role.toLowerCase()] || 0x2dd4bf;
    const roleTextColor = roleTextColors[this.contributorData.role.toLowerCase()] || "#2DD4BF";
    const statusColor = this.contributorData.isOnline ? 0x10b981 : 0x64748b; // Green vs slate

    this.tooltipContainer = this.scene.add.container(0, -120);

    const width = 170;
    const height = 75;

    // 1. Tooltip shadow
    const shadow = this.scene.add.graphics();
    shadow.fillStyle(0x000000, 0.4);
    shadow.fillRoundedRect(-width / 2 + 3, 3, width, height, 10);
    this.tooltipContainer.add(shadow);

    // 2. Tooltip main card body (Futuristic dark glassmorphism)
    const card = this.scene.add.graphics();
    card.fillStyle(0x0c0f1d, 0.95);
    card.lineStyle(1.5, roleColor, 0.8);
    card.fillRoundedRect(-width / 2, 0, width, height, 10);
    card.strokeRoundedRect(-width / 2, 0, width, height, 10);
    this.tooltipContainer.add(card);

    // 3. Status indicator dot (Online/Offline)
    const dot = this.scene.add.graphics();
    dot.fillStyle(statusColor, 1);
    dot.fillCircle(-width / 2 + 15, 20, 4);
    this.tooltipContainer.add(dot);

    // 4. Display Name text (with slight truncation support)
    const truncatedName = this.contributorData.displayName.length > 13
      ? this.contributorData.displayName.substring(0, 11) + "..."
      : this.contributorData.displayName;

    const nameText = this.scene.add.text(-width / 2 + 25, 11, truncatedName, {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      fontSize: "12px",
      fontStyle: "bold",
      color: "#ffffff",
    });
    this.tooltipContainer.add(nameText);

    // 5. Username handle
    const truncatedUser = this.contributorData.username.length > 16
      ? "@" + this.contributorData.username.substring(0, 14) + "..."
      : "@" + this.contributorData.username;
    const userText = this.scene.add.text(-width / 2 + 15, 30, truncatedUser, {
      fontFamily: 'monospace, Courier New',
      fontSize: "9px",
      color: "#94a3b8",
    });
    this.tooltipContainer.add(userText);

    // 6. Role Label Badge
    const roleText = this.scene.add.text(-width / 2 + 15, 48, this.contributorData.role.toUpperCase(), {
      fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
      fontSize: "9px",
      fontStyle: "bold",
      color: roleTextColor,
    });
    this.tooltipContainer.add(roleText);

    // 7. Level Badge (e.g. LV 12)
    const levelText = this.scene.add.text(width / 2 - 45, 48, `LV ${this.contributorData.level}`, {
      fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
      fontSize: "9px",
      fontStyle: "bold",
      color: "#e2e8f0",
    });
    this.tooltipContainer.add(levelText);

    // 8. Add subtle triangle arrow under tooltip
    const arrow = this.scene.add.graphics();
    arrow.fillStyle(0x0c0f1d, 0.95);
    arrow.lineStyle(1.5, roleColor, 0.8);
    arrow.beginPath();
    arrow.moveTo(-8, height);
    arrow.lineTo(8, height);
    arrow.lineTo(0, height + 8);
    arrow.closePath();
    arrow.fillPath();
    
    // Draw only side borders of triangle
    arrow.beginPath();
    arrow.moveTo(-8, height);
    arrow.lineTo(0, height + 8);
    arrow.lineTo(8, height);
    arrow.strokePath();
    
    this.tooltipContainer.add(arrow);

    // Initially invisible
    this.tooltipContainer.setVisible(false);
    this.add(this.tooltipContainer);
  }
}
