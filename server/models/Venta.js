import { Schema, model } from 'mongoose';

const itemVentaSchema = new Schema(
  {
    producto:       { type: Schema.Types.ObjectId, ref: 'Producto', required: true },
    cantidad:       { type: Number, required: true, min: 1 },
    // Precio al momento de la compra: si el producto cambia de precio, la venta no se altera
    precioUnitario: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const ventaSchema = new Schema(
  {
    usuario:   { type: Schema.Types.ObjectId, ref: 'Usuario', required: true },
    fecha:     { type: Date, default: Date.now },
    total:     { type: Number, required: true, min: 0 },
    direccion: { type: String, required: true, trim: true },
    pagado:    { type: Boolean, default: false },
    productos: { type: [itemVentaSchema], required: true },
  },
  { timestamps: true, versionKey: false }
);

export default model('Venta', ventaSchema);
