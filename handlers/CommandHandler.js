const fs = require('fs');
const path = require('path');

class CommandHandler {
  constructor(sock, config) {
    this.sock = sock;
    this.config = config;
    this.commands = {};
  }

  loadCommands() {
    const commandsDir = path.join(__dirname, '..', 'src', 'commands');
    const files = fs.readdirSync(commandsDir);

    files.forEach((file) => {
      const filePath = path.join(commandsDir, file);
      const command = require(filePath);

      this.commands[command.config.name] = command;
    });
  }

  handleMessage(message) {
    const { body } = message;
    const prefix = this.config.prefix;
    const args = body.slice(prefix.length).trim().split(/ +/g);
    const commandName = args.shift().toLowerCase();

    if (!this.commands[commandName]) return;

    this.commands[commandName].run(this.sock, message, args);
  }
}

module.exports = CommandHandler;