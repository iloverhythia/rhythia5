// Rhythia's online API is unreachable from a sandboxed web page; every call fails the way it does when offline.
const offline = async (..._a: any[]): Promise<any> => { throw new Error("Online features are not available in the web build"); };
export const getBeatmaps = offline, getBeatmapPage = offline, getBeatmapPageById = offline, getProfile = offline;
export const searchUsers = offline, getUserScores = offline, getLeaderboard = offline, submitScore = offline;
export const setEnvironment = (_e: any) => {};
export default new Proxy({}, { get: () => offline });
