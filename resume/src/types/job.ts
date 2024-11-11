export interface AddJobForm {
  title: string;
  company: string;
  location: string;
  datePosted: Date;
  experienceLevel: string;
  description: string;
  url: string;
}

export interface Job {
  _id: string;
  title: string;
  company: string;
  location: string;
  datePosted: Date;
  experienceLevel: string;
  description: string;
  url: string;
}

// export interface SearchResult {
//   jobs: Job[];
//   totalJobs: number;
// }


export interface AutoJob {
  title: string;
  location: string;
  country_code: string;
  datePosted: number;
  max_result_wanted: number;
}

// API
export interface AddJobApi {
  message: string;
  success: boolean;
  joblist: Job[];
}

export interface AutoJobApi {
  message: string;
  success: boolean;
  joblist: Job[];
}

export interface searchJobApi {
  message: string;
  success: boolean;
  data: {
    joblists: Job[];
    totalJoblists: number;
  };
}



export interface searchlocationFeature {
  datasource: {
    sourcename: string;
    attribution: string;
    license: string;
    url: string;
  };
  old_name?: string;
  country: string;
  country_code: string;
  state?: string;
  state_code?: string;
  county?: string;
  city: string;
  lon: number;
  lat: number;
  result_type: string;
  formatted: string;
  address_line1: string;
  address_line2: string;
  category: string;
  timezone: {
    name: string;
    offset_STD: string;
    offset_STD_seconds: number;
    offset_DST?: string;
    offset_DST_seconds?: number;
    abbreviation_STD?: string;
    abbreviation_DST?: string;
  };
  plus_code?: string;
  plus_code_short?: string;
  rank: {
    importance: number;
    popularity: number;
    confidence: number;
    confidence_city_level?: number;
    match_type?: string;
  };
  place_id: string;
}
export interface Feature {
  type: string;
  properties: searchlocationFeature;
  geometry: {
    type: string;
    coordinates: [number, number];
  };
  bbox?: [number, number, number, number];
}