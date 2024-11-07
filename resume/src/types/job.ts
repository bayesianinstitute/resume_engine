export interface AddJobForm {
    title: string;
    company: string;
    location: string;
    datePosted: Date;
    experienceLevel: string;
    description: string;
    url: string;
  }

export  interface Job {
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

export  interface Feature {
    properties: {
      city: string;
      country:string;
      country_code:string;
    };
  }
export interface AutoJob {
    title: string,
    location: string,
    datePosted: number,
    max_result_wanted: number,
}

// API
export interface AddJobApi{
    message: string;
    success: boolean;
    joblist: Job[] ;
    
}

export interface AutoJobApi{
    message: string;
    success: boolean;   
    joblist: Job[] ;

}

export interface searchJobApi{
  message: string;
  success: boolean;
  data: {
    joblists: Job[];
    totalJoblists: number;
  };
}