require('dotenv').config();

const { default: makeWASocket, DisconnectReason, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const P = require('pino');
const mongoose = require('mongoose');
const figlet = require('figlet');
const chalk = require('chalk');
const fs = require('fs');
const path = require('path');
const CommandHandler = require('./handlers/CommandHandler');
const EventHandler = require('./handlers/EventHandler');
const config = require('./src/config');

mongoose.connect(process.env.DATABASE_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;

db.on('error', (err) => {
  console.error(err);
});

db.once('open', () => {
  console.log('Connected to MongoDB');
});

const sessionId = process.env.SESSION_ID;
const decodedSessionId = Buffer.from(sessionId, 'base64').toString('utf-8');
const authState = useMultiFileAuthState('./session');
authState.state = JSON.parse(decodedSessionId);

const sock = makeWASocket({
  auth: authState,
  printQRInTerminal: true,
  logger: P({ level: 'silent' }),
});

sock.ev.on('connection.update', (update) => {
  const { connection, lastDisconnect } = update;
  if (connection === 'close') {
    const shouldReconnect = lastDisconnect.error.output.statusCode !== DisconnectReason.loggedOut;
    if (shouldReconnect) {
      console.log('Reconnecting...');
      sock.connect();
    }
  }
});

sock.ev.on('open', () => {
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
      require(path.join(commandDir, file));
      console.log(chalk.green(`Loaded ${file} successfully`));
      loadedCommands++;
    } catch (error) {
      console.log(chalk.red(`Failed to load ${file}: ${error.message}`));
      failedCommands++;
    }
  });

  eventFiles.forEach((file) => {
    try {
      require(path.join(eventDir, file));
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
      commandHandler.handleMessage(messages[0]);
    }
  });

  sock.ev.on('group-participants.update', (data) => {
    eventHandler.handleEvent('groupParticipantsUpdate', data);
  });

  sock.ev.on('groups.update', (data) => {
    eventHandler.handleEvent('groupUpdate', data);
  });
});