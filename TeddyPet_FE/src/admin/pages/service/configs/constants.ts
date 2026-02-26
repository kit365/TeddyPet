/** Map enum value (DOG, CAT...) to Vietnamese display label */
export const PET_TYPE_LABELS: Record<string, string> = {
    DOG: 'Chó',
    CAT: 'Mèo',
};
export const getPetTypeLabel = (value: string) => PET_TYPE_LABELS[value] ?? value;

export const COLORS = {
    primary: '#1C252E',
    secondary: '#637381',
    border: '#919eab33',
    borderLight: 'rgba(145 158 171 / 20%)',
    borderMedium: 'rgba(145 158 171 / 40%)',
    background: '#fff',
    backgroundLight: '#F4F6F8',
    success: '#00A76F',
    disabled: '#919EAB',
    shadow: '0 0 2px 0 rgba(145 158 171 / 20%), 0 12px 24px -4px rgba(145 158 171 / 12%)',
};
