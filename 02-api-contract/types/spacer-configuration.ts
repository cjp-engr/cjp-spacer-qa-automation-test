export interface SpacerConfiguration {
  id: number;
  listing_id: number;
  name: string;
  unit_type: string;
  building_type: string;
  reservation_type: string;
  stacker_type: string | null;
  ev: boolean;
  height_restriction: string | null;
  level: number | null;
  level_type: string | null;
  car_width: string | number | null;
  car_length: string | number | null;
  car_size: string | null;
  entrance_height: string | number | null;
  stairs_access: boolean;
  tricky_access: boolean;
  created_at: string;
  updated_at: string;
}

export interface ApiErrorResponse {
  error: string;
  error_description?: string;
}