import mongoose from 'mongoose';

export default {
  connect: async () => {
    await mongoose.connect(process.env.DATABASE_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  },

  User: mongoose.model('User', {
    id: String,
    name: String,
  }),
};