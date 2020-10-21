import Config from './config';
import { Ethplorer } from 'ethplorer-js';
import { ChainId, Token, Fetcher, WETH, Route } from '@uniswap/sdk';
import * as cheerio from 'cheerio';
import * as fs from 'fs';
const hooman = require('hooman');
const Discord = require('discord.js');
const Etherscan = require('node-etherscan-api');
const discord = new Discord.Client();

// initialize apis
const etherscan = new Etherscan(Config.ETHERSCAN_KEY); 
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
    holdersCount: number,
    decimals: number
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

// wait function
async function wait(milliseconds: number) {
    await new Promise(resolve => setTimeout(resolve, milliseconds));
}


// does the given token have an ETH pair
async function hasEthPair(token: string) {

    // if error in fetching pair: no eth pair
    try {
        const uniswapToken = new Token(ChainId.MAINNET, token, 18);
        await Fetcher.fetchPairData(uniswapToken, WETH[uniswapToken.chainId])
    } catch (e) {
        return false;
    }

    return true;

}

// fitler out transactions we don't care about
async function filterTransactions(transactionList: string[]) {

    // go through transactions
    for (const transaction of transactionList) {

        await wait(2000);

        etherscan.getTransactionByHash(transaction)
        .then(async (data) => {
            /*
            const ethPair1 = await hasEthPair(data.from);
            const ethPair2 = await hasEthPair(data.from);
            console.log(ethPair1 + ": " + data.from);
            console.log(ethPair2 + ": " + data.to);
            */

            const receipt = await etherscan.getTransactionReceipt(transaction);

            console.log(receipt);

        });

        /*
        await ethplorer.getTxInfo(transaction)
        .then(async (data:any) => {
            console.log(data);
        });
        */
    }

}

// fitler out tokens we don't care about
async function filterTokens(tokenList: string[]) {

    // ignore possible errors
    if (tokenList.length == 0)
        return;

    
    // go through tokens and get info
    for (const token of tokenList) {

        // don't list addresses that were recently listed
        if (recent.indexOf(token) !== -1)
            return;

        await wait(1000);

        await ethplorer.getTokenInfo(token)
        .then(async (data:any) => {

            // ignore coins that don't meet filter
            if (data.transfersCount > TRANSFERS_FILTER)
                return;

            // does token have an ETH pair?
            const ethPair = await hasEthPair(token);

            // add to list
            cycleArray(token);

            // divide total supply by decimals and add commas
            const supply:string = Number(parseInt(data.totalSupply) / 10**data.decimals)
            .toLocaleString('en');

            // construct message
            const message = "```" + data.name + 
                          "\nTransfers: " + data.transfersCount + 
                          "\nHolders: " + data.holdersCount + 
                          "\nTotal Supply: " + supply + 
                          "\nEth Pair: " + ethPair + 
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
    let newTransactions: string[] = [];

    // go through all table items
    await $('.table-hover tbody tr').each(async (i, elem) => {

        // extract token addr
        const token = $(elem.childNodes[8].childNodes[0]).attr("href");
        const transactionAddress = $(elem.childNodes[1].childNodes[0]).text();
        const tokenAddress = token?.substring(token?.lastIndexOf("/") + 1);

        // add tokens to list
        if (tokenAddress)
            newTokens.push(tokenAddress);
        
        // add transactions to list
        if (transactionAddress)
            newTransactions.push(transactionAddress);

    });

    // send tokens & transacitons to filter
    filterTokens(newTokens);
    // filterTransactions(newTransactions);
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
