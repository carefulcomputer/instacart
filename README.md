# instacart

In current shelter-in-place time, there are lot of families with at-risk person who are avoiding going out. For them it is safer to order groceries online from sites like instacart or costco sameday. However these sites are havily overbooked and it is hard to find a open delivery time. This script is written to help find open time slots on these sites.
There are two scripts - one for instacart (which delivers from several stores) and another for costco. You can choose to run either or both as your requirements. You will need to have an account already at these sites (takes few minutes to register).
This script is open source so feel free to use as you deem fit (except for commercial purpose).

## Installation

checkout repo and run following command (assuming you have nodejs already installed)
```
npm install
```


## Usage
You will need to enter command line args.

### For costco sameday script -

```
node costco.js <username> <password> <zip>
```

### For instacart script -

```
node instacart.js <storename> <username> <password> <zip>
```

where storename is store's name in instacart url... e.g. foodmaxx, safeway, smart-final

If no time is found, script will output 

```
<storeName> time not found
```

and if time is found then it will output

```
<storeName> Times Found: ::: <list of days and times found>
```

Disclaimer: Use at your own risk. This code doesn't come with any gurantee/warranty.
License: Free for personal use, and further extension as long as attribution is provided. Not for commercial use.
