export default {
  name: 'groupParticipantsUpdate',
  execute: async (sock, config, data) => {
    const { groupJid, participants, action } = data;

    if (action === 'add') {
      const welcomeMessage = `Welcome to the group, @${participants[0].split('@')[0]}!`;
      await sock.sendMessage(groupJid, { text: welcomeMessage, mentions: [participants[0]] });
    } else if (action === 'remove') {
      const goodbyeMessage = `@${participants[0].split('@')[0]} has left the group.`;
      await sock.sendMessage(groupJid, { text: goodbyeMessage, mentions: [participants[0]] });
    }
  },
};