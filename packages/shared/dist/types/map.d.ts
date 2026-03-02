import type { FeatureCollection, Geometry } from 'geojson';
import type { Goin } from './game';
export interface MapFeatureProperties {
    name: string;
    type: string;
}
export type MapFeatureCollection = FeatureCollection<Geometry, MapFeatureProperties>;
export interface MapGoin extends Goin {
    lat: number;
    lng: number;
}
export type TileStatus = 'discovered' | 'visited' | 'fully_explored';
export type TileKey = `${number}_${number}`;
