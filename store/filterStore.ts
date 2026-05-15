import { create } from "zustand";

export interface FilterState {
  search: string;
  dateFrom: string;
  dateTo: string;
  vehicleType: string;
  area: string;
  fuelType: "gasolina" | "gasoleo" | "all";
  driverName: string;
  matricula: string;
  nMec: string;
  page: number;
  limit: number;
}

interface FilterStore extends FilterState {
  setFilter: <K extends keyof FilterState>(key: K, value: FilterState[K]) => void;
  setFilters: (filters: Partial<FilterState>) => void;
  resetFilters: () => void;
}

const defaultFilters: FilterState = {
  search: "",
  dateFrom: "",
  dateTo: "",
  vehicleType: "",
  area: "",
  fuelType: "all",
  driverName: "",
  matricula: "",
  nMec: "",
  page: 1,
  limit: 20,
};

export const useFilterStore = create<FilterStore>((set) => ({
  ...defaultFilters,
  setFilter: (key, value) =>
    set((state) => ({ ...state, [key]: value, page: key !== "page" ? 1 : (value as number) })),
  setFilters: (filters) =>
    set((state) => ({ ...state, ...filters, page: 1 })),
  resetFilters: () => set(defaultFilters),
}));
