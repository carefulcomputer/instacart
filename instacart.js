const puppeteer = require('puppeteer');


const getTimes = async (page, storeName) => {
    const url = 'https://www.instacart.com/v3/containers/' + storeName + '/next_gen/retailer_information/content/delivery?source=web';
    const response = await page.goto(url, { waitUntil: 'networkidle2' });
    // found response.. now check if there is time
    if (response.headers().status == 200) {
        var storeTimes = await page.evaluate(() => {
            return JSON.parse(document.querySelector("body").innerText); ç
        });
        
        const allDays = storeTimes.container.modules.filter(node => { return node.data.service_options && node.data.service_options.service_options && node.data.service_options.service_options.days });
        const daysFound = allDays[0].data.service_options.service_options.days.filter(day => {
            return (day.options && day.options.length > 0)
        }); // if any element found
        if (daysFound && daysFound.length > 0) {
            return daysFound;
        } else {
            return [];
        }
    } else {
        //console.log('unauthorized. so returning null');
        return null;
    }
};

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

    await page.setViewport({ width: 1366, height: 1024 });


    try {
        let foundDays = await getTimes(page, storeName);
        if (!foundDays) { // if not logged in then there won't be any 
            await login(storeName, page, user, pass, zip); // logged in
            foundDays = await getTimes(page, storeName); // days found
        }
        if (foundDays && foundDays.length > 0) {
            let days = foundDays.reduce((str, day) => {
                // get times
                let times = day.options.reduce((dayStr, timeObj) => {
                    //console.log(JSON.stringify(times));
                    dayStr += timeObj.green_window + ', ';
                    return dayStr;
                }, (day.date || 'Flexible ') + ' : ');
                //console.log('times are ' + times);

                return (str + ' ::::: ' + times);
            }, (storeName + ' Times Found: '));

            console.log(days);
        } else {
            console.log(storeName + ' time not found');
        }

    } catch (error) {
        console.log('Error: main - ' + profileName + '  : ' + error);
        await page.screenshot({ path: '/tmp/' + profileName + '-' + (new Date().getTime()) + '.png' });
    }
    try {
        await page.close();
        await browser.close();
        process.exit();
    } catch (er) {
        console.log('Error: closing - ' + er);
    }
};

async function login(storeName, page, username, password, zip) {
    await page.goto('https://www.instacart.com/store/' + storeName + '/storefront', { waitUntil: 'networkidle2' });    
    const zipcodeSelector = '#address_line_1';
    await enterText(page, zipcodeSelector, zip + String.fromCharCode(13));
    await clickByText(page, 'Log in', 'span'); // login link    
    await enterText(page, 'input[name="nextgen-authenticate.all.log_in_email"][type="email"]', username); // user field
    await page.waitFor(1000);
    await enterText(page, 'input[name="nextgen-authenticate.all.log_in_password"][type="password"]', password); // password field
    await page.waitFor(1000);
    await clickLinkOrButton(page, '#main-content > div.rmq-766c96d2 > form > div:nth-child(6) > button');
    const cartSelector = 'button[aria-label^="View Cart"]';
    await page.waitForSelector(cartSelector, {timeout: 30000 });
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

checkDateAvailability();
