import { Request, Response } from "express";
import pool from "../../lib/db.js";
import { fetchRobloxGameData } from "./roblox.service.js";

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
    }

    const countQuery = `SELECT COUNT(*) FROM games ${whereClause}`;
    const countResult = await pool.query(countQuery, params);
    const totalItems = parseInt(countResult.rows[0].count);

    const gamesQuery = `
      SELECT id, title, description, "thumbnailUrl", "iconUrl",
             "creatorId", "groupId", genre, tags, "ageRating",
             "maxPlayers", "isPublished", visits, likes, favorites,
             "currentPlayers", "createdAt", "updatedAt"
      FROM games
      ${whereClause}
      ${orderClause}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    params.push(limitNum, offset);

    const gamesResult = await pool.query(gamesQuery, params);

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

// GET /api/v1/games/:id
export const getGameById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT id, title, description, "thumbnailUrl", "iconUrl",
              "creatorId", "groupId", genre, tags, "ageRating",
              "maxPlayers", "isPublished", visits, likes, favorites,
              "currentPlayers", "createdAt", "updatedAt"
       FROM games WHERE id = $1 AND "isPublished" = true`,
      [id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: "Game not found",
      });
      return;
    }

    res.json({
      success: true,
      data: { game: result.rows[0] },
    });
  } catch (error) {
    console.error("Error fetching game:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch game",
    });
  }
};

// POST /api/v1/games/publish
export const publishGame = async (req: Request, res: Response) => {
  try {
    const { title, description, thumbnailUrl, iconUrl, genre, maxPlayers } = req.body;
    const creatorId = (req as any).userId;

    if (!title) {
      res.status(400).json({
        success: false,
        message: "Title is required",
      });
      return;
    }

    const result = await pool.query(
      `INSERT INTO games (id, title, description, "thumbnailUrl", "iconUrl", "creatorId", genre, "maxPlayers", "isPublished", "createdAt", "updatedAt")
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, true, NOW(), NOW())
       RETURNING *`,
      [title, description, thumbnailUrl, iconUrl, creatorId, genre, maxPlayers || 10]
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

    const result = await pool.query(
      `INSERT INTO games (id, title, description, "thumbnailUrl", "creatorId", genre, "maxPlayers", "isPublished", visits, "currentPlayers", favorites, "createdAt", "updatedAt", "publishedAt")
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, true, $7, $8, $9, NOW(), NOW(), NOW())
       RETURNING *`,
      [
        robloxData.name,
        robloxData.description,
        robloxData.thumbnailUrl,
        creatorId,
        genre || "All",
        maxPlayers || 10,
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
