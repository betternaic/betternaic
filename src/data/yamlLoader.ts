import * as yaml from 'js-yaml';
import servicesYaml from './services.yaml?raw';
import naicYaml from './naic.yaml?raw';
import placesYaml from './places.yaml?raw';
import hotlinesYaml from './hotlines.yaml?raw';
import officesYaml from './offices.yaml?raw';

export interface Subcategory {
  name: string;
  slug: string;
  description?: string;
}

export interface Category {
  category: string;
  slug: string;
  description: string;
  icon: string;
}

export interface CategoryIndex {
  title?: string;
  description?: string;
  layout: 'grid' | 'list';
  pages: Subcategory[];
}

// Every content/services/{slug}/index.yaml, picked up at build time, so a new
// category only needs its folder plus an entry in services.yaml.
const indexFiles = import.meta.glob('../../content/services/*/index.yaml', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

const categoryIndexMap: Record<string, string> = Object.fromEntries(
  Object.entries(indexFiles).map(([path, raw]) => [
    path.split('/').slice(-2)[0],
    raw,
  ])
);

export const serviceCategories = yaml.load(servicesYaml) as {
  categories: Category[];
};

export function getCategorySubcategories(slug: string): CategoryIndex {
  const raw = categoryIndexMap[slug];
  if (!raw) return { layout: 'list', pages: [] };
  const data = (yaml.load(raw) ?? {}) as Partial<CategoryIndex>;
  return {
    title: data.title,
    description: data.description,
    layout: data.layout ?? 'list',
    pages: data.pages ?? [],
  };
}

/* ---------- Naic data ---------- */

export interface Source {
  label: string;
  url: string;
}

export interface Official {
  position?: string;
  name: string;
  party?: string;
  note?: string;
}

export interface Barangay {
  name: string;
  pop2015: number;
  pop2020: number;
  poblacion?: boolean;
  alias?: string;
}

export interface NaicData {
  profile: {
    name: string;
    officialName: string;
    localName: string;
    province: string;
    region: string;
    district: string;
    incomeClass: string;
    barangays: number;
    landAreaKm2: number;
    zipCode: string;
    psgc: string;
    coordinates: { lat: number; lng: number };
    fiesta: string;
    coast: string;
    neighbors: { name: string; direction: string }[];
    distances: { to: string; km: number }[];
  };
  population: { year: number; count: number }[];
  populationSource: Source;
  officials: {
    term: string;
    source: Source;
    executive: Official[];
    councilors: Official[];
    exOfficio: Official[];
    congress: Official;
  };
  barangaysSource: Source;
  barangays: Barangay[];
  floodAffected2018: string[];
  floodSource: Source;
  history: { source: Source; events: { year: string; text: string }[] };
}

export interface Credit {
  author: string;
  license: string;
  url: string;
}

export interface Place {
  slug: string;
  name: string;
  kind: string;
  location: string;
  description: string;
  photo: string;
  credit: Credit | null;
}

export interface Photo {
  src: string;
  alt: string;
  credit: Credit;
}

export interface PlacesData {
  places: Place[];
  heroPhoto: Photo;
  markerPhoto: Photo;
  gettingThere: { mode: string; text: string }[];
}

export interface Hotline {
  name: string;
  number: string;
  tel: string;
  note: string;
  source?: string;
}

export interface HotlinesData {
  national: Hotline[];
  facilities: { name: string; kind: string; address: string; source: string }[];
  preparedness: Record<'before' | 'during' | 'after' | 'goBag', string[]>;
}

export interface Office {
  name: string;
  short: string;
  handles: string[];
  services: string[];
}

export const naic = yaml.load(naicYaml) as NaicData;
export const places = yaml.load(placesYaml) as PlacesData;
export const hotlines = yaml.load(hotlinesYaml) as HotlinesData;
export const offices = (yaml.load(officesYaml) as { offices: Office[] })
  .offices;

export const latestPopulation = naic.population[naic.population.length - 1];
