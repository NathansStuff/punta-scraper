export interface PedigreeTreeNode {
    name: string;
    link: string;
}

export interface PedigreeTree {
    horse: PedigreeTreeNode;
    father: PedigreeTreeNode;
    mother: PedigreeTreeNode;
}
