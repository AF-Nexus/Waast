module.exports = {
  name: 'groupUpdate',
  execute: async (sock, config, data) => {
    const { groupJid, participants, action } = data;

    if (action === 'add' && participants.includes(sock.user.id)) {
      const welcomeMessage = `Thank you for adding me to the group!`;
      await sock.sendMessage(groupJid, { text: welcomeMessage });

      // Notify bot admins
      const adminMessage = `Added to group: ${groupJid}`;
      config.adminIds.forEach((adminId) => {
        sock.sendMessage(adminId, { text: adminMessage });
      });
    } else if (action === 'remove' && participants.includes(sock.user.id)) {
      // Notify bot admins
      const adminMessage = `Kicked from group: ${groupJid}`;
      config.adminIds.forEach((adminId) => {
        sock.sendMessage(adminId, { text: adminMessage });
      });
    }
  },
};