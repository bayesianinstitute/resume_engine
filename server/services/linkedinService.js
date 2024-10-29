import { Builder, By, Key } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome.js';

async function setupWebDriver() {
    const options = new chrome.Options();
    // options.addArguments('--headless');
    options.addArguments('--no-sandbox');
    options.addArguments('--disable-dev-shm-usage');

    return new Builder()
        .forBrowser('chrome')
        .setChromeOptions(options)
        .build();
}

async function scrapeLinkedIn(driver, jobTitle, jobLocation, datePosted, experienceLevel, sendEvent) {
    // Mapping the datePosted and experienceLevel to LinkedIn's query parameters
    const datePostedMapping = {
        '24h': 'r86400',
        'week': 'r604800',
        'month': 'r2592000'
    };
    const experienceLevelMapping = {
        'internship': '1',
        'entry': '2',
        'associate': '3',
        'mid-senior': '4',
        'director': '5',
        'executive': '6'
    };

    // Build the LinkedIn URL with the additional filters
    const url = `https://www.linkedin.com/jobs/search?keywords=${encodeURIComponent(jobTitle)}&location=${encodeURIComponent(jobLocation)}&f_TPR=${datePostedMapping[datePosted]}&f_E=${experienceLevelMapping[experienceLevel]}&position=1&pageNum=0`;
    await driver.get(url);

    let jobCount = 0;
    let loadMore = true;

    while (loadMore && jobCount < 20) {
        await driver.executeScript("window.scrollBy(0, 1000);");
        await driver.sleep(3000);

        const titles = await driver.findElements(By.css('h3.base-search-card__title'));
        const companies = await driver.findElements(By.css('h4.base-search-card__subtitle'));
        const locations = await driver.findElements(By.css('span.job-search-card__location'));
        const urls = await driver.findElements(By.css('a.base-card__full-link'));
        // const description=await driver.findElements(By.id('job-details'));

        for (let j = jobCount; j < titles.length && jobCount < 20; j++) {
            const company = companies[j] ? await companies[j].getText() : '';
            const title = titles[j] ? await titles[j].getText() : '';
            const location = locations[j] ? await locations[j].getText() : '';
            const url = urls[j] ? await urls[j].getAttribute('href') : '';
            // const des=description[j] ? await description[j].getText() : '';
            if (company && title && location && url) {
                const job = { company, title, location, url };
                await sendEvent(job);
                jobCount++;
            }
        }

        loadMore = titles.length > jobCount;
    }
}


export { setupWebDriver, scrapeLinkedIn };
