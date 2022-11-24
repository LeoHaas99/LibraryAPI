const db = require('./db');
const helper = require('../helper');
const config = require('../config');

async function getMultiple(page = 1){
  const offset = helper.getOffset(page, config.listPerPage);
  const rows = await db.query(
    `SELECT AutorId, Autor From Autor
    ORDER By Autor`,
    
  );
  const data = helper.emptyOrRows(rows);
  const meta = {page};

  return {
    data,
    meta
  }
}

async function getBookCount(page = 1){
  const offset = helper.getOffset(page, config.listPerPage);
  const rows = await db.query(
    `SELECT AutorId, Autor, Count(BuchId) as AnzahlBuecher,
    SUM(Seitenzahl) AS AnzahlSeiten, round(AVG(Seitenzahl)) AS Schnitt From Autor
    LEFT JOIN buch on autorid = fk_autorid
    Group by AutorId
    ORDER By AnzahlSeiten DESC
    LIMIT ? OFFSET ?`, [config.listPerPage, offset]
    
  );
  const data = helper.emptyOrRows(rows);
  const maxRows = await db.query(
    'Select count(*) as resultCount from Autor'
  )
  let pageCount = Math.ceil(maxRows[0].resultCount / config.listPerPage)
  const meta = {page,pageCount};

  return {
    data,
    meta
  }
}

async function getSingle(page = 1, autorId){
  const offset = helper.getOffset(page, config.listPerPage);
  const rows = await db.query(
    `SELECT AutorId, Autor, Count(BuchId) as AnzahlBuecher,
    SUM(Seitenzahl) AS AnzahlSeiten, round(AVG(Seitenzahl)) AS Schnitt From Autor
    LEFT JOIN buch on autorid = fk_autorid
    WHERE AutorId = ?
    Group by AutorId
    ORDER By AutorId`,[autorId]
    
  );
  const data = helper.emptyOrNot(rows);
  const meta = {page};

  return {
    data,
    meta
  }
}

async function getMultipleByFilter(page = 1, filter){
  const offset = helper.getOffset(page, config.listPerPage);
  const rows = await db.query(
    `SELECT AutorId, Autor, Count(BuchId) as AnzahlBuecher,
    SUM(Seitenzahl) AS AnzahlSeiten, Round(AVG(Seitenzahl)) AS Schnitt From Autor
    LEFT JOIN buch on autorid = fk_autorid
    WHERE Autor LIKE '%${filter}%'
    Group by AutorId
    ORDER By AutorId
    LIMIT ? OFFSET ?`, [config.listPerPage, offset]
    
  );
  const data = helper.emptyOrRows(rows);
  const maxRows = await db.query(
    'Select count(*) as resultCount from Autor'
  )
  let pageCount = Math.ceil(maxRows[0].resultCount / config.listPerPage)
  const meta = {page,pageCount};

  return {
    data,
    meta
  }
}

async function create(author) {
  const result = await db.query(
    `INSERT INTO Autor 
    (Autor) 
    VALUES 
    (?)`,
    [author.author]
  );

  let message = 'Error in creating author';

  if (result.affectedRows) {
    message = 'Author created successfully';
  }

  return { message };
}

async function remove(autorId) {
  const result = await db.query(
    `DELETE FROM autor WHERE AutorId=${autorId}`
  );

  let message = 'Error in deleting author';

  if (result.affectedRows) {
    message = 'Author deleted successfully';
  }

  return { message };
}

async function update(authorId, autor) {
  const result = await db.query(
    `UPDATE Autor 
    SET Autor = ?
    WHERE AutorId=?`, [autor, authorId]
  );

  let message = 'Error in updating circuit';

  if (result.affectedRows) {
    message = 'Circuit updated successfully';
  }

  return { message };
}

module.exports = {
  getMultiple,
  getBookCount,
  create,
  getMultipleByFilter,
  getSingle,
  remove,
  update
}