import { Vector2 } from "raylib";
import { getUserScores, getProfile } from "rhythia-api";
import { PANEL } from "../atoms/BaseDrawer";
import { PanelDrawer, Hit, drawCard, drawTabs } from "../atoms/PanelDrawer";
import { drawSprite } from "../../../utils/sprite";
import { drawText, measureText } from "../../../utils/text";
import { drawRect } from "../../../ui/draw";
import { ProfileManager } from "../../../utils/profileManager";
import { logger } from "../../../utils/logger";
import type { Rect } from "../../settings/pages";

interface ProfileData {
  id?: number;
  created_at?: number | null;
  position?: number | null;
  about_me?: string | null;
  avatar_url?: string | null;
  profile_image?: string | null;
  flag?: string | null;
  uid?: string | null;
  ban?: string | null;
  username?: string | null;
  verified?: boolean | null;
  verificationDeadline?: number | null;
  play_count?: number | null;
  skill_points?: number | null;
  squares_hit?: number | null;
  total_score?: number | null;
  is_online?: boolean;
  badges?: any;
}

interface ScoreData {
  id: number;
  awarded_sp: number | null;
  beatmapHash: string | null;
  created_at: string;
  misses: number | null;
  passed: boolean | null;
  songId: string | null;
  userId: number | null;
  beatmapDifficulty?: number | null | undefined;
  beatmapNotes?: number | null | undefined;
  beatmapTitle?: string | null | undefined;
  speed?: number | null | undefined;
  spin?: boolean | null | undefined;
}

interface UserScoresData {
  lastDay?: ScoreData[];
  reign?: ScoreData[];
  top?: ScoreData[];
  stats?: {
    totalScore?: number;
    playCount?: number;
    skillPoints?: number;
  };
}

export class ProfileDrawer extends PanelDrawer {
  private profileData: ProfileData | null = null;
  private userScores: UserScoresData | null = null;
  private loadingScores: boolean = false;
  private loadingProfile: boolean = false;
  private selectedScoreTab: "top" | "reign" | "lastDay" = "top";

  constructor(profileData: ProfileData | null = null) {
    super();
    this.profileData = profileData;
  }

  private fitTextToWidth(
    text: string,
    fontSize: number,
    maxWidth: number
  ): string {
    if (maxWidth <= 0) return "";
    const full = measureText(text, fontSize, 1);
    if (full.width <= maxWidth) return text;

    const ellipsis = "...";
    const ellW = measureText(ellipsis, fontSize, 1).width;
    if (ellW > maxWidth) return ""; 

    let lo = 0;
    let hi = text.length;
    let best = 0;
    while (lo <= hi) {
      const mid = Math.floor((lo + hi) / 2);
      const sub = text.slice(0, mid);
      const w = measureText(sub, fontSize, 1).width + ellW;
      if (w <= maxWidth) {
        best = mid;
        lo = mid + 1;
      } else {
        hi = mid - 1;
      }
    }
    const fitted = text.slice(0, Math.max(0, best));
    return fitted + ellipsis;
  }

  protected getHeaderText(): string {
    return "Profile";
  }

  protected getSubtitleText(): string {
    return this.loadingProfile ? "Loading..." : this.profileData?.username || "";
  }

  protected drawBody(column: Rect, mouse: Vector2 | null, hits: Hit[]): number {
    let y = column.y;
    const profile = this.profileData;
    if (this.loadingProfile || !profile) {
      drawText(this.loadingProfile ? "Loading profile..." : "No profile data", Vector2(column.x, y), 24, PANEL.dim);
      return y + 30;
    }

    const card = { x: column.x, y, w: column.w, h: 150 };
    drawCard(card);
    const avatarUrl = profile.avatar_url || profile.profile_image;
    if (avatarUrl) {
      drawSprite(avatarUrl, Vector2(card.x + 20, y + 20), Vector2(110, 110), PANEL.text);
    } else {
      drawRect(card.x + 20, y + 20, 110, 110, { r: 50, g: 50, b: 54, a: 255 });
    }
    drawSprite("/avatar-mask.png", Vector2(card.x + 20, y + 20), Vector2(110, 110), PANEL.card);
    const name = this.fitTextToWidth(profile.username || "Unknown User", 36, card.w - 200);
    drawText(name, Vector2(card.x + 150, y + 32), 36, PANEL.text);
    drawSprite("/square.png", Vector2(card.x + 158 + measureText(name, 36).width, y + 36), Vector2(28, 28), PANEL.text);
    const details = [
      profile.position ? `#${profile.position.toLocaleString()}` : "",
      profile.flag || "",
      profile.is_online ? "Online" : "",
    ].filter(Boolean);
    drawText(details.join("  -  "), Vector2(card.x + 150, y + 80), 22, PANEL.dim);
    y += card.h + 10;

    const stats = [
      ["Skill Points", Math.round(profile.skill_points || 0)],
      ["Play Count", profile.play_count || 0],
      ["Total Score", profile.total_score || 0],
      ["Squares Hit", profile.squares_hit || 0],
    ] as const;
    const statW = (column.w - 30) / 4;
    stats.forEach(([label, value], index) => {
      const stat = { x: column.x + index * (statW + 10), y, w: statW, h: 74 };
      drawCard(stat);
      drawText(label, Vector2(stat.x + 14, y + 12), 17, PANEL.dim);
      drawText(this.fitTextToWidth(value.toLocaleString(), 24, statW - 28), Vector2(stat.x + 14, y + 38), 24, PANEL.text);
    });
    y += 84;

    const badges: string[] = profile.badges || [];
    if (badges.length > 0) {
      let x = column.x + 14;
      let row = 0;
      const chips = badges.map((badge) => {
        const config = this.getBadgeConfig(badge);
        const w = measureText(config.text, 18).width + 24;
        if (x + w > column.x + column.w - 14) {
          x = column.x + 14;
          row++;
        }
        const chip = { x, y: y + 14 + row * 42, w, config };
        x += w + 10;
        return chip;
      });
      const badgeCard = { x: column.x, y, w: column.w, h: 28 + (row + 1) * 42 - 10 };
      drawCard(badgeCard);
      chips.forEach((chip) => {
        drawRect(chip.x, chip.y, chip.w, 32, { r: 34, g: 34, b: 37, a: 255 });
        drawText(chip.config.text, Vector2(chip.x + 12, chip.y + 6), 18, { ...chip.config.color, a: 255 });
      });
      y += badgeCard.h + 10;
    }

    drawTabs(
      { x: column.x, y, w: column.w, h: 42 },
      [
        { id: "top", label: "Top" },
        { id: "reign", label: "Reign" },
        { id: "lastDay", label: "24h" },
      ],
      this.selectedScoreTab,
      mouse,
      hits,
      (id) => (this.selectedScoreTab = id as "top" | "reign" | "lastDay")
    );
    y += 54;

    const scores = this.userScores?.[this.selectedScoreTab] || [];
    if (this.loadingScores || scores.length === 0) {
      const message = this.loadingScores
        ? "Loading scores..."
        : this.userScores
          ? "No scores in this category"
          : "No scores available";
      drawText(message, Vector2(column.x + column.w / 2, y + 10), 20, PANEL.dim, "center");
      return y + 40;
    }

    scores.forEach((score, index) => {
      const row = { x: column.x, y, w: column.w, h: 78 };
      y += 88;
      if (!this.isVisible(row)) return;
      drawRect(row.x, row.y, row.w, row.h, PANEL.card);
      const rank = `#${index + 1}`;
      drawText(rank, Vector2(row.x + 12, row.y + 25), 26, PANEL.text);
      const dividerX = row.x + 24 + measureText(rank, 26).width;
      drawRect(dividerX, row.y + 10, 2, row.h - 20, PANEL.border);

      const textX = dividerX + 14;
      const right = row.x + row.w - 14;
      const sp = score.awarded_sp ? `+${score.awarded_sp} RP` : "";
      const title = this.fitTextToWidth(
        score.beatmapTitle || "Unknown Map",
        24,
        right - textX - (sp ? measureText(sp, 22).width + 16 : 0)
      );
      drawText(title, Vector2(textX, row.y + 10), 24, PANEL.text);
      if (sp) drawText(sp, Vector2(right, row.y + 12), 22, { r: 100, g: 200, b: 100, a: 255 }, "right");

      const misses = Math.max(0, score.misses ?? 0);
      const notes = score.beatmapNotes ?? null;
      const accuracy = notes ? ` - ${(((notes - misses) / notes) * 100).toFixed(1)}%` : "";
      const segments = [
        score.spin ? "Spin" : "",
        `${misses} misses${notes != null ? ` - ${Math.max(0, notes - misses)} hits` : ""}${accuracy}`,
      ].filter(Boolean);
      drawText(segments.join("  -  "), Vector2(textX, row.y + 44), 17, PANEL.dim);
      if (score.speed && score.speed !== 1) {
        drawText(`${(Math.ceil(score.speed * 100) / 100).toFixed(2)}x`, Vector2(right, row.y + 46), 17, PANEL.dim, "right");
      }
    });
    return y - 10;
  }

  private getBadgeConfig(badgeName: string): {
    color: { r: number; g: number; b: number };
    text: string;
  } {
    const badgeConfigs: Record<
      string,
      { color: { r: number; g: number; b: number }; text: string }
    > = {
      "Global Moderator": {
        color: { r: 255, g: 255, b: 255 },
        text: "Global Moderator",
      },
      Developer: { color: { r: 168, g: 85, b: 247 }, text: "Developer" }, 
      "Early Bird": { color: { r: 34, g: 197, b: 94 }, text: "Early Bird" }, 
      Tester: { color: { r: 37, g: 99, b: 235 }, text: "Tester" }, 
      Donator: { color: { r: 245, g: 158, b: 11 }, text: "Donator" }, 
      "Content Creator": {
        color: { r: 236, g: 72, b: 153 },
        text: "Content Creator",
      }, 
      "Community Manager": {
        color: { r: 16, g: 185, b: 129 },
        text: "Community Manager",
      }, 
      MMT: { color: { r: 168, g: 85, b: 247 }, text: "MMT" }, 
      $$$: { color: { r: 101, g: 163, b: 13 }, text: "$$$ Supporter" }, 
    };

    return (
      badgeConfigs[badgeName] || {
        color: { r: 255, g: 255, b: 255 },
        text: badgeName,
      }
    );
  }

  public async setProfileData(profileData: ProfileData | null): Promise<void> {
    this.profileData = profileData;
    this.resetScrollState();

    if (profileData?.id !== undefined) {
      await this.loadUserScores(profileData.id);
    }
  }

  public async loadProfileById(userId: number): Promise<void> {
    try {
      this.loadingProfile = true;
      this.resetScrollState();
      const token = ProfileManager.get().token;

      logger(`🌐 Making getProfile API request for user ID: ${userId}`);

      const response = await getProfile({ id: userId, session: token || "" });

      if (response.user) {
        this.profileData = response.user;
        logger(`✅ Profile loaded for user ID: ${userId}`, response.user);

        this.loadUserScores(userId); 
      } else {
        console.error("No user data in profile response");
        this.profileData = null;
      }
    } catch (error) {
      console.error("Failed to load profile:", error);
      this.profileData = null;
    } finally {
      this.loadingProfile = false;
    }
  }

  private async loadUserScores(userId: number): Promise<void> {
    try {
      this.loadingScores = true;
      const token = ProfileManager.get().token;

      const result = await getUserScores({
        session: token || "",
        id: userId,
        limit: 10, 
      });
      logger(result);
      if (!result.error) {
        this.userScores = {
          lastDay: result.lastDay,
          reign: result.reign as any,
          top: result.top,
        };
      } else {
        console.error("Failed to load user scores:", result.error);
      }
    } catch (error) {
      console.error("Error loading user scores:", error);
    } finally {
      this.loadingScores = false;
    }
  }

  public getProfileData(): ProfileData | null {
    return this.profileData;
  }

}

export function createProfileDrawer(
  profileData: ProfileData | null = null
): ProfileDrawer {
  return new ProfileDrawer(profileData);
}
