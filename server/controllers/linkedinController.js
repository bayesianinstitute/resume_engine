import { setupWebDriver, scrapeLinkedIn } from "../services/linkedinService.js";

async function getLinkedInJobs(req, res) {
    const { jobTitle, jobLocation } = req.body;
    if (!jobTitle || !jobLocation) {
        return res.status(400).send('Missing required parameters');
    }

    const driver = await setupWebDriver();
    try {
        const results = await scrapeLinkedIn(driver, jobTitle, jobLocation);
        res.json(results);
    } catch (error) {
        console.error('Error in scraping process:', error);
        res.status(500).send('An error occurred during the scraping process');
    } finally {
        await driver.quit();
    }
}

export { getLinkedInJobs };