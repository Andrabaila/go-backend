import {
  Prop,
  Schema,
  SchemaFactory,
  type SchemaOptions,
} from '@nestjs/mongoose';
import { Document } from 'mongoose';

const schemaOptions: SchemaOptions = { timestamps: true }; // или {}

@Schema(schemaOptions)
export class Player extends Document {
  @Prop({ required: true })
  username: string | undefined;

  @Prop({ default: 0 })
  balance: number | undefined;

  @Prop({ type: Array, default: [] })
  exploredAreas:
    | {
        type: 'Polygon' | 'Point';
        coordinates: number[][] | number[];
      }[]
    | undefined;

  @Prop({ type: Array, default: [] })
  artifactsCollected: string[] | undefined;
}

export const PlayerSchema = SchemaFactory.createForClass(Player);
