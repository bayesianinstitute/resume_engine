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