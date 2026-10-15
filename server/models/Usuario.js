import { Schema, model } from 'mongoose';

const usuarioSchema = new Schema(
  {
    nombre:          { type: String, required: true, trim: true },
    apellido:        { type: String, required: true, trim: true },
    email:           { type: String, required: true, unique: true, lowercase: true, trim: true },
    // Se guarda encriptada con bcrypt y nunca se devuelve en las consultas (select: false)
    contraseña:      { type: String, required: true, select: false },
    fechaNacimiento: { type: Date },
    activo:          { type: Boolean, default: true },
  },
  { timestamps: true, versionKey: false }
);

export default model('Usuario', usuarioSchema);
