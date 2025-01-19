module.exports = {
  config: {
    name: 'ping',
    description: 'Replies with "Pong!"',
    usage: ['!ping'],
    category: 'general',
  },
  run: async (sock, message) => {
    await sock.sendMessage(message.key.remoteJid, { text: 'Pong!' });
  },
};