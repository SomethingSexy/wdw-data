"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cheerio_1 = __importDefault(require("cheerio"));
const debug_1 = __importDefault(require("debug"));
const https_1 = __importDefault(require("https"));
const invariant_1 = __importDefault(require("invariant"));
const querystring_1 = __importDefault(require("querystring"));
const random_useragent_1 = __importDefault(require("random-useragent"));
const url_1 = require("url");
const debug = debug_1.default('request');
const SESSION_KEY = 'PHPSESSID=';
const ORIGIN = 'https://disneyworld.disney.go.com';
const SITE_HOST = 'disneyworld.disney.go.com';
const AUTH_HOST = 'authorization.go.com';
const APP_ID = 'WDW-MDX-ANDROID-3.4.1';
const API_HOST = 'api.wdpro.disney.go.com';
const accessTokenURLBody = 'grant_type=assertion&assertion_type=public&client_id=WDPRO-MOBILE.MDX.WDW.ANDROID-PROD';
// use the same user-agent for all WDW park requests
const authUserAgent = random_useragent_1.default.getRandom(ua => ua.osName === 'Android');
// meh
const WEB_API_TYPES = {
    dining: 'dining-availability',
    entertainment: 'list/ancestor'
};
exports.getHtml = async (url, headers) => {
    debug(`Requesting html for ${url}`);
    const parsedUrl = url_1.parse(url);
    return new Promise((resolve, reject) => {
        const options = {
            headers: Object.assign({ Accept: '*/*', 'Accept-Language': 'en-US,en;q=0.8' }, headers, { 
                // Make sure it is at least one of the standard browsers
                // this might account for some weirdness I was seeing with html
                // not coming back as expected
                'User-Agent': random_useragent_1.default.getRandom(ua => {
                    return ua.browserName === 'Firefox';
                }) }),
            hostname: parsedUrl.host,
            method: 'get',
            path: parsedUrl.pathname
        };
        const request = https_1.default.request(options, response => {
            let html = '';
            response.on('data', chunk => {
                html += chunk;
            });
            response.on('end', () => {
                debug(`Retrieved html for ${url}`);
                resolve(html);
            });
        }).on('error', error => {
            reject(`Cannot retrieve html for ${url} - ${error}`);
        });
        request.end();
    });
};
/**
 * Retrieves the HTML for a "subsequent" screen in a workflow.
 * @param path
 */
exports.screen = async (url) => {
    debug(`Requesting html for ${url}`);
    return exports.getHtml(url, {
        Accept: '*/*',
        'Accept-Language': 'en-US,en;q=0.8',
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        Host: SITE_HOST,
        Origin: ORIGIN,
        'X-Requested-With': 'XMLHttpRequest'
    });
};
/**
 * Retrieves a session cookie for a url.
 * @param url
 */
exports.getWebSession = async (url) => {
    debug(`Requesting session for ${url}`);
    return new Promise((resolve, reject) => {
        https_1.default.get(url, response => {
            const setCookie = response.headers['set-cookie'];
            if (!setCookie) {
                throw new Error(`Cannot retrieve session cookie for ${url}`);
            }
            let sessionId = setCookie.find(test => test.indexOf('PHPSESSID=') > -1);
            if (!sessionId) {
                throw new Error(`Cannot retrieve session cookie for ${url}`);
            }
            sessionId = sessionId.substring(sessionId.indexOf(SESSION_KEY));
            sessionId = sessionId.substring(SESSION_KEY.length, sessionId.indexOf(';'));
            let html = '';
            response.on('data', chunk => {
                html += chunk;
            });
            response.on('end', () => {
                const $ = cheerio_1.default.load(html);
                const csrfToken = $('#pep_csrf').val();
                debug(`Retrieved session for ${url}`);
                resolve({
                    csrfToken,
                    cookie: sessionId // tslint:disable-line
                });
            });
        }).on('error', error => {
            reject(`Cannot retrieve session for ${url} - ${error}`);
        });
    });
};
exports.diningFinder = async (url, data, auth) => {
    let postData = data;
    if (auth) {
        postData = Object.assign({}, postData, { pep_csrf: auth.csrfToken });
    }
    postData = querystring_1.default.stringify(postData);
    return new Promise((resolve, reject) => {
        const options = {
            headers: {
                Accept: '*/*',
                'Accept-Language': 'en-US,en;q=0.8',
                'Content-Length': postData.length,
                'Content-Type': 'application/x-www-form-urlencoded',
                // these are the two things you definitely need
                // the s_vi one looks like it just needs to have been created at some point
                // keep alive is a couple years so don't need to try and get it each time
                Cookie: `PHPSESSID=${auth.cookie}; s_vi=[CS]v1|2AE01B6C05012E2B-4000013760054F62[CE];`,
                // need these otherwise it 302
                Host: SITE_HOST,
                Origin: ORIGIN,
                Referer: url,
                'User-Agent': random_useragent_1.default.getRandom(),
                'X-Requested-With': 'XMLHttpRequest'
            },
            hostname: SITE_HOST,
            method: 'post',
            path: '/finder/dining-availability/'
        };
        const request = https_1.default
            .request(options, response => {
            let str = '';
            response.on('data', chunk => {
                str += chunk;
            });
            response.on('end', () => {
                debug('Fetched availability');
                // This API returns the html directly, so turn it into something
                // that looks like an api.
                const $ = cheerio_1.default.load(str);
                if (!$('#diningAvailabilityFlag').data('hasavailability')) {
                    resolve(false);
                }
                else {
                    // assuming there are some times available
                    // now grab the actual available times
                    const times = [];
                    $('.pillLink', '.ctaAvailableTimesContainer')
                        .get()
                        .forEach(el => {
                        times.push({
                            link: $(el).attr('href'),
                            time: $('.buttonText', el).text()
                        });
                    });
                    resolve(times);
                }
            });
        })
            .on('error', err => {
            debug('Error in fetching availability', err);
            reject(err);
        });
        // This is the data we are posting, it needs to be a string or a buffer
        request.write(postData);
        request.end();
    });
};
/**
 * Retrieves data from a web/browser based api.  We probably want to merge this with
 * the mobile api get function.
 */
exports.getWebApi = async (url, type, params, auth) => {
    return new Promise((resolve, reject) => {
        const options = {
            headers: {
                Accept: '*/*',
                'Accept-Language': 'en-US,en;q=0.8',
                Authorization: `BEARER ${auth}`,
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                Host: SITE_HOST,
                Origin: ORIGIN,
                Referer: url,
                'User-Agent': random_useragent_1.default.getRandom(),
                'X-Requested-With': 'XMLHttpRequest'
            },
            hostname: SITE_HOST,
            method: 'get',
            path: `/api/wdpro/explorer-service/public/finder/${WEB_API_TYPES[type]}/80007798;entityType=destination?${querystring_1.default.stringify(params)}` // tslint:disable-line
        };
        const request = https_1.default
            .request(options, response => {
            let data = '';
            response.on('data', chunk => {
                data += chunk;
            });
            response.on('end', () => {
                try {
                    const rData = JSON.parse(data);
                    resolve(rData);
                }
                catch (error) {
                    reject(error);
                }
            });
        })
            .on('error', err => {
            debug('Error in fetching availability', err);
            reject(err);
        });
        request.end();
    });
};
exports.getAccessToken = async () => {
    return new Promise((resolve, reject) => {
        const agentOptions = {
            headers: {
                'User-Agent': authUserAgent
            },
            hostname: AUTH_HOST,
            method: 'post',
            path: '/token'
        };
        const options = Object.assign({}, agentOptions, { agent: new https_1.default.Agent(agentOptions) });
        const request = https_1.default.request(options, response => {
            let data = '';
            response.on('data', b => {
                data += b;
            })
                .on('end', () => {
                const accessData = JSON.parse(data);
                invariant_1.default(accessData.access_token, 'Could not parse access_token.');
                invariant_1.default(accessData.expires_in, 'Could not parse expires_in.');
                const token = accessData.access_token;
                // TODO: Check if it is about to expire
                // let ttlExpiresIn = parseInt(accessData.expires_in, 10);
                // ttlExpiresIn = Math.ceil(ttlExpiresIn * .90);
                debug(`Fetched new WDW access token ${token}, expires in ${accessData.expires_in}`);
                resolve(token);
            })
                .on('error', err => {
                debug('Error in fetching WDW access token', err);
                reject(err);
            });
        });
        request.write(accessTokenURLBody);
        request.end();
    });
};
exports.get = (url, params, auth) => {
    return new Promise((resolve, reject) => {
        const agentOptions = {
            headers: {
                Accept: 'application/json;apiversion=1',
                Authorization: `BEARER  ${auth}`,
                'User-Agent': authUserAgent,
                'X-App-Id': APP_ID,
                'X-Conversation-Id': 'WDPRO-MOBILE.MDX.CLIENT-PROD',
                'X-Correlation-ID': Date.now()
            },
            hostname: API_HOST,
            method: 'get',
            path: `${url}?${querystring_1.default.stringify(params)}`
        };
        const options = Object.assign({}, agentOptions, { agent: new https_1.default.Agent(agentOptions) });
        const request = https_1.default.request(options, response => {
            let data = '';
            response.on('data', b => {
                data += b;
            })
                .on('end', () => {
                const rData = JSON.parse(data);
                resolve(rData);
            })
                .on('error', err => {
                debug(`Error in fetching WDW data from ${url}`, err);
                reject(err);
            });
        });
        request.write(accessTokenURLBody);
        request.end();
    });
};
//# sourceMappingURL=request.js.map