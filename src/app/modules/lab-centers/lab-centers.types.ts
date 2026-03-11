export interface ILabCenter {
  id: string;
  name: string;
  address: string;
  phone: string | null;
  email: string | null;
  website: string | null;
  type: string;
  hours: string | null;
  status: string;
  latitude: number;
  longitude: number;
  rating: number;
  reviewCount: number;
  isActive: boolean;
  lastVerified: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ILabCenterWithDistance extends ILabCenter {
  distance: number;
}

export interface ILabCenterQuery {
  lat?: string;
  lng?: string;
  radius?: string;
  search?: string;
  type?: string;
  status?: string;
  isActive?: string;
}

export interface ICreateLabCenter {
  name: string;
  address: string;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  type: string;
  hours?: string | null;
  status?: string;
  latitude: number;
  longitude: number;
  rating?: number;
  reviewCount?: number;
  isActive?: boolean;
}

export interface IUpdateLabCenter extends Partial<ICreateLabCenter> {
  lastVerified?: Date | string;
}

export interface IGeocodeRequest {
  address: string;
}

export interface IGeocodeResponse {
  latitude: number;
  longitude: number;
  formattedAddress: string;
}
