const axios = require('axios').default;

const config = {
    headers: {
        'Accept': 'application/json, text/plain, */*',
        'apikey': 'F848FD68-E12A-49E8-8A02-ABA76636A701',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.163 Safari/537.36',
        'DNT': '1',
        'Content-Type': ['application/json;charset=UTF-8', 'text/plain'],
        'Origin': 'https://www.indiacashandcarry.com',
        'Sec-Fetch-Site': 'cross-site',
        'Sec-Fetch-Mode': 'cors',
        'Referer': 'https://www.indiacashandcarry.com/login',
        'Accept-Language': 'en-US,en;q=0.9,ms;q=0.8,hi;q=0.7'
    }
  }
  
const login = async (user,pass) => {

    const creds = {"user":
                        {"emailId": user,
                        "password": pass}
                    };

    const resp =  await axios.post('https://partnersapi.gethomesome.com/user/login',creds, config);
    //console.log(resp.data.authToken);
    if (resp.status && resp.status == '200') {
        //console.log(resp.data.authToken);
        return resp.data.authToken;
    } else {
        console.log('no data');
        return null;
    }
}

const getAvail = async (user, authCode) => {

    config.headers.authToken = authCode;
    config.headers.emailid = user;
    const resp =  await axios.get('https://partnersapi.gethomesome.com/user/basket', config);
    //console.log(resp.data.authToken);
    if (resp.status && resp.status == '200') {
        return resp.data.orderFee.delivery.availableTimes;
    } else {
        console.log('no data');
        return null;
    }
}

const main = async () => {

    try {
        var myArgs = process.argv.slice(2);
        const user = myArgs[0];
        const pass = myArgs[1];

        const authCode = await login(user, pass); // get auth token
        const availablity = await getAvail(user, authCode); // get availability
        if (availablity && availablity.length > 0) {
            console.log('India CashnCarry Times Found: ' + JSON.stringify(availablity));
        } else {
            console.log('India CashnCarry time not found');
        };
    } catch (err) {
        console.log('Error');
    }
}

main();

