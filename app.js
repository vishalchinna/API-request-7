const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
const dbPath = path.join(__dirname, "cricketMatchDetails.db");
app.use(express.json());
let db = null;

const intitilizerDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server started");
    });
  } catch (e) {
    console.log(`Error : ${e.message}`);
    process.exit(1);
  }
};
intitilizerDbAndServer();

const convertDbObjectToResponseObject = (object) => {
  return {
    playerId: object.player_id,
    playerName: object.player_name,
    matchId: object.match_id,
    match: object.match,
    year: object.year,
    playerMatchId: object.player_match_id,
    score: object.score,
    fours: object.fours,
    sixes: object.sixes,
  };
};

// API 1
app.get("/players/", async (request, response) => {
  const getPlayerQuery = `
SELECT * FROM player_details
`;
  const playerArray = await db.all(getPlayerQuery);
  response.send(
    playerArray.map((each) => convertDbObjectToResponseObject(each))
  );
});

//API 2
app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const playerQuery = `
    select * from player_details
    where player_id = ${playerId}
    `;
  const player = await db.get(playerQuery);
  response.send(convertDbObjectToResponseObject(player));
});

//API 3
app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;
  const getPlayer = `
    UPDATE player_details SET 
    player_name = '${playerName}'
    WHERE player_id = ${playerId}
  `;
  await db.run(getPlayer);
  response.send("Player Details Updated");
});

// API 4
app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const matchQuery = `
    SELECT * FROM match_details 
    WHERE match_id = ${matchId} 
    `;
  const match = await db.get(matchQuery);
  response.send(convertDbObjectToResponseObject(match));
});

// API 5
app.get("/players/:playerId/matches/", async (request, response) => {
  const { playerId } = request.params;
  const playerQuery = `
  SELECT match_id,match,year FROM player_match_score NATURAL JOIN match_details 
  WHERE player_id = ${playerId}
  `;
  const playerArray = await db.all(playerQuery);
  console.log(playerArray);
  response.send(
    playerArray.map((each) => convertDbObjectToResponseObject(each))
  );
});

// API 6
app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const totalScoreQuery = `
    SELECT player_details.player_id,
    player_details.player_name
    FROM player_details NATURAL JOIN player_match_score
    WHERE match_id = ${matchId}
    `;
  const scoreArray = await db.all(totalScoreQuery);
  console.log(scoreArray);
  response.send(
    scoreArray.map((each) => convertDbObjectToResponseObject(each))
  );
});

// API 7
app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const scoreQuery = `
    SELECT
     player_id as playerId,
    player_name as playerName,
    SUM(score) as totalScore,
    SUM(fours) as totalFours,
    SUM(sixes) as totalSixes
    FROM
    player_details NATURAL JOIN player_match_score
    WHERE player_id = ${playerId}
    `;
  const scoreArray = await db.get(scoreQuery);
  console.log(scoreArray);
  response.send(scoreArray);
});

module.exports = app;
