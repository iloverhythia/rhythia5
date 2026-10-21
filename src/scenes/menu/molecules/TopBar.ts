import { Vector2 } from "raylib";
import { GameObject } from "../../../atoms/Object";
import { drawSprite } from "../../../utils/sprite";
import { drawText, measureText } from "../../../utils/text";
import { Rhythia } from "../../../atoms/Rhythia";
import { accentWithHover } from "../../../utils/colors";
import { lerpDelta } from "../../../utils/lerp";
import { playFx } from "../../../utils/soundManager";
import { getProfile } from "rhythia-api";
import { ProfileManager } from "../../../utils/profileManager";
import { AccentColor } from "../../../utils/imageBlur";
import { createInputBox, InputBox } from "../atoms/InputBox";
import { Popup } from "../atoms/Popup";
import { logger } from "../../../utils/logger";
import { ConfigManager } from "../../../utils/configManager";
import {
  loginWithDiscord,
  promptPasswordLogin,
} from "../../../utils/auth/supabase";
import { createTopContextMenu, TopContextMenu } from "./TopContextMenu";
import { MenuScene } from "..";
import { inRect } from "../../../utils/geometry";
import { drawRect } from "../../../ui/draw";

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

interface BarButton {
  icon?: string;
  label?: string;
  tooltip?: string;
  x: number;
  width: number;
  hover: number;
  onClick: () => void;
  isActive: () => boolean;
}

const MARGIN_X = 70;
const PANEL_TOP = 6;
const PANEL_HEIGHT = 62;
const ICON_SIZE = 30;
const ICON_SPACING = 56;
const TAB_HEIGHT = 40;
const SEARCH_WIDTH = 200;
const PEOPLE_SIZE = 56;

export class TopBar {
  private gameObject: GameObject;
  private peopleObject: GameObject;
  private readonly barHeight: number = 70;
  private profileData: ProfileData | null = null;
  private accentColor: AccentColor | null = null;
  private searchInput: InputBox | null = null;
  private iconButtons: BarButton[] = [];
  private tabs: BarButton[] = [];
  private activeTab: string = ConfigManager.get().selectedTab || "Downloaded";
  private toggleState: boolean =
    ConfigManager.get().alternativeViewMode || false;
  private peopleHover: number = 0;
  private profileStatus: "loading" | "ready" | "unauthenticated" | "error" =
    "loading";
  private topMenu!: TopContextMenu;

  onTabChange = (tabTitle: string) => {};
  onProfileClick = () => {};
  onFilterClick = () => {};
  onCustomizeClick = () => {};
  onLeaderboardsClick = () => {};
  onMultiplayerClick = () => {};
  onCollectionClick = () => {};
  onFavoriteClick = () => {};
  isFavorite = () => false;
  onImportFolderClick = () => {};
  onToggleClick = (state: boolean) => {};
  onSearchChange = (searchTerm: string) => {};
  onImportFromSSPM = () => {};
  onExportCurrentMap = () => {};
  onReplaceCurrentAudio = () => {};
  onRedownloadMap = () => {};
  onDeleteCurrentMap = () => {};
  onOpenGameFolder = () => {};
  onExitGame = () => {};

  constructor() {
    this.gameObject = new GameObject({ zBase: 4 });
    this.peopleObject = new GameObject({ zBase: 4 });
    this.initialize();
    this.loadProfile();
  }

  private initialize(): void {
    const button = (
      props: Omit<BarButton, "x" | "width" | "hover" | "isActive"> &
        Partial<Pick<BarButton, "isActive">>
    ): BarButton => ({
      x: 0,
      width: 0,
      hover: 0,
      isActive: () => false,
      ...props,
    });
    const toggleTab = (tab: string) => () =>
      this.setActiveTab(this.activeTab === tab ? "Downloaded" : tab);

    this.topMenu = createTopContextMenu({
      onImportFromSSPM: () => this.onImportFromSSPM(),
      onImportFolder: () => this.onImportFolderClick(),
      onExportCurrentMap: () => this.onExportCurrentMap(),
      onReplaceCurrentAudio: () => this.onReplaceCurrentAudio(),
      onRedownloadMap: () => this.onRedownloadMap(),
      onDeleteCurrentMap: () => this.onDeleteCurrentMap(),
      onOpenGameFolder: () => this.onOpenGameFolder(),
      onExitGame: () => this.onExitGame(),
    });
    this.topMenu.setBarHeight(this.barHeight);

    this.iconButtons = [
      button({
        icon: "/icons/heart.png",
        tooltip: "Favorite map",
        onClick: () => this.onFavoriteClick(),
        isActive: () => this.isFavorite(),
      }),
      button({
        icon: "/icons/settings.png",
        tooltip: "Customization",
        onClick: () => this.onCustomizeClick(),
      }),
      button({
        icon: "/icons/cloud-download.png",
        tooltip: "Online maps",
        onClick: toggleTab("Online Maps"),
        isActive: () =>
          ["Online Maps", "Ranked", "Legacy"].includes(this.activeTab),
      }),
      button({
        icon: "/icons/list.png",
        tooltip: "Menu",
        onClick: () => this.topMenu.handleTopBarClick(Vector2(this.topMenuX(), 1)),
        isActive: () => this.isMenuOpen(),
      }),
      button({
        icon: "/icons/sort-ascending-letters.png",
        tooltip: "Sort and filter",
        onClick: () => this.onFilterClick(),
      }),
      button({
        icon: "/icons/bookmark-plus.png",
        tooltip: "Add map to collection",
        onClick: () => this.onCollectionClick(),
      }),
      button({
        icon: "/icons/layout-grid.png",
        tooltip: "Card view",
        onClick: () => {
          this.toggleState = !this.toggleState;
          this.onToggleClick(this.toggleState);
        },
        isActive: () => this.toggleState,
      }),
    ];

    this.tabs = [
      button({ label: "Multiplayer", onClick: () => this.onMultiplayerClick() }),
      button({
        label: "Collections",
        onClick: () => this.setActiveTab("Collections"),
        isActive: () => this.activeTab === "Collections",
      }),
      button({
        label: "All Maps",
        onClick: () => this.setActiveTab("Downloaded"),
        isActive: () => this.activeTab === "Downloaded",
      }),
    ];

    this.layout();
    this.createSearchInput();

    this.gameObject.attachRect({
      pos: { x: 0, y: 0 },
      size: { x: Rhythia.gameWidth, y: this.barHeight },
    });
    this.gameObject.onDraw = () => this.draw();
    this.gameObject.onUpdate = () => this.updateHover();
    this.gameObject.rectArea!.onClick = () => this.handleClick();

    const peopleRect = this.getPeopleRect();
    this.peopleObject.attachRect({
      pos: { x: peopleRect.x, y: peopleRect.y },
      size: { x: PEOPLE_SIZE, y: PEOPLE_SIZE },
    });
    this.peopleObject.onDraw = () => this.drawPeopleButton();
    this.peopleObject.rectArea!.onClick = () => {
      if (this.isBlocked()) return true;
      this.onLeaderboardsClick();
      playFx("/hover.wav");
      return true;
    };

    loginWithDiscord(true).then(() => {
      this.loadProfile();
    });
  }

  private layout(): void {
    const rightEdge = Rhythia.gameWidth - MARGIN_X - 12;
    let x = rightEdge - SEARCH_WIDTH - 10;
    for (const tab of [...this.tabs].reverse()) {
      tab.width = measureText(tab.label!, 26).width + 40;
      x -= tab.width;
      tab.x = x;
      x -= 10;
    }
    x -= 20 + ICON_SPACING * this.iconButtons.length;
    for (const icon of this.iconButtons) {
      icon.x = x + (ICON_SPACING - ICON_SIZE) / 2;
      icon.width = ICON_SIZE;
      x += ICON_SPACING;
    }
    this.topMenu.setButtonX(this.topMenuX());
  }

  private topMenuX(): number {
    return this.iconButtons[3].x;
  }

  private getPeopleRect(): { x: number; y: number } {
    return {
      x: Rhythia.gameWidth - PEOPLE_SIZE - 40,
      y: Rhythia.gameHeight - PEOPLE_SIZE - 30,
    };
  }

  private async loadProfile(): Promise<void> {
    try {
      this.profileStatus = "loading";
      const token = ProfileManager.get().token;
      if (!token) {
        this.profileStatus = "unauthenticated";
        this.profileData = null;
        return;
      }

      const profile = await getProfile({ session: token });
      if (profile?.user) {
        this.profileData = profile.user;
        this.profileStatus = "ready";
        logger("Profile loaded:", this.profileData);
      } else {
        this.profileData = null;
        this.profileStatus = "unauthenticated";
      }
    } catch (error) {
      console.error("Failed to load profile:", error);
      this.profileData = null;
      this.profileStatus = "error";
    }
  }

  private isBlocked(): boolean {
    return Popup.isAnyPopupLoading() || MenuScene.isAnyOverlayOpen();
  }

  private updateHover(): void {
    const mousePos = this.isBlocked() ? null : this.gameObject.getMousePosition();
    const buttonY = (this.barHeight - TAB_HEIGHT) / 2;
    for (const button of [...this.iconButtons, ...this.tabs]) {
      const hovered = !!(
        mousePos &&
        inRect(mousePos.x, mousePos.y, button.x, buttonY, button.width, TAB_HEIGHT)
      );
      button.hover = lerpDelta(button.hover, hovered ? 1 : 0, 0.2);
    }
    const people = this.getPeopleRect();
    const peopleHovered = !!(
      mousePos &&
      inRect(mousePos.x, mousePos.y, people.x, people.y, PEOPLE_SIZE, PEOPLE_SIZE)
    );
    this.peopleHover = lerpDelta(this.peopleHover, peopleHovered ? 1 : 0, 0.2);
  }

  private handleClick(): boolean {
    if (MenuScene.isAnyOverlayOpen()) return true;
    const mousePos = this.gameObject.getMousePosition();
    if (!mousePos || mousePos.y > this.barHeight) return false;

    if (mousePos.x >= MARGIN_X && mousePos.x <= MARGIN_X + 280) {
      this.handleProfileClick();
      return true;
    }

    const clicked = [...this.iconButtons, ...this.tabs].find(
      (button) => mousePos.x >= button.x && mousePos.x <= button.x + button.width
    );
    if (clicked) {
      clicked.onClick();
      playFx("/hover.wav");
      return true;
    }

    const searchX = Rhythia.gameWidth - MARGIN_X - 12 - SEARCH_WIDTH;
    return !(mousePos.x >= searchX && mousePos.x <= searchX + SEARCH_WIDTH);
  }

  private setActiveTab(tab: string): void {
    this.activeTab = tab;
    this.onTabChange(tab);
  }

  private handleProfileClick(): void {
    playFx("/hover.wav");
    if (this.profileStatus === "ready") {
      this.onProfileClick();
      return;
    }
    if (this.profileStatus === "loading") return;

    void promptPasswordLogin().then((loggedIn) => {
      if (loggedIn) this.loadProfile();
    });
  }

  private draw(): void {
    drawRect(
      MARGIN_X,
      PANEL_TOP,
      Rhythia.gameWidth - MARGIN_X * 2,
      PANEL_HEIGHT,
      { r: 12, g: 12, b: 14, a: 235 }
    );
    this.drawProfile();
    this.drawIconButtons();
    this.drawTabs();
  }

  private drawProfile(): void {
    const avatarSize = 50;
    const avatarX = MARGIN_X + 12;
    const avatarY = (this.barHeight - avatarSize) / 2;
    const hasProfile = this.profileStatus === "ready";
    const avatarUrl =
      this.profileData?.avatar_url || this.profileData?.profile_image;

    if (hasProfile && avatarUrl) {
      drawSprite(
        avatarUrl,
        Vector2(avatarX, avatarY),
        Vector2(avatarSize, avatarSize),
        { r: 255, g: 255, b: 255, a: 255 }
      );
    } else {
      drawRect(avatarX, avatarY, avatarSize, avatarSize, {
        r: 45,
        g: 45,
        b: 52,
        a: 255,
      });
    }

    const textX = avatarX + avatarSize + 10;
    const name =
      this.profileStatus === "ready"
        ? this.profileData?.username || "Player"
        : this.profileStatus === "loading"
        ? "Loading..."
        : "Log in";
    drawText(name, Vector2(textX, avatarY - 2), 30, {
      r: 230,
      g: 230,
      b: 230,
      a: 255,
    });

    if (hasProfile) {
      const nameWidth = measureText(name, 30).width;
      drawSprite(
        "/square.png",
        Vector2(textX + nameWidth + 8, avatarY + 4),
        Vector2(20, 20),
        { r: 210, g: 210, b: 210, a: 255 }
      );
      const rp = `${Math.round(this.profileData?.skill_points ?? 0)} RP`;
      drawText(rp, Vector2(textX, avatarY + 28), 22, {
        r: 200,
        g: 200,
        b: 200,
        a: 255,
      });
      const position = this.profileData?.position;
      if (position) {
        drawText(
          `#${position.toLocaleString()}`,
          Vector2(textX + measureText(rp, 22).width + 8, avatarY + 28),
          22,
          { r: 110, g: 110, b: 110, a: 255 }
        );
      }
    } else if (this.profileStatus !== "loading") {
      drawText("with Rhythia account", Vector2(textX, avatarY + 28), 20, {
        r: 160,
        g: 160,
        b: 160,
        a: 255,
      });
    }
  }

  private drawIconButtons(): void {
    const buttonY = (this.barHeight - ICON_SIZE) / 2;
    for (const button of this.iconButtons) {
      const active = button.isActive();
      const color = accentWithHover(
        active ? { r: 255, g: 255, b: 255 } : { r: 200, g: 200, b: 200 },
        this.accentColor,
        0.2,
        button.hover
      );
      drawSprite(
        button.icon!,
        Vector2(button.x, buttonY),
        Vector2(ICON_SIZE, ICON_SIZE),
        color
      );
      if (active) {
        drawRect(button.x + 4, buttonY + ICON_SIZE + 6, ICON_SIZE - 8, 3, {
          r: 255,
          g: 255,
          b: 255,
          a: 220,
        });
      }
    }
    const hovered = this.iconButtons.find((button) => button.hover > 0.5);
    if (hovered) {
      this.drawTooltip(hovered.tooltip!, hovered.x + ICON_SIZE / 2, buttonY);
    }
  }

  private drawTabs(): void {
    const tabY = (this.barHeight - TAB_HEIGHT) / 2;
    for (const tab of this.tabs) {
      const shade = 34 + 16 * tab.hover;
      drawRect(tab.x, tabY, tab.width, TAB_HEIGHT, {
        r: shade,
        g: shade,
        b: shade + 2,
        a: 255,
      });
      if (tab.isActive()) {
        drawRect(tab.x, tabY + TAB_HEIGHT - 3, tab.width, 3, {
          r: 255,
          g: 255,
          b: 255,
          a: 255,
        });
      }
      drawText(
        tab.label!,
        Vector2(tab.x + tab.width / 2, tabY + (TAB_HEIGHT - 26) / 2),
        26,
        { r: 240, g: 240, b: 240, a: 255 },
        "center"
      );
    }
  }

  private drawPeopleButton(): void {
    const { x, y } = this.getPeopleRect();
    const shade = 28 + 20 * this.peopleHover;
    drawRect(x, y, PEOPLE_SIZE, PEOPLE_SIZE, {
      r: shade,
      g: shade,
      b: shade,
      a: 230,
    });
    drawSprite(
      "/icons/users.png",
      Vector2(x + 12, y + 12),
      Vector2(PEOPLE_SIZE - 24, PEOPLE_SIZE - 24),
      { r: 255, g: 255, b: 255, a: 255 }
    );
    if (this.peopleHover > 0.5) {
      this.drawTooltip("Leaderboards", x + PEOPLE_SIZE / 2, y);
    }
  }

  private drawTooltip(label: string, centerX: number, elementTop: number): void {
    const fontSize = 18;
    const padX = 8;
    const padY = 6;
    const textSize = measureText(label, fontSize, 1);
    const boxW = textSize.width + padX * 2;
    const boxH = textSize.height + padY * 2;
    const boxX = Math.min(
      Math.max(12, centerX - boxW / 2),
      Rhythia.gameWidth - 12 - boxW
    );
    const boxY =
      elementTop - boxH - 8 < 8 ? this.barHeight + 8 : elementTop - boxH - 8;

    drawRect(boxX, boxY, boxW, boxH, { r: 0, g: 0, b: 0, a: 200 });
    drawText(
      label,
      Vector2(boxX + boxW / 2, boxY + padY),
      fontSize,
      { r: 255, g: 255, b: 255, a: 255 },
      "center"
    );
  }

  public getGameObject(): GameObject {
    return this.gameObject;
  }

  public getActiveTab(): string {
    return this.activeTab;
  }

  public goToTab(label: string): void {
    this.setActiveTab(label);
  }

  public getHeight(): number {
    return this.barHeight;
  }

  public getProfileData(): ProfileData | null {
    return this.profileData;
  }

  public setAccentColor(color: AccentColor | null): void {
    this.accentColor = color;
    this.searchInput?.setAccentColor(color);
    this.topMenu.setAccentColor(color);
  }

  public isMenuOpen(): boolean {
    return this.topMenu.isOpenOrAnimating();
  }

  private createSearchInput(): void {
    this.searchInput = createInputBox({
      position: Vector2(
        Rhythia.gameWidth - MARGIN_X - 12 - SEARCH_WIDTH,
        this.barHeight / 2
      ),
      width: SEARCH_WIDTH,
      height: TAB_HEIGHT,
      placeholder: "Search map",
      fontSize: 22,
      maxLength: 100,
      onValueChange: (searchTerm) => this.onSearchChange(searchTerm),
    });
  }

  public isSearchFocused(): boolean {
    return this.searchInput?.isFocusedNow() || false;
  }

  public focusSearch(): void {
    this.searchInput?.focus();
  }

  public appendToSearch(text: string): void {
    if (!this.searchInput) return;
    this.searchInput.setValueAndMoveCursorToEnd(
      this.searchInput.getValue() + text
    );
  }
}

export function createTopBar(): TopBar {
  return new TopBar();
}
