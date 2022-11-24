const db = require('./db');
const helper = require('../helper');
const config = require('../config');

async function getMultiple(page = 1){
  const offset = helper.getOffset(page, config.listPerPage);
  const rows = await db.query(
    `SELECT BuchId, Buchtitel, Autor, Seitenzahl, Jahr, BildUrl FROM buch
        JOIN autor ON autorid = fk_autorid
        ORDER BY BuchId`,
    
  );
  const data = helper.emptyOrRows(rows);
  const meta = {page};

  return {
    data,
    meta
  }
}

async function getLast(page = 1){
  const offset = helper.getOffset(page, config.listPerPage);
  const rows = await db.query(
    `SELECT BuchId, Buchtitel, Autor, Seitenzahl, Jahr, BildUrl FROM buch
        JOIN autor ON autorid = fk_autorid
        ORDER BY BuchId DESC LIMIT 1`
    
  );
  const data = helper.emptyOrRows(rows);
  const meta = {page};

  return {
    data,
    meta
  }
}

async function getSingle(id){
  const rows = await db.query(
    `SELECT BuchId, Buchtitel, AutorId, Autor, Seitenzahl, Jahr, BildUrl, SpracheId, Sprache FROM buch
        JOIN autor ON autorid = fk_autorid
        JOIN sprache ON fk_SpracheId = spracheId
        WHERE BuchId = ?`,[id]
    
  );
  const data = helper.emptyOrNot(rows);

  return {
    data
  }
}

async function getMultipleByFilter(page = 1, filter){
  const offset = helper.getOffset(page, config.listPerPage);
  const rows = await db.query(
    `SELECT BuchId, Buchtitel, AutorId,  Autor, Seitenzahl, Jahr, BildUrl FROM buch
        JOIN autor ON autorid = fk_autorid
        WHERE Buchtitel LIKE '%${filter}%' OR Autor LIKE '%${filter}%'
        ORDER BY BuchId`
    
  );
  const data = helper.emptyOrRows(rows);
  const meta = {page};

  return {
    data,
    meta
  }
}

async function create(book) {
  let d = new Date()
  let year = d.getFullYear()
  const result = await db.query(
    `INSERT INTO Buch 
    (Buchtitel, Seitenzahl, fk_SpracheId, Jahr, BildUrl, fk_AutorId) 
    VALUES 
    (?,?,?,?,?,?)`,
    [book.title, book.pages, book.language, year, book.image, book.author]
  );

  let message = 'Error in creating team';

  if (result.affectedRows) {
    message = 'Team created successfully';
  }

  return { message };
}

async function remove(bookId) {
  const result = await db.query(
    `DELETE FROM buch WHERE buchId=?`, [bookId]
  );

  let message = 'Error in deleting book';

  if (result.affectedRows) {
    message = 'Book deleted successfully';
  }

  return { message };
}

async function update(bookId, book) {
  const result = await db.query(
    `UPDATE buch 
    SET Buchtitel=?, fk_AutorId=?, fk_SpracheId=?, 
    Seitenzahl=?, BildUrl=? 
    WHERE BuchId=?`, [book.title, book.author, book.language, book.pages, book.image, bookId]
  );

  let message = 'Error in updating circuit';

  if (result.affectedRows) {
    message = 'Circuit updated successfully';
  }

  return { message };
}

module.exports = {
  getMultiple,
  getMultipleByFilter,
  create,
  getSingle,
  remove,
  update,
  getLast
}