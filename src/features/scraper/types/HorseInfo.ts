export interface HorseInfo {
    lifeNumber?: string;
    dateOfBirth?: string;
    microchipNumber?: string;
    dnaTyped?: string;
    name?: string;
    gender?: 'mare' | 'stallion';
    color?: string;
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
    family?: string;
    taproot?: { name: string; link: string; studbookId: number }; // Their shit
    foalRef?: string;
    taprootInfo?: {
        name: string;
        id: string;
    }; // Our shit
    logs: string[]
    bredBy?: string
    deceased?: string
}
