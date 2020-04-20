# instacart

Checks for open time slots on instacart and costco.
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
<storeName> Times not found :::: <list of days and times found>
```
