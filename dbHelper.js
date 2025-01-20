import fs from 'fs';
import path from 'path';

const dbFile = 'database.json';

if (!fs.existsSync(dbFile)) {
  fs.writeFileSync(dbFile, JSON.stringify({ sessions: {} }));
}

async function getSessionData(sessionId) {
  try {
    const data = fs.readFileSync(dbFile, 'utf8');
    const db = JSON.parse(data);
    return db.sessions[sessionId];
  } catch (error) {
    console.error('Error retrieving session data:', error);
    return null;
  }
}

async function saveSessionData(sessionId, data) {
  try {
    const db = JSON.parse(fs.readFileSync(dbFile, 'utf8'));
    db.sessions[sessionId] = data;
    fs.writeFileSync(dbFile, JSON.stringify(db, null, 2));
  } catch (error) {
    console.error('Error saving session data:', error);
  }
}

export { getSessionData, saveSessionData };