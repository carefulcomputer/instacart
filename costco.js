const puppeteer = require('puppeteer');
const storeName = 'costco';


const getTimes = async (page) => {
    const response = await page.goto('https://sameday.costco.com/v3/retailers/5/delivery_options?source=web');
    // found response.. now check if there is time
    if (response.headers().status == 200) {
        var costcoTimes = await page.evaluate(() => {
            return JSON.parse(document.querySelector("body").innerText);
        });
        const allDays = costcoTimes.service_options.days;
        const daysFound = allDays.filter(day => {
            return (day.options && day.options.length > 0)}); // if any element found
        if (daysFound && daysFound.length > 0) {
            return daysFound;
        } else {
            return [];
        }
    }  else {
        //console.log('unauthorized. so returning null');
        return null;
    }
};

const checkCostcoAvailability = async (user, pass, zip) => {
    var myArgs = process.argv.slice(2);

    // get args
    user = user || myArgs[0];
    pass = pass || myArgs[1];
    zip = zip || myArgs[2];


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
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/76.0.3809.132 Safari/537.36');
    await page.setViewport({ width: 1366, height: 1024 });

    try {

        let foundDays = await getTimes(page);
        if (!foundDays) { // if not logged in then there won't be any 
            await login(page, user, pass, zip); // logged in
            foundDays = await getTimes(page); // days found
        }

        if (foundDays && foundDays.length > 0) {
            let days  = foundDays.reduce((str, day) => {
                // get times
                let times = day.options.reduce((dayStr, timeObj) => {
                    //console.log(JSON.stringify(times));
                    dayStr += timeObj.green_window + ', ';
                    return dayStr;
                }, day.date + ' : ');
                //console.log('times are ' + times);

                return (str + ' ::::: ' + times);
            }, (storeName + ' Times Found: '));

            console.log(days);
        } else {
            console.log(storeName + ' time not found');
        }
    } catch (error) {
        console.log('Error: main - ' + error);
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
    await page.goto('https://sameday.costco.com/store/costco/storefront', { waitUntil: 'networkidle2' });
    const zipcodeSelector = '#signup-zipcode';
    await enterText(page, zipcodeSelector, zip + String.fromCharCode(13));
    await enterText(page, '#logonId', username); // user field
    await enterText(page, '#logonPassword', password); // password field
    await page.$$eval("option1", checks => checks.forEach(c => c.checked = true));
    await clickLinkOrButton(page, '#LogonForm > fieldset > div:nth-child(5) > input');
    const timeSelector = 'a[href^="/' + storeName + '/info?tab=delivery"]>span';
    await page.waitForSelector(timeSelector, { visible: true, timeout: 30000 })
}


async function clickLinkOrButton(frame, selector) {
    await frame.waitForSelector(selector, { visible: true, timeout: 20000 })
    await frame.hover(selector)
    const button = await frame.$(selector);
    await button.click();
}

async function enterText(page, selector, textToEnter) {
    //console.log('Entering text:' + textToEnter);
    await page.waitForSelector(selector, { visible: true, timeout: 20000 })
    const textBox = await page.$(selector);
    await textBox.focus();
    await page.keyboard.type(textToEnter);
}

checkCostcoAvailability();
