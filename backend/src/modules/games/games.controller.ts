// Migration (run manually in Supabase SQL editor):
// CREATE TABLE IF NOT EXISTS game_plays (
//   id uuid DEFAULT gen_random_uuid(),
//   user_id uuid,
//   game_id text,
//   played_at timestamptz DEFAULT now(),
//   PRIMARY KEY(id)
// );
// CREATE INDEX IF NOT EXISTS game_plays_user_id_played_at_idx ON game_plays (user_id, played_at DESC);

import { Request, Response } from "express";
import pool from "../../lib/db.js";
import { fetchRobloxGameData } from "./roblox.service.js";
import { checkName, maskText } from "../../lib/wordFilter.js";

// GET /api/v1/games
export const getGames = async (req: Request, res: Response) => {
  try {
    const {
      search,
      page = "1",
      limit = "20",
      sort = "recent",
    } = req.query;

    const pageNum = Math.max(1, parseInt(page as string) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string) || 20));
    const offset = (pageNum - 1) * limitNum;

    let whereConditions: string[] = ['"isPublished" = true'];
    let params: any[] = [];
    let paramIndex = 1;

    if (search) {
      whereConditions.push(
        `(to_tsvector('english', title) @@ plainto_tsquery('english', $${paramIndex}) OR title ILIKE $${paramIndex + 1})`
      );
      params.push(search);
      params.push(`%${search}%`);
      paramIndex += 2;
    }

    const whereClause = `WHERE ${whereConditions.join(" AND ")}`;

    let orderClause = 'ORDER BY "createdAt" DESC';
    switch ((sort as string).toLowerCase()) {
      case "popular":
        orderClause = 'ORDER BY visits DESC';
        break;
      case "recent":
        orderClause = 'ORDER BY "createdAt" DESC';
        break;
      case "favorites":
        orderClause = 'ORDER BY favorites DESC';
        break;
      case "sponsored":
        orderClause = 'ORDER BY is_sponsored DESC, sponsor_bid DESC, "createdAt" DESC';
        break;
    }

    const countQuery = `SELECT COUNT(*) FROM games ${whereClause}`;
    const countResult = await pool.query(countQuery, params);
    const totalItems = parseInt(countResult.rows[0].count);

    const gamesQuery = `
      SELECT id, title, description, "thumbnailUrl", "iconUrl",
             "creatorId", "groupId", genre, tags, "ageRating",
             "maxPlayers", "isPublished", visits, likes, dislikes, favorites,
             "currentPlayers", is_sponsored, sponsored_until, sponsor_bid,
             "createdAt", "updatedAt", "placeId"
      FROM games
      ${whereClause}
      ${orderClause}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    params.push(limitNum, offset);

    const gamesResult = await pool.query(gamesQuery, params);

    res.set("Cache-Control", "public, s-maxage=60, stale-while-revalidate=120");
    res.json({
      success: true,
      data: {
        games: gamesResult.rows,
        pagination: {
          page: pageNum,
          limit: limitNum,
          totalItems,
          totalPages: Math.ceil(totalItems / limitNum),
        },
      },
    });
  } catch (error) {
    console.error("Error fetching games:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch games",
    });
  }
};

// GET /api/v1/games/sponsored
export const getSponsoredGames = async (_req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT id, title, description, "thumbnailUrl", "iconUrl",
              "creatorId", visits, favorites, "currentPlayers",
              is_sponsored, sponsored_until, sponsor_bid, "placeId"
       FROM games
       WHERE "isPublished" = true
       AND is_sponsored = true
       AND (sponsored_until IS NULL OR sponsored_until > NOW())
       ORDER BY sponsor_bid DESC
       LIMIT 6`
    );

    res.set("Cache-Control", "public, s-maxage=60, stale-while-revalidate=120");
    res.json({
      success: true,
      data: { games: result.rows },
    });
  } catch (error) {
    console.error("Error fetching sponsored games:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch sponsored games",
    });
  }
};

// POST /api/v1/games/:id/sponsor
export const sponsorGame = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { bid, days = 7 } = req.body;
    const userId = (req as any).userId;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    if (!bid || bid < 1) {
      return res.status(400).json({ success: false, message: "Bid amount is required" });
    }

    const gameCheck = await pool.query(
      `SELECT id, "creatorId" FROM games WHERE id = $1 AND "isPublished" = true`,
      [id]
    );

    if (gameCheck.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Game not found" });
    }

    if (gameCheck.rows[0].creatorId !== userId) {
      return res.status(403).json({ success: false, message: "You can only sponsor your own games" });
    }

    const sponsoredUntil = new Date();
    sponsoredUntil.setDate(sponsoredUntil.getDate() + parseInt(days));

    await pool.query(
      `UPDATE games SET is_sponsored = true, sponsor_bid = $1, sponsored_until = $2, "updatedAt" = NOW() WHERE id = $3`,
      [bid, sponsoredUntil, id]
    );

    return res.json({
      success: true,
      message: "Game sponsored successfully",
      data: { sponsoredUntil },
    });
  } catch (error) {
    console.error("Error sponsoring game:", error);
    return res.status(500).json({ success: false, message: "Failed to sponsor game" });
  }
};

// DELETE /api/v1/games/:id/sponsor
export const unsponsorGame = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).userId;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const gameCheck = await pool.query(
      `SELECT id, "creatorId" FROM games WHERE id = $1`,
      [id]
    );

    if (gameCheck.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Game not found" });
    }

    if (gameCheck.rows[0].creatorId !== userId) {
      return res.status(403).json({ success: false, message: "You can only unsponsor your own games" });
    }

    await pool.query(
      `UPDATE games SET is_sponsored = false, sponsor_bid = 0, sponsored_until = NULL, "updatedAt" = NOW() WHERE id = $1`,
      [id]
    );

    return res.json({ success: true, message: "Game unsponsored successfully" });
  } catch (error) {
    console.error("Error unsponsoring game:", error);
    return res.status(500).json({ success: false, message: "Failed to unsponsor game" });
  }
};

// GET /api/v1/games/:id
export const getGameById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).userId;

    const result = await pool.query(
      `SELECT g.id, g.title, g.description, g."thumbnailUrl", g."iconUrl",
              g."creatorId", g."groupId", g.genre, g.tags, g."ageRating",
              g."maxPlayers", g."isPublished", g.visits, g.likes, g.dislikes, g.favorites,
              g."currentPlayers", g.is_sponsored, g.sponsored_until, g.sponsor_bid,
              g."universeId", g."placeId",
              g."createdAt", g."updatedAt",
              u.username as creator_username, u."displayName" as creator_display_name,
              u."isVerified" as creator_is_verified
       FROM games g
       LEFT JOIN users u ON g."creatorId" = u.id
       WHERE g.id = $1 AND g."isPublished" = true`,
      [id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: "Game not found",
      });
      return;
    }

    const game = result.rows[0];

    if (userId) {
      const [likeResult, favoriteResult] = await Promise.all([
        pool.query(`SELECT type FROM game_likes WHERE game_id = $1 AND user_id = $2`, [id, userId]),
        pool.query(`SELECT id FROM game_favorites WHERE "gameId" = $1 AND "userId" = $2`, [id, userId]),
      ]);
      game.userLiked = likeResult.rows.length > 0 && likeResult.rows[0].type === "like";
      game.userDisliked = likeResult.rows.length > 0 && likeResult.rows[0].type === "dislike";
      game.userFavorited = favoriteResult.rows.length > 0;
    } else {
      game.userLiked = false;
      game.userDisliked = false;
      game.userFavorited = false;
    }

    res.json({
      success: true,
      data: { game },
    });
  } catch (error) {
    console.error("Error fetching game:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch game",
    });
  }
};

// POST /api/v1/games/:id/like
export const toggleGameLike = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).userId;

    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const existing = await pool.query(
      `SELECT type FROM game_likes WHERE game_id = $1 AND user_id = $2`,
      [id, userId]
    );

    let userLiked = false;
    const userDisliked = false;

    if (existing.rows.length === 0) {
      // No existing reaction — add a like
      await pool.query(
        `INSERT INTO game_likes (user_id, game_id, type, created_at) VALUES ($1, $2, 'like', NOW())`,
        [userId, id]
      );
      await pool.query(`UPDATE games SET likes = likes + 1 WHERE id = $1`, [id]);
      userLiked = true;
    } else if (existing.rows[0].type === "like") {
      // Already liked — remove the reaction entirely
      await pool.query(`DELETE FROM game_likes WHERE game_id = $1 AND user_id = $2`, [id, userId]);
      await pool.query(`UPDATE games SET likes = GREATEST(likes - 1, 0) WHERE id = $1`, [id]);
      userLiked = false;
    } else {
      // Currently disliked — switch to liked
      await pool.query(`UPDATE game_likes SET type = 'like', created_at = NOW() WHERE game_id = $1 AND user_id = $2`, [id, userId]);
      await pool.query(`UPDATE games SET likes = likes + 1, dislikes = GREATEST(dislikes - 1, 0) WHERE id = $1`, [id]);
      userLiked = true;
    }

    const gameResult = await pool.query(`SELECT likes, dislikes FROM games WHERE id = $1`, [id]);

    res.json({
      success: true,
      data: {
        likes: gameResult.rows[0]?.likes ?? 0,
        dislikes: gameResult.rows[0]?.dislikes ?? 0,
        userLiked,
        userDisliked,
      },
    });
  } catch (error) {
    console.error("Error toggling game like:", error);
    res.status(500).json({ success: false, message: "Failed to toggle like" });
  }
};

// POST /api/v1/games/:id/dislike
export const toggleGameDislike = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).userId;

    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const existing = await pool.query(
      `SELECT type FROM game_likes WHERE game_id = $1 AND user_id = $2`,
      [id, userId]
    );

    const userLiked = false;
    let userDisliked = false;

    if (existing.rows.length === 0) {
      // No existing reaction — add a dislike
      await pool.query(
        `INSERT INTO game_likes (user_id, game_id, type, created_at) VALUES ($1, $2, 'dislike', NOW())`,
        [userId, id]
      );
      await pool.query(`UPDATE games SET dislikes = dislikes + 1 WHERE id = $1`, [id]);
      userDisliked = true;
    } else if (existing.rows[0].type === "dislike") {
      // Already disliked — remove the reaction entirely
      await pool.query(`DELETE FROM game_likes WHERE game_id = $1 AND user_id = $2`, [id, userId]);
      await pool.query(`UPDATE games SET dislikes = GREATEST(dislikes - 1, 0) WHERE id = $1`, [id]);
      userDisliked = false;
    } else {
      // Currently liked — switch to disliked
      await pool.query(`UPDATE game_likes SET type = 'dislike', created_at = NOW() WHERE game_id = $1 AND user_id = $2`, [id, userId]);
      await pool.query(`UPDATE games SET dislikes = dislikes + 1, likes = GREATEST(likes - 1, 0) WHERE id = $1`, [id]);
      userDisliked = true;
    }

    const gameResult = await pool.query(`SELECT likes, dislikes FROM games WHERE id = $1`, [id]);

    res.json({
      success: true,
      data: {
        likes: gameResult.rows[0]?.likes ?? 0,
        dislikes: gameResult.rows[0]?.dislikes ?? 0,
        userLiked,
        userDisliked,
      },
    });
  } catch (error) {
    console.error("Error toggling game dislike:", error);
    res.status(500).json({ success: false, message: "Failed to toggle dislike" });
  }
};

// POST /api/v1/games/:id/favorite
export const toggleGameFavorite = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).userId;

    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const existing = await pool.query(
      `SELECT id FROM game_favorites WHERE "gameId" = $1 AND "userId" = $2`,
      [id, userId]
    );

    let userFavorited: boolean;

    if (existing.rows.length > 0) {
      await pool.query(`DELETE FROM game_favorites WHERE id = $1`, [existing.rows[0].id]);
      await pool.query(`UPDATE games SET favorites = GREATEST(favorites - 1, 0) WHERE id = $1`, [id]);
      userFavorited = false;
    } else {
      await pool.query(
        `INSERT INTO game_favorites (id, "userId", "gameId", "createdAt") VALUES (gen_random_uuid(), $1, $2, NOW())`,
        [userId, id]
      );
      await pool.query(`UPDATE games SET favorites = favorites + 1 WHERE id = $1`, [id]);
      userFavorited = true;
    }

    const gameResult = await pool.query(`SELECT favorites FROM games WHERE id = $1`, [id]);

    res.json({
      success: true,
      data: {
        favorites: gameResult.rows[0]?.favorites ?? 0,
        userFavorited,
      },
    });
  } catch (error) {
    console.error("Error toggling game favorite:", error);
    res.status(500).json({ success: false, message: "Failed to toggle favorite" });
  }
};

// GET /api/v1/games/favorites/:userId
export const getUserFavoriteGames = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const gamesResult = await pool.query(
      `SELECT g.id, g.title, g.description, g."thumbnailUrl", g."iconUrl",
              g."creatorId", g."groupId", g.genre, g.tags, g."ageRating",
              g."maxPlayers", g."isPublished", g.visits, g.likes, g.dislikes, g.favorites,
              g."currentPlayers", g.is_sponsored, g.sponsored_until, g.sponsor_bid,
              g."createdAt", g."updatedAt", g."placeId"
       FROM game_favorites gf
       JOIN games g ON g.id = gf."gameId"
       WHERE gf."userId" = $1
       ORDER BY gf."createdAt" DESC`,
      [userId]
    );

    res.json({
      success: true,
      data: { games: gamesResult.rows },
    });
  } catch (error) {
    console.error("Error fetching user favorite games:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch favorite games",
    });
  }
};

// GET /api/v1/games/summaries?ids=a,b,c
// Title, icon and place id for up to 50 games, so a client that only knows game ids (the presence map carries just the id
// of the game a user is in) can show the game's icon and name. Only published games are returned.
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_SUMMARY_IDS = 50;

export const getGameSummaries = async (req: Request, res: Response) => {
  try {
    const raw = typeof req.query.ids === "string" ? req.query.ids : "";
    const ids = Array.from(new Set(raw.split(",").map((s) => s.trim()).filter((s) => UUID_PATTERN.test(s)))).slice(0, MAX_SUMMARY_IDS);
    if (ids.length === 0) {
      res.json({ success: true, data: { games: [] } });
      return;
    }

    const result = await pool.query(
      `SELECT id, title, "iconUrl", "thumbnailUrl", "placeId"
       FROM games
       WHERE id::text = ANY($1::text[]) AND "isPublished" = true`,
      [ids]
    );

    res.set("Cache-Control", "public, s-maxage=60, stale-while-revalidate=120");
    res.json({ success: true, data: { games: result.rows } });
  } catch (error) {
    console.error("Error fetching game summaries:", error);
    res.status(500).json({ success: false, message: "Failed to fetch games" });
  }
};

// POST /api/v1/games/:id/play
export const recordGamePlay = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).userId;

    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    await pool.query(
      `INSERT INTO game_plays (id, user_id, game_id, played_at) VALUES (gen_random_uuid(), $1, $2, NOW())`,
      [userId, id]
    );

    res.json({ success: true });
  } catch (error) {
    console.error("Error recording game play:", error);
    res.status(500).json({
      success: false,
      message: "Failed to record game play",
    });
  }
};

// GET /api/v1/games/recently-played/:userId
export const getUserRecentlyPlayed = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const gamesResult = await pool.query(
      `SELECT g.id, g.title, g.description, g."thumbnailUrl", g."iconUrl",
              g."creatorId", g."groupId", g.genre, g.tags, g."ageRating",
              g."maxPlayers", g."isPublished", g.visits, g.likes, g.dislikes, g.favorites,
              g."currentPlayers", g.is_sponsored, g.sponsored_until, g.sponsor_bid,
              g."createdAt", g."updatedAt", g."placeId", gp.last_played_at
       FROM (
         SELECT DISTINCT ON (game_id) game_id, played_at AS last_played_at
         FROM game_plays
         WHERE user_id = $1
         ORDER BY game_id, played_at DESC
       ) gp
       JOIN games g ON g.id::text = gp.game_id
       ORDER BY gp.last_played_at DESC
       LIMIT 10`,
      [userId]
    );

    res.json({
      success: true,
      data: { games: gamesResult.rows },
    });
  } catch (error) {
    console.error("Error fetching recently played games:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch recently played games",
    });
  }
};

// GET /api/v1/games/group/:groupId
export const getGamesByGroup = async (req: Request, res: Response) => {
  try {
    const { groupId } = req.params;

    const result = await pool.query(
      `SELECT id, title, description, "thumbnailUrl", "iconUrl",
              "creatorId", "groupId", genre, tags, "ageRating",
              "maxPlayers", "isPublished", visits, likes, dislikes, favorites,
              "currentPlayers", is_sponsored, sponsored_until, sponsor_bid,
              "createdAt", "updatedAt", "placeId"
       FROM games
       WHERE "groupId" = $1 AND "isPublished" = true
       ORDER BY "createdAt" DESC`,
      [groupId]
    );

    res.json({
      success: true,
      data: { games: result.rows },
    });
  } catch (error) {
    console.error("Error fetching games by group:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch games",
    });
  }
};

// GET /api/v1/games/user/:userId
export const getGamesByUser = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const result = await pool.query(
      `SELECT id, title, description, "thumbnailUrl", "iconUrl",
              "creatorId", "groupId", genre, tags, "ageRating",
              "maxPlayers", "isPublished", visits, likes, favorites,
              "currentPlayers", is_sponsored, sponsored_until, sponsor_bid,
              "createdAt", "updatedAt"
       FROM games
       WHERE "creatorId" = $1 AND "isPublished" = true
       ORDER BY "createdAt" DESC`,
      [userId]
    );

    res.json({
      success: true,
      data: { games: result.rows },
    });
  } catch (error) {
    console.error("Error fetching games by user:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch games",
    });
  }
};

// POST /api/v1/games/publish
export const publishGame = async (req: Request, res: Response) => {
  try {
    const { title, description, thumbnailUrl, iconUrl, genre, maxPlayers, groupId, universeId, placeId } = req.body;
    const creatorId = (req as any).userId;

    if (!title) {
      res.status(400).json({
        success: false,
        message: "Title is required",
      });
      return;
    }

    if (typeof title !== "string" || checkName(title).hit) {
      res.status(400).json({
        success: false,
        message: "Game title contains disallowed words",
      });
      return;
    }

    const result = await pool.query(
      `INSERT INTO games (id, title, description, "thumbnailUrl", "iconUrl", "creatorId", "groupId", genre, "maxPlayers", "universeId", "placeId", "isPublished", "createdAt", "updatedAt")
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, true, NOW(), NOW())
       RETURNING *`,
      [title, description, thumbnailUrl, iconUrl, creatorId, groupId || null, genre, maxPlayers || 10, universeId || null, placeId || null]
    );

    res.status(201).json({
      success: true,
      data: { game: result.rows[0] },
    });
  } catch (error) {
    console.error("Error publishing game:", error);
    res.status(500).json({
      success: false,
      message: "Failed to publish game",
    });
  }
};

// POST /api/v1/games/publish-by-place-id
export const publishGameByPlaceId = async (req: Request, res: Response) => {
  try {
    const { universeId, genre, maxPlayers } = req.body;
    const creatorId = (req as any).userId;

    if (!universeId) {
      res.status(400).json({
        success: false,
        message: "universeId is required",
      });
      return;
    }

    const robloxData = await fetchRobloxGameData(parseInt(universeId));

    if (!robloxData) {
      res.status(400).json({
        success: false,
        message: "Could not fetch game data from Roblox. Make sure the universeId is correct and the game is public.",
      });
      return;
    }

    if (checkName(String(robloxData.name || "")).hit) {
      res.status(400).json({
        success: false,
        message: "This game's title contains disallowed words",
      });
      return;
    }

    const result = await pool.query(
      `INSERT INTO games (id, title, description, "thumbnailUrl", "creatorId", genre, "maxPlayers", "universeId", "placeId", "isPublished", visits, "currentPlayers", favorites, "createdAt", "updatedAt", "publishedAt")
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, true, $9, $10, $11, NOW(), NOW(), NOW())
       RETURNING *`,
      [
        robloxData.name,
        robloxData.description,
        robloxData.thumbnailUrl,
        creatorId,
        genre || "All",
        maxPlayers || 10,
        parseInt(universeId),
        robloxData.rootPlaceId,
        robloxData.visits,
        robloxData.playing,
        robloxData.favoritedCount,
      ]
    );

    res.status(201).json({
      success: true,
      data: { game: result.rows[0] },
    });
  } catch (error) {
    console.error("Error publishing game by place ID:", error);
    res.status(500).json({
      success: false,
      message: "Failed to publish game",
    });
  }
};

// GET /api/v1/games/my-games
export const getMyGames = async (req: Request, res: Response) => {
  try {
    const creatorId = (req as any).userId;
    if (!creatorId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const result = await pool.query(
      `SELECT id, title, description, "thumbnailUrl", "iconUrl",
              genre, "maxPlayers", "isPublished", visits, likes,
              favorites, "currentPlayers", is_sponsored, sponsor_bid,
              "createdAt", "updatedAt"
       FROM games
       WHERE "creatorId" = $1
       ORDER BY "createdAt" DESC`,
      [creatorId]
    );

    return res.json({
      success: true,
      data: { games: result.rows },
    });
  } catch (error) {
    console.error("Error fetching my games:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch games" });
  }
};

// GET /api/v1/games/:id/comments
export const getGameComments = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const commentsResult = await pool.query(
      `SELECT
         c.id,
         c.content,
         c.created_at,
         c.user_id as author_id,
         u.username as author_username,
         u."displayName" as author_display_name,
         u."isVerified" as author_is_verified
       FROM game_comments c
       LEFT JOIN users u ON c.user_id = u.id
       WHERE c.game_id = $1
       ORDER BY c.created_at DESC`,
      [id]
    );

    const commentIds = commentsResult.rows.map((c) => c.id);
    const repliesByComment: Record<string, any[]> = {};

    if (commentIds.length > 0) {
      const repliesResult = await pool.query(
        `SELECT
           r.id,
           r.comment_id,
           r.content,
           r.created_at,
           r.user_id as author_id,
           u.username as author_username,
           u."displayName" as author_display_name,
           u."isVerified" as author_is_verified
         FROM game_comment_replies r
         LEFT JOIN users u ON r.user_id = u.id
         WHERE r.comment_id = ANY($1::uuid[])
         ORDER BY r.created_at ASC`,
        [commentIds]
      );

      for (const reply of repliesResult.rows) {
        if (!repliesByComment[reply.comment_id]) repliesByComment[reply.comment_id] = [];
        repliesByComment[reply.comment_id].push(reply);
      }
    }

    const comments = commentsResult.rows.map((c) => ({
      ...c,
      replies: repliesByComment[c.id] || [],
    }));

    res.json({ success: true, data: { comments } });
  } catch (error) {
    console.error("Error fetching game comments:", error);
    res.status(500).json({ success: false, message: "Failed to fetch comments" });
  }
};

// POST /api/v1/games/:id/comments
export const createGameComment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const userId = (req as any).userId;

    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    if (!content || typeof content !== "string" || !content.trim()) {
      res.status(400).json({ success: false, message: "Content is required" });
      return;
    }
    if (content.trim().length > 500) {
      res.status(400).json({ success: false, message: "Content cannot exceed 500 characters" });
      return;
    }

    // Bad words, links, e-mails and phone numbers become ####; the comment still goes through.
    const safeContent = maskText(content.trim());

    const result = await pool.query(
      `INSERT INTO game_comments (id, game_id, user_id, content, created_at)
       VALUES (gen_random_uuid(), $1, $2, $3, NOW())
       RETURNING id, content, created_at, user_id as author_id`,
      [id, userId, safeContent]
    );

    const userResult = await pool.query(
      `SELECT username, "displayName" as display_name, "isVerified" as is_verified FROM users WHERE id = $1`,
      [userId]
    );

    res.status(201).json({
      success: true,
      data: {
        comment: {
          ...result.rows[0],
          author_username: userResult.rows[0]?.username,
          author_display_name: userResult.rows[0]?.display_name,
          author_is_verified: userResult.rows[0]?.is_verified,
          replies: [],
        },
      },
    });
  } catch (error) {
    console.error("Error creating game comment:", error);
    res.status(500).json({ success: false, message: "Failed to create comment" });
  }
};

// POST /api/v1/games/:id/comments/:commentId/reply
export const replyToGameComment = async (req: Request, res: Response) => {
  try {
    const { commentId } = req.params;
    const { content } = req.body;
    const userId = (req as any).userId;

    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    if (!content || typeof content !== "string" || !content.trim()) {
      res.status(400).json({ success: false, message: "Content is required" });
      return;
    }
    if (content.trim().length > 500) {
      res.status(400).json({ success: false, message: "Content cannot exceed 500 characters" });
      return;
    }

    const commentCheck = await pool.query(`SELECT id FROM game_comments WHERE id = $1`, [commentId]);
    if (commentCheck.rows.length === 0) {
      res.status(404).json({ success: false, message: "Comment not found" });
      return;
    }

    // Bad words, links, e-mails and phone numbers become ####; the reply still goes through.
    const safeContent = maskText(content.trim());

    const result = await pool.query(
      `INSERT INTO game_comment_replies (id, comment_id, user_id, content, created_at)
       VALUES (gen_random_uuid(), $1, $2, $3, NOW())
       RETURNING id, content, created_at, user_id as author_id`,
      [commentId, userId, safeContent]
    );

    const userResult = await pool.query(
      `SELECT username, "displayName" as display_name, "isVerified" as is_verified FROM users WHERE id = $1`,
      [userId]
    );

    res.status(201).json({
      success: true,
      data: {
        reply: {
          ...result.rows[0],
          author_username: userResult.rows[0]?.username,
          author_display_name: userResult.rows[0]?.display_name,
          author_is_verified: userResult.rows[0]?.is_verified,
        },
      },
    });
  } catch (error) {
    console.error("Error replying to game comment:", error);
    res.status(500).json({ success: false, message: "Failed to reply to comment" });
  }
};

// DELETE /api/v1/games/:id/comments/:commentId
export const deleteGameComment = async (req: Request, res: Response) => {
  try {
    const { commentId } = req.params;
    const userId = (req as any).userId;

    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const commentCheck = await pool.query(`SELECT user_id FROM game_comments WHERE id = $1`, [commentId]);
    if (commentCheck.rows.length === 0) {
      res.status(404).json({ success: false, message: "Comment not found" });
      return;
    }

    if (commentCheck.rows[0].user_id !== userId) {
      res.status(403).json({ success: false, message: "You can only delete your own comments" });
      return;
    }

    await pool.query(`DELETE FROM game_comment_replies WHERE comment_id = $1`, [commentId]);
    await pool.query(`DELETE FROM game_comments WHERE id = $1`, [commentId]);

    res.json({ success: true, message: "Comment deleted successfully" });
  } catch (error) {
    console.error("Error deleting game comment:", error);
    res.status(500).json({ success: false, message: "Failed to delete comment" });
  }
};

// DELETE /api/v1/games/:id/comments/:commentId/replies/:replyId
export const deleteGameCommentReply = async (req: Request, res: Response) => {
  try {
    const { replyId } = req.params;
    const userId = (req as any).userId;

    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const replyCheck = await pool.query(`SELECT user_id FROM game_comment_replies WHERE id = $1`, [replyId]);
    if (replyCheck.rows.length === 0) {
      res.status(404).json({ success: false, message: "Reply not found" });
      return;
    }

    if (replyCheck.rows[0].user_id !== userId) {
      res.status(403).json({ success: false, message: "You can only delete your own replies" });
      return;
    }

    await pool.query(`DELETE FROM game_comment_replies WHERE id = $1`, [replyId]);

    res.json({ success: true, message: "Reply deleted successfully" });
  } catch (error) {
    console.error("Error deleting game comment reply:", error);
    res.status(500).json({ success: false, message: "Failed to delete reply" });
  }
};

// DELETE /api/v1/games/:id
export const deleteGame = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).userId;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const gameCheck = await pool.query(
      `SELECT id, "creatorId" FROM games WHERE id = $1`,
      [id]
    );

    if (gameCheck.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Game not found" });
    }

    if (gameCheck.rows[0].creatorId !== userId) {
      return res.status(403).json({ success: false, message: "You can only delete your own games" });
    }

    await pool.query(`DELETE FROM games WHERE id = $1`, [id]);

    return res.json({ success: true, message: "Game deleted successfully" });
  } catch (error) {
    console.error("Error deleting game:", error);
    return res.status(500).json({ success: false, message: "Failed to delete game" });
  }
};

// GET /api/v1/games/:id/passes
export const getGamePasses = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT id, game_id, name, description, price, image_url, is_active, created_at, updated_at
       FROM game_passes
       WHERE game_id = $1 AND is_active = true
       ORDER BY created_at DESC`,
      [id]
    );

    return res.json({ success: true, data: { passes: result.rows } });
  } catch (error) {
    console.error("Error fetching game passes:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch game passes" });
  }
};

// POST /api/v1/games/:id/passes
export const createGamePass = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).userId;
    const { name, description, price, imageUrl } = req.body;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    if (!name?.trim()) {
      return res.status(400).json({ success: false, message: "Pass name is required" });
    }

    const parsedPrice = parseInt(price);
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      return res.status(400).json({ success: false, message: "Price must be a non-negative number" });
    }

    const gameCheck = await pool.query(
      `SELECT id, "creatorId" FROM games WHERE id = $1`,
      [id]
    );

    if (gameCheck.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Game not found" });
    }

    if (gameCheck.rows[0].creatorId !== userId) {
      return res.status(403).json({ success: false, message: "You can only add passes to your own games" });
    }

    const result = await pool.query(
      `INSERT INTO game_passes (id, game_id, name, description, price, image_url, is_active, created_at, updated_at)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, true, NOW(), NOW())
       RETURNING id, game_id, name, description, price, image_url, is_active, created_at, updated_at`,
      [id, name.trim(), description?.trim() || null, parsedPrice, imageUrl?.trim() || null]
    );

    return res.status(201).json({ success: true, data: { pass: result.rows[0] } });
  } catch (error) {
    console.error("Error creating game pass:", error);
    return res.status(500).json({ success: false, message: "Failed to create game pass" });
  }
};

// GET /api/v1/games/:id/servers
// Proxies Roblox's public servers API server-side — games.roblox.com doesn't
// send CORS headers, so the browser can't call it directly.
export const getGameServers = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const gameResult = await pool.query(
      `SELECT "placeId" FROM games WHERE id = $1`,
      [id]
    );

    if (gameResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Game not found" });
    }

    const placeId = gameResult.rows[0].placeId;
    if (!placeId) {
      return res.json({ success: true, data: { servers: [] } });
    }

    const robloxRes = await fetch(
      `https://games.roblox.com/v1/games/${placeId}/servers/Public?sortOrder=Asc&limit=10`
    );

    if (!robloxRes.ok) {
      return res.json({ success: true, data: { servers: [] } });
    }

    const robloxData = (await robloxRes.json()) as { data?: any[] };

    const servers = (robloxData.data || []).map((server) => ({
      id: server.id,
      playing: server.playing || 0,
      maxPlayers: server.maxPlayers || 0,
      fps: server.fps,
      ping: server.ping,
    }));

    return res.json({ success: true, data: { servers, placeId } });
  } catch (error) {
    console.error("Error fetching game servers:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch game servers" });
  }
};
