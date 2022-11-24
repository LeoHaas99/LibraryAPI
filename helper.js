const crypto = require('crypto')

// to read the .env file
require('dotenv').config()

function respond(status, message, data) {
    let response = {
        status: status,
        body: {
            message: message
        }
    }

    if (data) response.body.data = data

    return response
}

// calculate the offset for pagination
function getOffset(currentPage = 1, listPerPage) {
    return (currentPage - 1) * [listPerPage]
}

/** 
* hashes a password with sha512 and a salt from .env variable "SALT"
* @param {string} password - A string containing the password
* @return {string} The sha512 hashed password.
*/
function hashPassword(password) {
    const hash = crypto.createHash('sha512')
    let data = hash.update(password + process.env.SALT, 'utf-8')
    return data.digest('base64')
}

// return an object with undefined values filled in by a fallback
function objectFallback(obj, fallback) {
    for (let key of Object.keys(fallback))
        if (obj[key] === undefined || obj[key] === null) obj[key] = fallback[key]
    return obj
}

  
  function emptyOrRows(rows) {
    if (!rows) {
      return [];
    }
    return rows;
  }

  function emptyOrNot(rows) {
    if (!rows) {
      return null;
    }
    return rows[0];
  }

  
  
  module.exports = {
    getOffset,
    hashPassword,
    respond,
    objectFallback,
    emptyOrRows,
    emptyOrNot
  }