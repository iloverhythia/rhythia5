import { Vector2 } from "raylib";
import { getLeaderboard, getClans, getProfile } from "rhythia-api";
import { PANEL } from "../atoms/BaseDrawer";
import {
  PanelDrawer,
  Hit,
  hovered,
  drawField,
  drawToggle,
  drawTabs,
} from "../atoms/PanelDrawer";
import { ProfileManager } from "../../../utils/profileManager";
import { ConfigManager } from "../../../utils/configManager";
import { drawSprite } from "../../../utils/sprite";
import { drawText, measureText } from "../../../utils/text";
import { drawRect, drawBorderRect } from "../../../ui/draw";
import type { Rect } from "../../settings/pages";

type Tab = "players" | "clans";

interface Entry {
  id: number;
  rank: number;
  name: string;
  tag: string | null;
  avatar: string | null;
  stats: string;
  flag: string | null;
}

const CLAN_BLUE = { r: 90, g: 140, b: 230, a: 255 };
const regionNames = new Intl.DisplayNames(["en"], { type: "region" });
const countryName = (code: string) =>
  /^[A-Z]{2}$/.test(code) ? regionNames.of(code) ?? code : code;

export class LeaderboardsDrawer extends PanelDrawer {
  private tab: Tab = "players";
  private country: string = "";
  private spin: boolean = false;
  private entries: Entry[] = [];
  private page: number = 0;
  private done: boolean = false;
  private loading: boolean = false;
  private countries = new Set<string>();
  private avatars = new Map<number, string | null>();

  onUserClick = (userId: number) => {};

  protected getHeaderText(): string {
    return "Leaderboard";
  }

  protected getSubtitleText(): string {
    return this.tab === "players" ? "Global player rankings" : "Global clan rankings";
  }

  private query(): string {
    return `${this.tab}:${this.country}:${this.spin}`;
  }

  private reset(changes: { tab?: Tab; country?: string; spin?: boolean }): void {
    Object.assign(this, changes);
    this.entries = [];
    this.page = 0;
    this.done = false;
    this.resetScrollState();
  }

  private async loadMore(): Promise<void> {
    this.loading = true;
    const query = this.query();
    const page = this.page + 1;
    const session = ProfileManager.get().token || "";
    try {
      const entries: Entry[] =
        this.tab === "players"
          ? ((await getLeaderboard({ session, page, spin: this.spin, flag: this.country || undefined })).leaderboard ?? []).map(
              (player: any, index: number) => ({
                id: player.id,
                rank: (page - 1) * 50 + index + 1,
                name: ConfigManager.getExtra("streamer.hideUsernames", false)
                  ? "Player"
                  : player.username ?? "Unknown",
                tag: player.clans?.acronym ?? null,
                avatar: null,
                stats: `RP: ${Math.round((this.spin ? player.spin_skill_points : player.skill_points) ?? 0)}  -  Plays: ${player.play_count ?? 0}`,
                flag: player.flag,
              })
            )
          : ((await getClans({ session, page })).clanData ?? []).map((clan: any, index: number) => ({
              id: clan.id,
              rank: (page - 1) * 25 + index + 1,
              name: clan.name,
              tag: clan.acronym,
              avatar: clan.avatar_url,
              stats: `RP: ${Math.round(clan.total_skill_points)}  -  Members: ${clan.member_count}`,
              flag: null,
            }));
      if (query !== this.query()) return;
      this.entries.push(...entries);
      entries.forEach((entry) => entry.flag && this.countries.add(entry.flag));
      this.page = page;
      this.done = entries.length === 0;
    } catch (error) {
      console.error("Failed to load leaderboard:", error);
      this.done = query === this.query();
    } finally {
      this.loading = false;
    }
  }

  private avatarOf(entry: Entry): string | null {
    if (this.tab === "clans") return entry.avatar;
    if (!this.avatars.has(entry.id)) {
      this.avatars.set(entry.id, null);
      getProfile({ session: "", id: entry.id })
        .then((response: any) => this.avatars.set(entry.id, response.user?.avatar_url ?? null))
        .catch(() => {});
    }
    return this.avatars.get(entry.id) ?? null;
  }

  protected onUpdate(): void {
    super.onUpdate();
    if (this.isOpen && !this.loading && !this.done && this.maxScrollOffset - this.scrollOffset < 600) {
      void this.loadMore();
    }
  }

  protected drawBody(column: Rect, mouse: Vector2 | null, hits: Hit[]): number {
    let y = column.y;
    drawTabs(
      { x: column.x, y, w: column.w, h: 42 },
      [
        { id: "players", label: "Players" },
        { id: "clans", label: "Clans" },
      ],
      this.tab,
      mouse,
      hits,
      (id) => id !== this.tab && this.reset({ tab: id as Tab })
    );
    y += 54;

    if (this.tab === "players") {
      const field = { x: column.x, y, w: column.w - 136, h: 40 };
      drawField(field, `Country: ${this.country ? countryName(this.country) : "All countries"}`, hovered(field, mouse));
      hits.push({
        rect: field,
        press: () =>
          this.openDropdown(
            { ...field, w: column.w },
            [
              { id: "", label: "All countries" },
              ...[...this.countries].sort().map((code) => ({ id: code, label: countryName(code) })),
            ],
            this.country,
            (id) => this.reset({ country: id }),
            3
          ),
      });
      const toggle = drawToggle(column.x + column.w - 66, y + 4, this.spin);
      drawText("Spin", Vector2(toggle.x - 8, y + 10), 20, PANEL.text, "right");
      hits.push({ rect: { ...toggle, x: toggle.x - 50, w: toggle.w + 50 }, press: () => this.reset({ spin: !this.spin }) });
      y += 64;
    }

    for (const entry of this.entries) {
      const card = { x: column.x, y, w: column.w, h: 78 };
      y += 90;
      if (!this.isVisible(card)) continue;
      const hover = this.tab === "players" && hovered(card, mouse);
      const background = hover ? PANEL.cardHover : PANEL.card;
      drawRect(card.x, card.y, card.w, card.h, background);

      const rank = `#${entry.rank}`;
      drawText(rank, Vector2(card.x + 12, card.y + 25), 26, PANEL.text);
      const dividerX = card.x + 24 + measureText(rank, 26).width;
      drawRect(dividerX, card.y + 10, 2, card.h - 20, PANEL.border);

      const avatarX = dividerX + 12;
      const avatar = this.avatarOf(entry);
      if (avatar) {
        drawSprite(avatar, Vector2(avatarX, card.y + 14), Vector2(50, 50), PANEL.text);
      } else {
        drawRect(avatarX, card.y + 14, 50, 50, { r: 50, g: 50, b: 54, a: 255 });
      }
      drawSprite("/avatar-mask.png", Vector2(avatarX, card.y + 14), Vector2(50, 50), background);

      let x = avatarX + 62;
      if (entry.tag) {
        const tag = `[${entry.tag}]`;
        const tagW = measureText(tag, 14).width + 12;
        drawRect(x, card.y + 12, tagW, 22, { r: 20, g: 28, b: 46, a: 255 });
        drawBorderRect(x, card.y + 12, tagW, 22, 1, CLAN_BLUE);
        drawText(tag, Vector2(x + 6, card.y + 16), 14, CLAN_BLUE);
        x += tagW + 6;
      }
      drawText(entry.name, Vector2(x, card.y + 10), 24, PANEL.text);
      if (this.tab === "players") {
        drawSprite("/square.png", Vector2(x + measureText(entry.name, 24).width + 8, card.y + 12), Vector2(22, 22), PANEL.text);
        hits.push({ rect: card, press: () => this.onUserClick(entry.id) });
      }
      drawText(entry.stats, Vector2(avatarX + 62, card.y + 44), 17, PANEL.text);
    }

    if (this.loading || this.entries.length === 0) {
      drawText(this.loading ? "Loading..." : "No entries", Vector2(column.x + column.w / 2, y + 10), 20, PANEL.dim, "center");
      y += 50;
    }
    return y;
  }
}

export function createLeaderboardsDrawer(): LeaderboardsDrawer {
  return new LeaderboardsDrawer();
}
