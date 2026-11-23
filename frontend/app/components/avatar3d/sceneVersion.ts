// Version of what the 3D scene draws, for the 2D avatar images made from it (avatarSnapshots.ts). Must equal THUMB_VERSION in
// backend/src/lib/avatarThumbnails.ts: the server only accepts images from this scene version, so a browser still running an
// older bundle cannot store an image of the old scene under the new version. Bump BOTH when the scene's look changes
// (2 = Roblox classic cylinder head).
// Kept in its own file so AvatarThumbnailSync can read it without loading three.js.
export const AVATAR_SCENE_VERSION = 2;
