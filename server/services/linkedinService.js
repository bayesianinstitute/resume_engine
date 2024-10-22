import { Builder, By, Key } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome.js'; // Add .js extension

async function setupWebDriver() {
    const options = new chrome.Options();
    options.addArguments('--headless'); // Enable headless mode
    options.addArguments('--no-sandbox'); // Additional flags to ensure compatibility
    options.addArguments('--disable-dev-shm-usage');

    const driver = await new Builder()
        .forBrowser('chrome')
        .setChromeOptions(options)
        .build();

    return driver;
}

async function scrapeLinkedIn(driver, jobTitle, jobLocation) {
    const results = [];
    const url = `https://www.linkedin.com/jobs/search?keywords=${encodeURIComponent(jobTitle)}&location=${encodeURIComponent(jobLocation)}&f_TPR=r604800&position=1&pageNum=0`;

    await driver.get(url);

    // Dynamic scrolling to load more jobs until we reach 20 results
    let loadMore = true;
    while (loadMore && results.length < 10) {
        await driver.executeScript("window.scrollBy(0, 1000);");
        await driver.sleep(3000); // Wait for content to load after scrolling

        // Retrieve job details after each scroll
        const titles = await driver.findElements(By.css('h3.base-search-card__title'));
        const companies = await driver.findElements(By.css('h4.base-search-card__subtitle'));
        const locations = await driver.findElements(By.css('span.job-search-card__location'));
        const urls = await driver.findElements(By.css('a.base-card__full-link'));

        // Collect job listings
        for (let j = results.length; j < titles.length && results.length < 20; j++) {
            const company = companies[j] ? await companies[j].getText() : '';
            const title = titles[j] ? await titles[j].getText() : '';
            const location = locations[j] ? await locations[j].getText() : '';
            const url = urls[j] ? await urls[j].getAttribute('href') : '';

            if (company && title && location && url) {
                results.push({ company, title, location, url });
            }
        }

        // Stop scrolling if no new jobs were loaded in the last iteration
        loadMore = titles.length > results.length;
    }

    return results.slice(0, 20); // Ensure we return only 20 results
}

export { setupWebDriver, scrapeLinkedIn };
