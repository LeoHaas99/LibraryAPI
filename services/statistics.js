const db = require('./db');
const helper = require('../helper');
const config = require('../config');

async function getYears(page = 1){
  const offset = helper.getOffset(page, config.listPerPage);
  const rows = await db.query(
    `SELECT Jahr, COUNT(*) AS Anzahl,
    SUM(Seitenzahl) AS TotalSeiten, 
    FLOOR(AVG(Seitenzahl)) AS Schnitt 
    FROM Buch
    group by jahr`
    
  );
  const data = helper.emptyOrRows(rows);
  const meta = {page};

  return {
    data,
    meta
  }
}

module.exports = {
    getYears
  }