import { Schema, model } from 'mongoose';

export const CATEGORIAS = ['moda', 'electronica', 'hogar'];

const productoSchema = new Schema(
  {
    nombre:     { type: String, required: true, trim: true },
    desc:       { type: String, default: '' },
    precio:     { type: Number, required: true, min: 0 },
    imagen:     { type: String, default: '' },
    categoria:  { type: String, required: true, enum: CATEGORIAS },
    etiqueta:   { type: String, default: 'Colección' },
    stock:      { type: Number, default: 0, min: 0 },
    disponible: { type: Boolean, default: true },
  },
  { timestamps: true, versionKey: false }
);

export default model('Producto', productoSchema);
