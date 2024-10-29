import { setupWebDriver, scrapeLinkedIn } from './linkedinService.js';

async function testLinkedInScraping() {
    // Initialize WebDriver
    const driver = await setupWebDriver();

    // Define test parameters
    const jobTitle = 'Software Engineer';
    const jobLocation = 'San Francisco, CA';
    const datePosted = 'week'; // Options: '24h', 'week', 'month'
    const experienceLevel = 'mid-senior'; // Options: 'internship', 'entry', 'associate', 'mid-senior', 'director', 'executive'

    // Define sendEvent function to handle each scraped job listing
    async function sendEvent(job) {
        console.log(`
            Company: ${job.company}
            Title: ${job.title}
            Location: ${job.location}
            URL: ${job.url}
            Description: ${job.description}
            Date Posted: ${job.datePosted}
            Experience Level: ${job.experienceLevel}
        `);
    }

    try {
        console.log(`Starting LinkedIn scraping for: ${jobTitle} in ${jobLocation}, Date Posted: ${datePosted}, Experience Level: ${experienceLevel}`);
        await scrapeLinkedIn(driver, jobTitle, jobLocation, datePosted, experienceLevel, sendEvent);
        console.log('Scraping completed successfully.');
    } catch (error) {
        console.error('An error occurred during scraping:', error);
    } finally {
        // Quit the WebDriver instance
        await driver.quit();
    }
}

// Execute the test function
testLinkedInScraping();
