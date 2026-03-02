export interface Coordinates {
    lat: number;
    lng: number;
}
export interface Bounds {
    north: number;
    south: number;
    east: number;
    west: number;
}
export interface Player {
    id: string;
    level: number;
    experience: number;
    experienceToNextLevel: number;
    gold: number;
}
export interface BaseQuest {
    id: string;
    title: string;
    description: string;
    reward: {
        gold: number;
        experience: number;
    };
    isCompleted: boolean;
}
export type Quest = BaseQuest;
