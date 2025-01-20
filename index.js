import dotenv from 'dotenv';
import { makeWASocket, DisconnectReason, useMultiFileAuthState, BufferJSON, Browsers } from '@whiskeysockets/baileys';
import P from 'pino';
import figlet from 'figlet';
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import CommandHandler from './handlers/CommandHandler.js';
import EventHandler from './handlers/EventHandler.js';
import config from './config.js';
import { getSessionData } from './dbHelper.js';

const authDir = 'auth_info_baileys';
const dbFile = 'database.json';

if (!fs.existsSync(authDir)) {
  fs.mkdirSync(authDir);
}

if (!fs.existsSync(dbFile)) {
  fs.writeFileSync(dbFile, JSON.stringify({ sessions: {} }));
}

let sock;
let db = JSON.parse(fs.readFileSync(dbFile, 'utf8'));

const base64SessionId = 'eyJub2lzZUtleSI6eyJwcml2YXRlIjp7InR5cGUiOiJCdWZmZXIiLCJkYXRhIjoiQ0gvZTMzL0NtalJGNzNQcnRvd05jMGpkV21BKzN6SDFNYitjSmhUL1RuND0ifSwicHVibGljIjp7InR5cGUiOiJCdWZmZXIiLCJkYXRhIjoiMlBmbGFwbmxPOUpnaVpINjZJaGtBLzlXNlhzQ1haTEpnYVRkQjVjdnZHMD0ifX0sInBhaXJpbmdFcGhlbWVyYWxLZXlQYWlyIjp7InByaXZhdGUiOnsidHlwZSI6IkJ1ZmZlciIsImRhdGEiOiJXRmVnQzBsM0NnTFZ1dmxjUEh3TzgzS1RaQUtzcVFtWnAwbVFGdGRQeUhRPSJ9LCJwdWJsaWMiOnsidHlwZSI6IkJ1ZmZlciIsImRhdGEiOiJOcEg3Ni9YQ1lFNE9heXRCVEQrZldGb2JRODM3M21OQmFUT2pEeXdkNkcwPSJ9fSwic2lnbmVkSWRlbnRpdHlLZXkiOnsicHJpdmF0ZSI6eyJ0eXBlIjoiQnVmZmVyIiwiZGF0YSI6IjRBQ05TMHQ5MGVsb3lPTHppVU9nMnh3QlJIQ2tvYlFDMkM3bXAxR0hHR0k9In0sInB1YmxpYyI6eyJ0eXBlIjoiQnVmZmVyIiwiZGF0YSI6InI2M01OZGVaYUdEaGl3encwVmQ2U2dTSGVlamhNUDZQZGVYNThRTlEzazg9In19LCJzaWduZWRQcmVLZXkiOnsia2V5UGFpciI6eyJwcml2YXRlIjp7InR5cGUiOiJCdWZmZXIiLCJkYXRhIjoid09VQll4Y1ZPOGc1SlZmUmJPQVZzc3BKT0QzaVA5UWVPZnlnYWdDUSswUT0ifSwicHVibGljIjp7InR5cGUiOiJCdWZmZXIiLCJkYXRhIjoiRlVHazhRZkRQdEhXSFNTOEdtK0EwSlRnTVFaNU5yZzIzaDZXUXRTN2QzQT0ifX0sInNpZ25hdHVyZSI6eyJ0eXBlIjoiQnVmZmVyIiwiZGF0YSI6InBhVDFLQStvclQxb2hvMS9JakdmakdnYmhkVVFzczI2TDE2MVY3VHN6a2dRUEdmbWhPTS9oRGEwS1B2bUdNQnpZYzRLMXB2TUV3OHN3aDlSWlMxN0JBPT0ifSwia2V5SWQiOjF9LCJyZWdpc3RyYXRpb25JZCI6MTcyLCJhZHZTZWNyZXRLZXkiOiJCTmxGOHRESWpFWU1jS3NoMzZOSDFCNzFSNVZuSnhsK3F1anFFaml1MkJBPSIsInByb2Nlc3NlZEhpc3RvcnlNZXNzYWdlcyI6W3sia2V5Ijp7InJlbW90ZUppZCI6IjIzNDgxMjAzMDc4NzBAcy53aGF0c2FwcC5uZXQiLCJmcm9tTWUiOnRydWUsImlkIjoiN0YyRDY1QjExRkEzQjlCREQ4RjAyN0VFNTMwNkE3NDkifSwibWVzc2FnZVRpbWVzdGFtcCI6MTczNzM1Mzc4N30seyJrZXkiOnsicmVtb3RlSmlkIjoiMjM0ODEyMDMwNzg3MEBzLndoYXRzYXBwLm5ldCIsImZyb21NZSI6dHJ1ZSwiaWQiOiI4N0E5NjBEMTFFQ0E3NDZGRkEzNzYyNENFOTA4OTQ1MCJ9LCJtZXNzYWdlVGltZXN0YW1wIjoxNzM3MzUzNzg3fV0sIm5leHRQcmVLZXlJZCI6MzEsImZpcnN0VW51cGxvYWRlZFByZUtleUlkIjozMSwiYWNjb3VudFN5bmNDb3VudGVyIjoxLCJhY2NvdW50U2V0dGluZ3MiOnsidW5hcmNoaXZlQ2hhdHMiOmZhbHNlfSwiZGV2aWNlSWQiOiItbTY5bjFTRVNaLWM0Q3hIb1RRSVN3IiwicGhvbmVJZCI6Ijc3YmM2Yjc2LWZlNDQtNGI4Yi1iYWNiLTc2OGEyNjlhNTAwOCIsImlkZW50aXR5SWQiOnsidHlwZSI6IkJ1ZmZlciIsImRhdGEiOiJ3VUhZZGo0c2xmcmZMTDR2MW1DbTU5eVRFSk09In0sInJlZ2lzdGVyZWQiOnRydWUsImJhY2t1cFRva2VuIjp7InR5cGUiOiJCdWZmZXIiLCJkYXRhIjoiMFREQ2VXSTVlQXdEUXF1dEVCK29ibkNDRzJNPSJ9LCJyZWdpc3RyYXRpb24iOnt9LCJwYWlyaW5nQ29kZSI6IkpIUDdCNllZIiwibWUiOnsiaWQiOiIyMzQ4MTIwMzA3ODcwOjlAcy53aGF0c2FwcC5uZXQiLCJuYW1lIjoiQXN0YSJ9LCJhY2NvdW50Ijp7ImRldGFpbHMiOiJDSkwveXFnQkVLblV0N3dHR0FFZ0FDZ0EiLCJhY2NvdW50U2lnbmF0dXJlS2V5IjoienFsZ2F2dTRKOUtLN3ZseTV3cGVxQXVKOXFvRUpONVJacVhFMm5NckJSdz0iLCJhY2NvdW50U2lnbmF0dXJlIjoiQVl2UHlSNDRTVmQzRi83MGV6dlJ2WFFRRGdWZWlMeUhwUEpyQ3h6ZVUvWEZYNXhOV1JwUjNZeFVDa1RVYXU4S2VyaERuY3R6S2EzVDRFL3V3MC9SQWc9PSIsImRldmljZVNpZ25hdHVyZSI6InBiQnNqUU1lSGhFbUlIVzhqTmU3NzVqaWsrbHA3VXo3eTQ2YkFoR29MOHFFSUNSdjMrOXR2TE0yVmxtbE9Ybm4wVHVLclMyd3dLcFFDNEI3amgrWEJBPT0ifSwic2lnbmFsSWRlbnRpdGllcyI6W3siaWRlbnRpZmllciI6eyJuYW1lIjoiMjM0ODEyMDMwNzg3MDo5QHMud2hhdHNhcHAubmV0IiwiZGV2aWNlSWQiOjB9LCJpZGVudGlmaWVyS2V5Ijp7InR5cGUiOiJCdWZmZXIiLCJkYXRhIjoiQmM2cFlHcjd1Q2ZTaXU3NWN1Y0tYcWdMaWZhcUJDVGVVV2FseE5wekt3VWMifX1dLCJwbGF0Zm9ybSI6InNtYmEiLCJsYXN0QWNjb3VudFN5bmNUaW1lc3RhbXAiOjE3MzczNTM3ODMsIm15QXBwU3RhdGVLZXlJZCI6IkFBQUFBSXZEIn0='; // replace with your base64 session id

async function connectSocket() {
  try {
    const sessionId = Buffer.from(base64SessionId, 'base64').toString();
    const sessionData = await getSessionData(sessionId);
    if (!sessionData) {
      console.error('No session data found');
      return;
    }

    sock = makeWASocket({
      auth: { sessionId },
      printQRInTerminal: true,
      logger: P({ level: 'debug' }),
      browser: Browsers.appropriate('Chrome'),
    });
    

    sock.ev.on('connection.update', (update) => {
      const { connection, lastDisconnect } = update;
      if (connection === 'close') {
        const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
        if (shouldReconnect) {
          console.log('Reconnecting...');
          connectSocket();
        }
      }
    });

    sock.ev.on('open', async () => {
      console.log(chalk.green(figlet.textSync('ASTA BOT')));
      const commandDir = path.join(__dirname, 'src', 'commands');
      const eventDir = path.join(__dirname, 'src', 'events');
      const commandFiles = fs.readdirSync(commandDir);
      const eventFiles = fs.readdirSync(eventDir);
      let loadedCommands = 0;
      let failedCommands = 0;
      let loadedEvents = 0;
      let failedEvents = 0;

      commandFiles.forEach((file) => {
        try {
          import(path.join(commandDir, file));
          console.log(chalk.green(`Loaded ${file} successfully`));
          loadedCommands++;
        } catch (error) {
          console.log(chalk.red(`Failed to load ${file}: ${error.message}`));
          failedCommands++;
        }
      });

      eventFiles.forEach((file) => {
        try {
          import(path.join(eventDir, file));
          console.log(chalk.green(`Loaded ${file} successfully`));
          loadedEvents++;
        } catch (error) {
          console.log(chalk.red(`Failed to load ${file}: ${error.message}`));
          failedEvents++;
        }
      });

      console.log(chalk.green(`Loaded ${loadedCommands} commands successfully`));
      console.log(chalk.red(`Failed to load ${failedCommands} commands`));
      console.log(chalk.green(`Loaded ${loadedEvents} events successfully`));
      console.log(chalk.red(`Failed to load ${failedEvents} events`));

      const commandHandler = new CommandHandler(sock, config);
      const eventHandler = new EventHandler(sock, config);
      commandHandler.loadCommands();
      eventHandler.loadEvents();

      sock.ev.on('messages.upsert', (data) => {
        const { messages, type } = data;
        if (type === 'notify') {
          const msg = messages[0];
          const senderId = msg.key.remoteJid;
          const senderData = db.users[senderId];
          if (!senderData) {
            db.users[senderId] = {
              id: senderId,
              name: msg.pushName,
              messages: [],
            };
          }
          db.users[senderId].messages.push(msg);
          fs.writeFileSync(dbFile, JSON.stringify(db, null, 2));
          commandHandler.handleMessage(msg);
        }
      });

      sock.ev.on('group-participants.update', (data) => {
        eventHandler.handleEvent('groupParticipantsUpdate', data);
      });

      sock.ev.on('groups.update', (data) => {
        eventHandler.handleEvent('groupUpdate', data);
      });
    });
  } catch (error) {
    console.error('Error connecting to WhatsApp:', error);
  }
}

connectSocket();
