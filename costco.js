const puppeteer = require('puppeteer');

const checkCostcoAvailability = async (user, pass, zip) => {

    const storeName = 'costco';
    var myArgs = process.argv.slice(2);

    // get args
    user = user || myArgs[0];
    pass = pass || myArgs[1];
    zip = zip || myArgs[2];


    const profileName = storeName + '-' + user.substring(0, 4) + '-' + zip;

    const browser = await puppeteer.launch({
        headless: true,
        userDataDir: profileName,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        slowMo: 50,
    });
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/76.0.3809.132 Safari/537.36');
    await page.setViewport({ width: 1650, height: 800 });

    try {

        await page.goto('https://sameday.costco.com/store/costco/storefront'), { waitUntil: 'networkidle2' };

        const timeSelector = 'a[href^="/' + storeName + '/info?tab=delivery"]>span';
        const zipSelector = '#signup-zipcode';

        const navigationOutcome = await checkAnySelector(page, [zipSelector, timeSelector]);

        switch (navigationOutcome) {
            case zipSelector:
                await login(page, user, pass, zip);
            // fall through after login
            case timeSelector:
                // check date 
                await page.waitForSelector(timeSelector, { visible: true, timeout: 15000 });
                const deliveryText = await page.evaluate((timeSelector) => document.querySelector(timeSelector).textContent, timeSelector);
                console.log('TimeFound : ' + deliveryText + ' - ' + storeName);
                break;
            default:
                console.log('Error');
            // error
        }

    } catch (error) {
        console.log('Error: main - ' + error);
        await page.screenshot({ path: '/tmp/' + profileName + '-' + new Date().getTime() });
    }

    try {
        await page.close();
        await browser.close();
        process.exit();
    } catch (er) {
        console.log('Error: closing - ' + er);
    }
};

async function login(page, username, password, zip) {
    const zipcodeSelector = '#signup-zipcode';
    await enterText(page, zipcodeSelector, zip + String.fromCharCode(13));
    await enterText(page, '#logonId', username); // user field
    await enterText(page, '#logonPassword', password); // password field
    await page.$$eval("option1", checks => checks.forEach(c => c.checked = true));
    await clickLinkOrButton(page, '#LogonForm > fieldset > div:nth-child(5) > input');
}

const checkAnySelector = async (page, selectors) => {
    const jsHandle = await page.waitForFunction((selectors) => {
        for (const selector of selectors) {
            if (document.querySelector(selector) !== null) {
                return selector;
            }
        }
        return false;
    }, { visible: true, timeout: 10000 }, selectors);

    const selector = await jsHandle.jsonValue();
    return selector;

}

async function clickLinkOrButton(frame, selector) {
    await frame.waitForSelector(selector, { visible: true, timeout: 20000 })
    await frame.hover(selector)
    const button = await frame.$(selector);
    await button.click();
}

async function enterText(page, selector, textToEnter) {
    await page.waitForSelector(selector, { visible: true, timeout: 20000 })
    const textBox = await page.$(selector);
    await textBox.focus();
    await page.keyboard.type(textToEnter);
}

async function enterTextInFrame(page, frame, selector, textToEnter) {
    await frame.waitForSelector(selector, { visible: true, timeout: 5000 })
    const textBox = await frame.$(selector);
    await textBox.focus();
    await page.keyboard.type(textToEnter);
}


async function recursiveFindInFrames(inputFrame, selector) {
    const frames = inputFrame.childFrames();
    const results = await Promise.all(
        frames.map(async frame => {
            const el = await frame.$(selector);
            if (el) {
                console.log('found ' + selector + ' in frame ' + frame.name());
                return el;
            }
            if (frame.childFrames().length > 0) {
                return await recursiveFindInFrames(frame, selector);
            }
            return null;
        })
    );
    return results.find(Boolean);
}

async function findInFrames(page, selector) {
    const result = await recursiveFindInFrames(page.mainFrame(), selector);
    if (!result) {
        throw new Error(
            `The selector \`${selector}\` could not be found in any child frames.`
        );
    }
    return result;
}

checkCostcoAvailability();
