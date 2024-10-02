export interface HorseInfo {
    lifeNumber?: string;
    dateOfBirth?: string;
    microchipNumber?: string;
    dnaTyped?: string;
    name?: string;
    austId?: string;
    pedigreeTree?: {
        horse?: {
            name: string;
            id: string;
        };
        father?: {
            name: string;
            id: string;
        };
        mother?: {
            name: string;
            id: string;
        };
    }[];
}
