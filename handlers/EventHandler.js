const fs = require('fs');
const path = require('path');

class EventHandler {
  constructor(sock, config) {
    this.sock = sock;
    this.config = config;
    this.events = {};
  }

  loadEvents() {
    const eventsDir = path.join(__dirname, '..', 'src', 'events');
    const files = fs.readdirSync(eventsDir);

    files.forEach((file) => {
      const filePath = path.join(eventsDir, file);
      const event = require(filePath);

      this.events[event.name] = event;
    });
  }

  handleEvent(eventName, ...args) {
    if (!this.events[eventName]) return;

    this.events[eventName].execute(this.sock, this.config, ...args);
  }
}

module.exports = EventHandler;