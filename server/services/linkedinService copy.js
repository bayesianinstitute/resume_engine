import { Builder, By, Key } from 'selenium-webdriver';

async function setupWebDriver() {
    const driver = await new Builder().forBrowser('chrome').build();
    return driver;
}

async function scrapeLinkedIn(driver, jobTitle, jobLocation, jobCount) {
    const results = [];
    const url = `https://www.linkedin.com/jobs/search?keywords=${encodeURIComponent(jobTitle)}&location=${encodeURIComponent(jobLocation)}&f_TPR=r604800&position=1&pageNum=0`;

    await driver.get(url);

    // Dynamic scrolling to load more jobs
    for (let i = 0; i < Math.ceil(jobCount / 10); i++) {
        await driver.executeScript("window.scrollBy(0, 1000);");
        await driver.sleep(3000); // Wait for content to load after scrolling
    }

    try {
        const titles = await driver.findElements(By.css('h3.base-search-card__title'));
        const companies = await driver.findElements(By.css('h4.base-search-card__subtitle'));
        const locations = await driver.findElements(By.css('span.job-search-card__location'));
        const urls = await driver.findElements(By.css('a.base-card__full-link')); // Alternative selector for job links

        for (let j = 0; j < titles.length; j++) {
            const company = companies[j] ? await companies[j].getText() : '';
            const title = titles[j] ? await titles[j].getText() : '';
            const location = locations[j] ? await locations[j].getText() : '';
            const url = urls[j] ? await urls[j].getAttribute('href') : '';

            // Only add complete listings to results
            if (company && title && location && url) {
                results.push({ company, title, location, url });
            }

            // Stop if we have collected the desired number of job listings
            if (results.length >= jobCount) break;
        }

    } catch (error) {
        console.error('Error retrieving job listings:', error);
    }

    return results; // Return only complete listings up to the requested jobCount
}

export { setupWebDriver, scrapeLinkedIn };
