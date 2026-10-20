const no = () => false;
const client: any = {
  cloud: { isEnabledForAccount: no, isEnabledForApp: no, fileExists: no, readFile: () => null, writeFile: no, deleteFile: no },
  localplayer: { getName: () => "Player", getSteamId: () => ({ steamId64: 0n, accountId: 0 }), getLevel: () => 0, getIpCountry: () => "" },
  achievement: { activate: no, isActivated: no, clear: no },
  auth: { getSessionTicketWithSteamId: async () => ({ getBytes: () => new Uint8Array(0), cancel() {} }), getAuthTicketForWebApi: async () => ({ getBytes: () => new Uint8Array(0), cancel() {} }) },
  overlay: { activateToWebPage() {}, activateDialog() {} },
  matchmaking: { createLobby: async () => { throw new Error("Multiplayer lobbies need Steam"); }, joinLobby: async () => { throw new Error("Multiplayer lobbies need Steam"); }, getLobbies: async () => [] },
  networking: { sendP2PPacket: no, isP2PPacketAvailable: () => 0, readP2PPacket: () => null, acceptP2PSession() {} },
  callback: { register: () => ({ disconnect() {} }), SteamCallback: {} },
  apps: { isSubscribed: () => true, currentGameLanguage: () => "english" },
  utils: { getAppId: () => 2250500 },
};
export const init = () => client;
export const runCallbacks = () => {};
export const electronEnableSteamOverlay = () => {};
export default { init, runCallbacks, electronEnableSteamOverlay };
