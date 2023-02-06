const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "cricketMatchDetails.db");
let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("server is running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
  }
};

initializeDbAndServer();

const convertPlayerDbObjectToResponseObject = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  };
};

const convertMatchDbObjectToResponseObject = (dbObject) => {
  return {
    MatchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  };
};

const convertPlayerMatchScoreDbObjectToResponseObject = (dbObject) => {
  return {
    playerMatchId: dbObject.player_match_id,
    playerId: dbObject.player_id,
    matchId: dbObject.match_id,
    score: dbObject.score,
    fours: dbObject.fours,
    sixes: dbObject.sixes,
  };
};

app.get("/players/", async (request, response) => {
  const getQuery = `SELECT * FROM player_details`;
  const result = await db.all(getQuery);
  response.send(
    result.map((eachPlayer) =>
      convertPlayerDbObjectToResponseObject(eachPlayer)
    )
  );
});

app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getQuery = `
  SELECT * FROM Player_details WHERE player_id=${playerId}`;
  const result = await db.get(getQuery);
  response.send(convertPlayerDbObjectToResponseObject(result));
});

app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;
  const updateQuery = `
  UPDATE player_details SET player_name=${playerName} WHERE player_id =${playerId}`;
  await db.run(updateQuery);
  response.send("Player Details Updated");
});

app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getQuery = `
  SELECT * FROM match_details WHERE match_id=${matchId}`;
  const result = await db.get(getQuery);
  response.send(convertMatchDbObjectToResponseObject(result));
});

app.get("/players/:playerId/matches/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerMatchesQuery = `
    SELECT
      *
    FROM player_match_score 
      NATURAL JOIN match_details
    WHERE
      player_id = ${playerId};`;
  const playerMatches = await db.all(getPlayerMatchesQuery);
  response.send(
    playerMatches.map((eachMatch) =>
      convertMatchDbObjectToResponseObject(eachMatch)
    )
  );
});

//6-----------------

app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getQuery = `
  SELECT
      *
    FROM player_match_score
      NATURAL JOIN player_details
    WHERE
      match_id = ${matchId};`;
  const result = await db.all(getQuery);
  response.send(
    result.map((eachPlayer) =>
      convertPlayerDbObjectToResponseObject(eachPlayer)
    )
  );
});

//7-------------------
app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const getQuery = `SELECT
      player_id AS playerId,
      player_name AS playerName,
      SUM(score) AS totalScore,
      SUM(fours) AS totalFours,
      SUM(sixes) AS totalSixes
    FROM player_match_score
      NATURAL JOIN player_details
    WHERE
      player_id = ${playerId};`;
  const result = await db.get(getQuery);
  response.send(result);
});

module.exports = app;
