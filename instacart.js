const puppeteer = require('puppeteer');

const checkDateAvailability = async (storeName, user, pass, zip) => {

    var myArgs = process.argv.slice(2);

    // get args
    storeName = storeName || myArgs[0];
    user = user || myArgs[1];
    pass = pass || myArgs[2];
    zip = zip || myArgs[3];

    const profileName = storeName + '-' + user.substring(0, 4) + '-' + zip;

    const puppeteerArgs = [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-infobars',
        '--window-position=0,0',
        '--ignore-certifcate-errors',
        '--ignore-certifcate-errors-spki-list',
        '--user-agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/76.0.3809.132 Safari/537.36"'
    ];

    const browser = await puppeteer.launch({
        headless: true,
        userDataDir: profileName,
        ignoreDefaultArgs: ['--enable-automation'],
        args: puppeteerArgs,
        slowMo: 50,
    });
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/76.0.3809.132 Safari/537.36')

    //await page.setViewport({ width: 1650, height: 800 });
    await page.setViewport({ width: 1366, height: 1024 });


    try {
        await page.goto('https://www.instacart.com/store/' + storeName + '/storefront'), { waitUntil: 'networkidle2' };

        await page.waitFor(3000);
        const timeSelector = 'a[href^="/' + storeName + '/info?tab=delivery"]>span';
        const zipSelector = '#address_line_1';

        const navigationOutcome = await checkAnySelector(page, [zipSelector, timeSelector]);

        switch (navigationOutcome) {
            case zipSelector:
                await login(page, user, pass, zip);
                // check if logged in.
                let checkIfLoggedIn = await checkAnySelector(page, [zipSelector, timeSelector]);
                if (checkIfLoggedIn == zipSelector) {
                    await login(page, user, pass, zip);
                }
            // fall through after login
            case timeSelector:
                // check date 
                await page.goto('https://www.instacart.com/store/' + storeName + '/storefront'), { waitUntil: 'networkidle2' };
                await page.waitForSelector(timeSelector, { visible: true, timeout: 15000 });
                const deliveryText = await page.evaluate((storeName, timeSelector) => document.querySelector(timeSelector).textContent, storeName, timeSelector);
                console.log('TimeFound : ' + deliveryText + ' - ' + storeName);
                break;
            default:
                console.log('Error');
            // error
        }

        //

    } catch (error) {
        console.log('Error: main - ' + profileName + '  : ' + error);
        await page.screenshot({ path: '/tmp/' + profileName + '-' + (new Date().getTime())  + '.png'});
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
    const zipcodeSelector = '#address_line_1';
    await enterText(page, zipcodeSelector, zip + String.fromCharCode(13));
    await clickByText(page, 'Log in', 'span'); // login link    
    await enterText(page, 'input[name="nextgen-authenticate.all.log_in_email"][type="email"]', username); // user field
    await page.waitFor(2000);
    await enterText(page, 'input[name="nextgen-authenticate.all.log_in_password"][type="password"]', password); // password field
    await page.waitFor(2000);
    await clickLinkOrButton(page, '#main-content > div.rmq-766c96d2 > form > div:nth-child(6) > button');
}

const checkAnySelector = async (page, selectors) => {
    const jsHandle = await page.waitForFunction((selectors) => {
        for (const selector of selectors) {
            if (document.querySelector(selector) !== null) {
                return selector;
            }
        }
        return false;
    }, { visible: true, timeout: 15000 }, selectors);

    const selector = await jsHandle.jsonValue();
    return selector;

}

const clickButtonByText = async (page, text) => {
    const xpath = "//button[contains(., '" + text + "')]";
    const [button] = await page.$x(xpath);
    console.log('found button ' + button);
    if (button) {
        await button.click();
    } else {
        console.log('button not found');
    }
}

const clickByText = async function (page, text, element) {
    element = element || 'a';
    const xpath = `//*[text()[contains(., '${text}')]]`;
    const elements = await page.$x(xpath);
    if (elements.length > 0) {
        for (i in elements) {
            e = elements[i];
            if (await e.isIntersectingViewport()) {
                await e.click();
                return;
            }
        }
    }
    else {
        console.log(xpath);
    }
    throw new Error(`Link not found: ${text}`);
};

async function clickDelivery(page) {
    //await page.waitForSelector('a[href="/costco/info?tab=delivery"]', { timeout: 15000 })
    await clickLinkOrButton(page, 'a[href="/costco/info?tab=delivery"]');
}

async function clickMouse(page, frame, selector) {
    await frame.waitForSelector(selector, { visible: true, timeout: 5000 })
    await frame.hover(selector)
    const button = await frame.$(selector);

    const rect = await frame.evaluate((button) => {
        const { top, left, bottom, right } = button.getBoundingClientRect();
        return { top, left, bottom, right };
    }, button);
    console.log('button coords are ' + (rect.top + 5) + ':' + (rect.left + 5));
    page.mouse.click(rect.top + 5, rect.left + 5)
}

async function clickLinkOrButton(frame, selector) {
    await frame.waitForSelector(selector, { visible: true, timeout: 20000 })
    await frame.hover(selector)
    const button = await frame.$(selector);
    await button.click();
}

async function enterText(page, selector, textToEnter) {
    //console.log('text to enter: ' + textToEnter );
    await page.waitForSelector(selector, { visible: true, timeout: 10000 })
    const textBox = await page.$(selector);
    await textBox.focus();
    //await page.evaluate((val, selector) => document.querySelector(selector).value = val, textToEnter, selector);
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

checkDateAvailability();
