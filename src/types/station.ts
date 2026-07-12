import type { Amphoe, Role } from "@prisma/client";

export interface StationType {
  id: string;
  name: string;
  icon: string;
  description: string | null;
}

export interface Station {
  id: string;
  station_code: string;
  station_name: string;
  station_type_id: string;
  station_type?: StationType;
  brand_id: string;
  brand?: {
    id: string;
    name: string;
    short_name: string;
    logo_url: string | null;
  };
  energy_types: string[];
  details: string | null;
  latitude: number;
  longitude: number;
  amphoe: Amphoe;
  tambon: string;
  address_details: string | null;
  image_url: string | null;
  google_map_url: string | null;
  created_at: string | Date;
  updated_at: string | Date;
}

export interface User {
  id: string;
  username: string;
  name: string;
  role: Role;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface SessionUser {
  id: string;
  username: string;
  name: string;
  role: Role;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface StationFilters {
  search?: string;
  amphoe?: Amphoe | "";
  energy_type?: string;
  page?: number;
  limit?: number;
}

export interface StatsData {
  total: number;
  oil: number;
  lpg: number;
  ngv: number;
  ev: number;
  byAmphoe: { amphoe: Amphoe; count: number }[];
}
