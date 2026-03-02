import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class GameObject extends Document {
  @Prop({ required: true })
  name: string | undefined;

  @Prop({ required: true })
  type: string | undefined; // artifact / quest / info

  @Prop({ type: Object, required: true })
  location: { type: string; coordinates: number[] } | undefined; // GeoJSON Point

  @Prop({ default: 'global' })
  layer: string | undefined;

  @Prop({ default: true })
  collectible: boolean | undefined;
}

export const GameObjectSchema = SchemaFactory.createForClass(GameObject);
