// Browser client for the Rhythia API, generated from rhythia-api@208 index.ts.
// Same requests as rhythia-api/handleApi: POST https://<env>.rhythia.com<url> with a JSON body (no preflight), profanity-censored response.
import { profanity } from "@2toad/profanity";
let env = "development";
export function setEnvironment(stage: "development" | "testing" | "production") { env = stage; }
profanity.whitelist.addWords(["willy"]);
function handleApi(url: string) {
  return async (input: any): Promise<any> => {
    const response = await fetch(`https://${env}.rhythia.com${url}`, { method: "POST", body: JSON.stringify(input) });
    const output = await response.text();
    return JSON.parse(profanity.censor(output));
  };
}
export const acceptInvite = handleApi("/api/acceptInvite");
export const addCollectionMap = handleApi("/api/addCollectionMap");
export const approveMap = handleApi("/api/approveMap");
export const chartPublicStats = handleApi("/api/chartPublicStats");
export const createBeatmap = handleApi("/api/createBeatmap");
export const createBeatmapPage = handleApi("/api/createBeatmapPage");
export const createClan = handleApi("/api/createClan");
export const createCollection = handleApi("/api/createCollection");
export const createInvite = handleApi("/api/createInvite");
export const createSupporter = handleApi("/api/createSupporter");
export const deleteBeatmapPage = handleApi("/api/deleteBeatmapPage");
export const deleteCollection = handleApi("/api/deleteCollection");
export const deleteCollectionMap = handleApi("/api/deleteCollectionMap");
export const editAboutMe = handleApi("/api/editAboutMe");
export const editClan = handleApi("/api/editClan");
export const editCollection = handleApi("/api/editCollection");
export const editProfile = handleApi("/api/editProfile");
export const executeAdminOperation = handleApi("/api/executeAdminOperation");
export const getAvatarUploadUrl = handleApi("/api/getAvatarUploadUrl");
export const getBadgedUsers = handleApi("/api/getBadgedUsers");
export const getBeatmapComments = handleApi("/api/getBeatmapComments");
export const getBeatmapPage = handleApi("/api/getBeatmapPage");
export const getBeatmapPageById = handleApi("/api/getBeatmapPageById");
export const getBeatmaps = handleApi("/api/getBeatmaps");
export const getBeatmapStarRating = handleApi("/api/getBeatmapStarRating");
export const getClan = handleApi("/api/getClan");
export const getClans = handleApi("/api/getClans");
export const getCollection = handleApi("/api/getCollection");
export const getCollections = handleApi("/api/getCollections");
export const getInventory = handleApi("/api/getInventory");
export const getLeaderboard = handleApi("/api/getLeaderboard");
export const getMapUploadUrl = handleApi("/api/getMapUploadUrl");
export const getPassToken = handleApi("/api/getPassToken");
export const getProfile = handleApi("/api/getProfile");
export const getPublicStats = handleApi("/api/getPublicStats");
export const getRawStarRating = handleApi("/api/getRawStarRating");
export const getScore = handleApi("/api/getScore");
export const getStoryBeatmaps = handleApi("/api/getStoryBeatmaps");
export const getTimestamp = handleApi("/api/getTimestamp");
export const getUserScores = handleApi("/api/getUserScores");
export const getVerified = handleApi("/api/getVerified");
export const nominateMap = handleApi("/api/nominateMap");
export const postBeatmapComment = handleApi("/api/postBeatmapComment");
export const rankMapsArchive = handleApi("/api/rankMapsArchive");
export const searchUsers = handleApi("/api/searchUsers");
export const setPasskey = handleApi("/api/setPasskey");
export const submitScore = handleApi("/api/submitScore");
export const updateBeatmapPage = handleApi("/api/updateBeatmapPage");
