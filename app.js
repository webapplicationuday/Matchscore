const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "cricketMatchDetails.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

const convertDbObjectToResponseObject = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  };
};

const convertDbObjectToResponseObject2 = (dbObject) => {
  return {
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  };
};

const convertMatchDetailsDbObjectToResponseObject = (dbObject) => {
  return {
    playerId: dbObject.player_id,

    score: dbObject.score,
    fours: dbObject.fours,
    sixes: dbObject.sixes,
  };
};
app.get("/players/", async (request, response) => {
  const getPlayerQuery = `
 SELECT
 *
 FROM
 player_details;`;
  const playerArray = await db.all(getPlayerQuery);
  response.send(
    playerArray.map((eachState) => convertDbObjectToResponseObject(eachState))
  );
});

//// get playerId
app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getOnePlayerQuery = `
    SELECT
      *
    FROM
    player_details
    WHERE
      player_id = ${playerId};`;
  const player = await db.get(getOnePlayerQuery);
  response.send(convertDbObjectToResponseObject(player));
});

///update player

app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const playerDetails = request.body;
  const { playerName } = playerDetails;
  const updatePlayerQuery = `
    UPDATE
      player_details
    SET
      player_name='${playerName}'
    
      
     WHERE
      player_id = ${playerId};`;
  await db.run(updatePlayerQuery);
  response.send("Player Details Updated");
});

//// get matchId
app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getOneMatchQuery = `
    SELECT
      *
    FROM
    match_details
    WHERE
      match_id = ${matchId};`;
  const match = await db.get(getOneMatchQuery);
  response.send(convertDbObjectToResponseObject2(match));
});

/// Get matchPlayer

app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const getOneMatchQuery = `
    SELECT
      *
    FROM
    player_match_score 
    NATURAL JOIN 
    match_details
    WHERE
      player_id = ${playerId};`;
  const match = await db.all(getOneMatchQuery);
  response.send(
    match.map((eachMatch) => convertDbObjectToResponseObject2(eachMatch))
  );
});

//// Get all player specific match

app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getOneMatchQuery = `
    SELECT
    player_details.player_id,
    player_details.player_name
    from player_details
    NATURAL JOIN 
    player_match_score 
    WHERE
      match_id = ${matchId};`;
  const player = await db.all(getOneMatchQuery);
  response.send(
    player.map((eachMatch) => convertDbObjectToResponseObject(eachMatch))
  );
});

///// Get statistics

app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerScored = `
    SELECT
    player_details.player_id AS playerId,
    player_details.player_name AS playerName,
    SUM(player_match_score.score) AS totalScore,
    SUM(fours) AS totalFours,
    SUM(sixes) AS totalSixes FROM 
    player_details INNER JOIN player_match_score ON
    player_details.player_id = player_match_score.player_id
    WHERE 
    player_details.player_id = ${playerId};`;
  const player = await db.get(getPlayerScored);
  response.send(convertMatchDetailsDbObjectToResponseObject(player));
});

module.exports = app;
