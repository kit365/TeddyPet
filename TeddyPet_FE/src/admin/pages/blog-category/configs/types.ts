export interface IBlogCategory {
    id: number;
    title: string;
    image: string;
    parentName: string;
    view: number;
    createdAt: Date;
    status: 'active' | 'inactive';
}

export interface ISelectOption {
    value: string;
    label: string;
}
