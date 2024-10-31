export interface Job  {
    title: string;
    location: string;
    datePosted: Date;
    experienceLevel: string;
    company: string;
    description: string;
    url: string ;
  }

export interface AutoJob {
    autoTitle: string,
    autoLocation: string,
    autoDatePosted: number,
}

// API
export interface AddJobApi{
    message: string;
    success: boolean;
    joblist: Job[] | null;
    
}

export interface AutoJobApi{
    message: string;
    success: boolean;    
}