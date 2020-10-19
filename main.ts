import Config from './config';
// import Etherscan from 'node-etherscan-api';
import { Ethplorer } from 'ethplorer-js';
import * as cheerio from 'cheerio';
import * as fs from 'fs';
const hooman = require('hooman');
const Discord = require('discord.js');
const discord = new Discord.Client();

// initialize apis
// const etherscan = new Etherscan(Config.ETHERSCAN_KEY); 
const ethplorer = new Ethplorer(Config.ETHPLORER_KEY);

// list of recently discovered tokens
let recent:string[] = [];

// min amount of transfers to be considered
const TRANSFERS_FILTER:number = 100;

// var to hold tokens.txt contents
let tokens:string = "";

// login to discord
discord.login(Config.DISCORD_KEY);

// log output and error message in a discord server
async function log(message: string, err?: boolean | null) {
    
    // mention me if there is an error
    if (err)
        discord.channels.cache.get(Config.DISCORD_CHANNEL).send("<@" + Config.DISCORD_MENTION+ ">\n" + message);
    else 
        discord.channels.cache.get(Config.DISCORD_CHANNEL).send(message);

}

// load coins.txt data into coins global var
async function loadCoins() {

    /*
    try {
        tokens = fs.readFileSync("tokens.txt", "utf8");
    } catch(err) {
        tokens = "";
        log(err,true);
    }
    */

    return true;

}

interface TokenData {
    address: string,
    name: string,
    totalSupply: string,
    transfersCount: number,
    holdersCount: number
}


// save token to tokens.txt if it's new
function saveToken(token: TokenData) {
    console.log(token);
    // check if coin has already been added
    if (tokens.indexOf(token.address)) {

        // append coin name to text file
        fs.appendFile("tokens.txt", "", (err) => {
            if (err) log(err.message,true);
        });

    }
}

// add to array and keep it at 10 elements
function cycleArray (address: string) {
    recent.unshift(address);
    recent = recent.slice(0,20);
}

// fitler our tokens we don't care about
async function filterTokens(tokenList: string[]) {

    // go through tokens and get info
    for (const token of tokenList) {

        // don't list addresses that were recently listed
        if (recent.indexOf(token) !== -1)
            return;

        await ethplorer.getTokenInfo(token)
        .then((data:any) => {

            // ignore coins that don't meet filter
            if (data.transfersCount > TRANSFERS_FILTER)
                return;

            // add to list
            cycleArray(token);
            // console.log(recent);

            // construct message
            const message = data.name + 
                          "```\nTransfers: " + data.transfersCount + 
                          "\nHolders: " + data.holdersCount + 
                          "\nTotal Supply" + data.totalSupply + 
                          "```\nhttps://etherscan.io/token/" + data.address;

            log(message);
        })
        .catch((err:string) => {
            // log("filterTokens(): " + err);            
            return;
        })
    }

}


// scrape etherscan latests transactions page
async function scrapeEtherscan() {

    // try and read coins.txt and make get request
    let html = "";

    try {
        const response = await hooman.get('https://etherscan.io/tokentxns');
        html = response.body;
    } catch(err) {
        log("scrapeEtherscan() " + err, true);
        return;
    }

    // load html with cheerio
    const $ = await cheerio.load(html);

    let newTokens: string[] = [];

    // go through all table items
    await $('.table-hover tbody tr').each(async (i, elem) => {

        // extract token addr
        let href = $(elem.childNodes[8].childNodes[0]).attr("href");
        let tokenAddress = href?.substring(href?.lastIndexOf("/") + 1);
        // console.log(tokenAddress);

        // add tokens to list
        if (tokenAddress)
            newTokens.push(tokenAddress);

    });

    // send tokens to filter
    if (newTokens.length > 0)
        filterTokens(newTokens);
}


discord.on("ready", () => {

    // first run
    if (loadCoins())
        scrapeEtherscan();

    // run every 10 seconds
    setInterval(() => {

        // first run
        if (loadCoins())
            scrapeEtherscan();

    }, 20000);

});
