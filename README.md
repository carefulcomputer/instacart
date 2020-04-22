# Instacart

In current shelter-in-place time, there are lot of families with at-risk family members who are avoiding going out. For them it is safer to order groceries online from sites like instacart, india cash and carry (regional store) or costco-sameday (white labeled version of instacart). However these sites are havily overbooked and it is hard to find a open delivery time slot. This script is written to help find open time slots on these sites.
There are scripts - one for instacart ( https://www.instacart.com )  which delivers from several stores), one for India Cash and carry (https://www.indiacashandcarry.com/)  and one for costco ( https://sameday.costco.com/store/costco/storefront)  . You can choose to run one or all as per your need. You will need to have an account already at these sites (takes few minutes to register).
These scripts areopen source so feel free to use as you deem fit (except for commercial purpose).

## Installation

Follow these steps to install this code -
1. Install nodejs if you don't have it already ( https://nodejs.org/en/download/). If you don't know, you don't have it.
2. Install npm if you don't have it already ( https://www.npmjs.com/get-npm ). If you don't know, you don't have it.
3. Click green 'Clone or donwload' button from upper right side of this page.
4. Click 'Download ZIP'
5. Unzip the downloaded file.
6. Open terminal command (windows/mac/linux) and change to unzipped folder.
7. Run following command. 

```
npm install
```
This command would install all prerequisites and show things like this on screen. 
```
> puppeteer@3.0.0 install....
```
It might take some time so wait for it to finish and get back to command line.
Once it is back on command line this code is ready to be run. 

## Usage
You will need to enter command line args.

### For costco sameday script -

```
node costco.js <username> <password> <zip>
```

### For India Cash n Carry script -

```
node indiaCashnCarry.js <username> <password>
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
