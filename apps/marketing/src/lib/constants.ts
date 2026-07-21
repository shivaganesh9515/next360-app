export interface Swatch {
  id: 'ORGANIC' | 'NATURAL' | 'ECO_FRIENDLY';
  label: string;
  texture: string;
  accent: string;
  tint: string;
  border: string;
}

export const SWATCHES: Swatch[] = [
  {
    id: 'ORGANIC',
    label: 'Organic',
    texture: 'swatch-moss',
    accent: '#5C6B4D',
    tint: '#EDF0E8',
    border: 'rgba(92,107,77,0.3)',
  },
  {
    id: 'NATURAL',
    label: 'Natural',
    texture: 'swatch-clay',
    accent: '#9B6A3F',
    tint: '#F4ECE3',
    border: 'rgba(155,106,63,0.3)',
  },
  {
    id: 'ECO_FRIENDLY',
    label: 'Eco-Friendly',
    texture: 'swatch-eucalyptus',
    accent: '#2F5D62',
    tint: '#E7EEEE',
    border: 'rgba(47,93,98,0.3)',
  },
];

export const DEFAULT_SWATCH = SWATCHES[0];
