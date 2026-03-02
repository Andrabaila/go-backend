export type Item = BaseItem | Goin | BackpackItem | Artefact;
export interface BaseItem {
    id: string;
    name: string;
    description?: string;
    weight: number;
    value: number;
    image?: string;
}
export interface Goin extends BaseItem {
    type: 'goin';
}
export interface BackpackItem extends BaseItem {
    type: 'backpackItem';
    quantity: number;
}
export interface Artefact extends BaseItem {
    type: 'artefact';
    quest: string;
}
