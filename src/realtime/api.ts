import 'fetch-everywhere';

export default async (path: string) => {
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
