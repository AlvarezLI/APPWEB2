import mongoose from 'mongoose';

export async function conectarDB(uri) {
  await mongoose.connect(uri);
  console.log(`MongoDB conectado a la base "${mongoose.connection.name}"`);
}
