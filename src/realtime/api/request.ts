import * as cheerio from 'cheerio';
import createDebug from 'debug';
import https from 'https';
import fetch from 'node-fetch';
import querystring from 'querystring';

const debug = createDebug('request');

const SESSION_KEY = 'PHPSESSID=';

/**
 * Retrieves the HTML for a screen.
 * @param path
 */
export const screen = async (path: string) => {
  const response = await fetch(path, {
    headers: {
      Accept: '*/*',
      'Accept-Language': 'en-US,en;q=0.8',
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      Host: 'disneyworld.disney.go.com',
      Origin: 'https://disneyworld.disney.go.com',
      'X-Requested-With': 'XMLHttpRequest',
      'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/44.0.2403.125 Safari/537.36' // tslint:disable-line
    },
    method: 'get'
  });

  return response.text();
};

/**
 * Retrieves a session cookie for a url.
 * @param url
 */
export const session = async url => {
  debug(`Requesting session for ${url}`);

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Cannot retrieve session for ${url}`);
  }

  const setCookie = response.headers.get('set-cookie');
  if (!setCookie) {
    throw new Error(`Cannot retrieve session cookie for ${url}`);
  }

  let sessionId = setCookie.split(';').find(test => test.indexOf('PHPSESSID=') > -1);
  if (!sessionId) {
    throw new Error(`Cannot retrieve session cookie for ${url}`);
  }

  sessionId = sessionId.substring(sessionId.indexOf(SESSION_KEY));
  sessionId = sessionId.substring(SESSION_KEY.length);

  const html = await response.text();
  const $ = cheerio.load(html);
  const csrfToken = $('#pep_csrf').val();

  debug(`Retrieved session for ${url}`);
  return {
    csrfToken,
    cookie: sessionId
  };
};

export const post = async (url, data, referer, auth) => {
  let postData = data;
  if (auth) {
    postData = {
      ...postData,
      pep_csrf: auth.csrfToken,
    };
  }

  postData = querystring.stringify(postData);

  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'disneyworld.disney.go.com',
      path: '/finder/dining-availability/',
      method: 'POST',
      headers: {
        // these are the two things you definitely need
        // the s_vi one looks like it just needs to have been created at some point, keep alive is a couple years so don't need to try and get it each time
        'Cookie': 'PHPSESSID=' + auth.cookie + '; s_vi=[CS]v1|2AE01B6C05012E2B-4000013760054F62[CE];',
        // need these otherwise it 302
        Host: 'disneyworld.disney.go.com',
        Origin: 'https://disneyworld.disney.go.com',
        Referer: referer,
        // end need
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': postData.length,
        'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/44.0.2403.125 Safari/537.36',
        Accept: '*/*',
        // TODO: figure out how we can accept gzipping to be nice
        // 'Accept-Encoding':'gzip, deflate',
        'Accept-Language': 'en-US,en;q=0.8',
        'X-Requested-With': 'XMLHttpRequest'
      }
    };
  
    const callback = (response) => {
      let str = '';
      response.on('data', (chunk) => {
        str += chunk;
      });
      response.on('end', () => {
        console.log(response.statusCode); // eslint-disable-line no-console
        // add the raw response to the reservation data
        resolve(str);
      });
    };
  
    const wdwReq = https
      .request(options, callback)
      .on('error', function reservationRequestError(err) {
        console.log(err); // eslint-disable-line no-console
        reject(err);
      });
  
    // This is the data we are posting, it needs to be a string or a buffer
    wdwReq.write(postData);
    wdwReq.end();
  });
};
