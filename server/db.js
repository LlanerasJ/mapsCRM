const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'crm.json');

const DEFAULTS = { companies: [], visits: [], _seq: { companies: 1, visits: 1 } };

function read() {
  try {
    return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
  } catch {
    return JSON.parse(JSON.stringify(DEFAULTS));
  }
}

function write(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

function nextId(data, table) {
  const id = data._seq[table];
  data._seq[table] = id + 1;
  return id;
}

module.exports = { read, write, nextId };
