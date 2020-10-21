"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
var config_1 = require("./config");
var ethplorer_js_1 = require("ethplorer-js");
var sdk_1 = require("@uniswap/sdk");
var cheerio = require("cheerio");
var fs = require("fs");
var hooman = require('hooman');
var Discord = require('discord.js');
var Etherscan = require('node-etherscan-api');
var discord = new Discord.Client();
// initialize apis
var etherscan = new Etherscan(config_1["default"].ETHERSCAN_KEY);
var ethplorer = new ethplorer_js_1.Ethplorer(config_1["default"].ETHPLORER_KEY);
// list of recently discovered tokens
var recent = [];
// min amount of transfers to be considered
var TRANSFERS_FILTER = 100;
// var to hold tokens.txt contents
var tokens = "";
// login to discord
discord.login(config_1["default"].DISCORD_KEY);
// log output and error message in a discord server
function log(message, err) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            // mention me if there is an error
            if (err)
                discord.channels.cache.get(config_1["default"].DISCORD_CHANNEL).send("<@" + config_1["default"].DISCORD_MENTION + ">\n" + message);
            else
                discord.channels.cache.get(config_1["default"].DISCORD_CHANNEL).send(message);
            return [2 /*return*/];
        });
    });
}
// load coins.txt data into coins global var
function loadCoins() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            /*
            try {
                tokens = fs.readFileSync("tokens.txt", "utf8");
            } catch(err) {
                tokens = "";
                log(err,true);
            }
            */
            return [2 /*return*/, true];
        });
    });
}
// save token to tokens.txt if it's new
function saveToken(token) {
    console.log(token);
    // check if coin has already been added
    if (tokens.indexOf(token.address)) {
        // append coin name to text file
        fs.appendFile("tokens.txt", "", function (err) {
            if (err)
                log(err.message, true);
        });
    }
}
// add to array and keep it at 10 elements
function cycleArray(address) {
    recent.unshift(address);
    recent = recent.slice(0, 20);
}
// wait function
function wait(milliseconds) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, milliseconds); })];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
// does the given token have an ETH pair
function hasEthPair(token) {
    return __awaiter(this, void 0, void 0, function () {
        var uniswapToken, e_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    uniswapToken = new sdk_1.Token(sdk_1.ChainId.MAINNET, token, 18);
                    return [4 /*yield*/, sdk_1.Fetcher.fetchPairData(uniswapToken, sdk_1.WETH[uniswapToken.chainId])];
                case 1:
                    _a.sent();
                    return [3 /*break*/, 3];
                case 2:
                    e_1 = _a.sent();
                    return [2 /*return*/, false];
                case 3: return [2 /*return*/, true];
            }
        });
    });
}
// fitler out transactions we don't care about
function filterTransactions(transactionList) {
    return __awaiter(this, void 0, void 0, function () {
        var _loop_1, _i, transactionList_1, transaction;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _loop_1 = function (transaction) {
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, wait(2000)];
                                case 1:
                                    _a.sent();
                                    etherscan.getTransactionByHash(transaction)
                                        .then(function (data) { return __awaiter(_this, void 0, void 0, function () {
                                        var receipt;
                                        return __generator(this, function (_a) {
                                            switch (_a.label) {
                                                case 0: return [4 /*yield*/, etherscan.getTransactionReceipt(transaction)];
                                                case 1:
                                                    receipt = _a.sent();
                                                    console.log(receipt);
                                                    return [2 /*return*/];
                                            }
                                        });
                                    }); });
                                    return [2 /*return*/];
                            }
                        });
                    };
                    _i = 0, transactionList_1 = transactionList;
                    _a.label = 1;
                case 1:
                    if (!(_i < transactionList_1.length)) return [3 /*break*/, 4];
                    transaction = transactionList_1[_i];
                    return [5 /*yield**/, _loop_1(transaction)];
                case 2:
                    _a.sent();
                    _a.label = 3;
                case 3:
                    _i++;
                    return [3 /*break*/, 1];
                case 4: return [2 /*return*/];
            }
        });
    });
}
// fitler out tokens we don't care about
function filterTokens(tokenList) {
    return __awaiter(this, void 0, void 0, function () {
        var _loop_2, _i, tokenList_1, token, state_1;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    // ignore possible errors
                    if (tokenList.length == 0)
                        return [2 /*return*/];
                    _loop_2 = function (token) {
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    // don't list addresses that were recently listed
                                    if (recent.indexOf(token) !== -1)
                                        return [2 /*return*/, { value: void 0 }];
                                    return [4 /*yield*/, wait(1000)];
                                case 1:
                                    _a.sent();
                                    return [4 /*yield*/, ethplorer.getTokenInfo(token)
                                            .then(function (data) { return __awaiter(_this, void 0, void 0, function () {
                                            var ethPair, supply, message;
                                            return __generator(this, function (_a) {
                                                switch (_a.label) {
                                                    case 0:
                                                        // ignore coins that don't meet filter
                                                        if (data.transfersCount > TRANSFERS_FILTER)
                                                            return [2 /*return*/];
                                                        return [4 /*yield*/, hasEthPair(token)];
                                                    case 1:
                                                        ethPair = _a.sent();
                                                        // add to list
                                                        cycleArray(token);
                                                        supply = Number(parseInt(data.totalSupply) / Math.pow(10, data.decimals))
                                                            .toLocaleString('en');
                                                        message = "```" + data.name +
                                                            "\nTransfers: " + data.transfersCount +
                                                            "\nHolders: " + data.holdersCount +
                                                            "\nTotal Supply: " + supply +
                                                            "\nEth Pair: " + ethPair +
                                                            "```\nhttps://etherscan.io/token/" + data.address;
                                                        log(message);
                                                        return [2 /*return*/];
                                                }
                                            });
                                        }); })["catch"](function (err) {
                                            // log("filterTokens(): " + err);            
                                            return;
                                        })];
                                case 2:
                                    _a.sent();
                                    return [2 /*return*/];
                            }
                        });
                    };
                    _i = 0, tokenList_1 = tokenList;
                    _a.label = 1;
                case 1:
                    if (!(_i < tokenList_1.length)) return [3 /*break*/, 4];
                    token = tokenList_1[_i];
                    return [5 /*yield**/, _loop_2(token)];
                case 2:
                    state_1 = _a.sent();
                    if (typeof state_1 === "object")
                        return [2 /*return*/, state_1.value];
                    _a.label = 3;
                case 3:
                    _i++;
                    return [3 /*break*/, 1];
                case 4: return [2 /*return*/];
            }
        });
    });
}
// scrape etherscan latests transactions page
function scrapeEtherscan() {
    return __awaiter(this, void 0, void 0, function () {
        var html, response, err_1, $, newTokens, newTransactions;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    html = "";
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, hooman.get('https://etherscan.io/tokentxns')];
                case 2:
                    response = _a.sent();
                    html = response.body;
                    return [3 /*break*/, 4];
                case 3:
                    err_1 = _a.sent();
                    log("scrapeEtherscan() " + err_1, true);
                    return [2 /*return*/];
                case 4: return [4 /*yield*/, cheerio.load(html)];
                case 5:
                    $ = _a.sent();
                    newTokens = [];
                    newTransactions = [];
                    // go through all table items
                    return [4 /*yield*/, $('.table-hover tbody tr').each(function (i, elem) { return __awaiter(_this, void 0, void 0, function () {
                            var token, transactionAddress, tokenAddress;
                            var _a, _b;
                            return __generator(this, function (_c) {
                                token = $(elem.childNodes[8].childNodes[0]).attr("href");
                                transactionAddress = $(elem.childNodes[1].childNodes[0]).text();
                                tokenAddress = (_a = token) === null || _a === void 0 ? void 0 : _a.substring(((_b = token) === null || _b === void 0 ? void 0 : _b.lastIndexOf("/")) + 1);
                                // add tokens to list
                                if (tokenAddress)
                                    newTokens.push(tokenAddress);
                                // add transactions to list
                                if (transactionAddress)
                                    newTransactions.push(transactionAddress);
                                return [2 /*return*/];
                            });
                        }); })];
                case 6:
                    // go through all table items
                    _a.sent();
                    // send tokens & transacitons to filter
                    filterTokens(newTokens);
                    return [2 /*return*/];
            }
        });
    });
}
discord.on("ready", function () {
    // first run
    if (loadCoins())
        scrapeEtherscan();
    // run every 10 seconds
    setInterval(function () {
        // first run
        if (loadCoins())
            scrapeEtherscan();
    }, 20000);
});
