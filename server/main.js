import {
  Meteor
} from 'meteor/meteor';

import '../imports/startup/server/server';
import { SubReddits } from '../api/subs/subs';
import {
  encode
} from 'html-entities';

WebApp.rawConnectHandlers.use(
  Meteor.bindEnvironment(async function (req, res, next) {
    // if we are running on darktotal.com, output the analytics code
    req.dynamicHead = '';
    if (req.headers.host === 'darktotal.com') {
      req.dynamicHead += `
        <!-- Google tag (gtag.js) -->
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-MQPN8F1F5Y"></script>
        <script>
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());

          gtag('config', 'G-MQPN8F1F5Y');
        </script>
        <script type="text/javascript">
            (function(c,l,a,r,i,t,y){
                c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
            })(window, document, "clarity", "script", "hjet8ny36r");
        </script>
        <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4043269018813220" crossorigin="anonymous"></script>
        `;
    }
    
    injectRouteData(req, res, next);
    next();
  }));


  
const injectRouteData = (req, res, next) => {
  let dynamicBody = '';
  if (req.url === '/') {
      req.dynamicHead += `<title>darktotal.com - Real-time Reddit Blackout Stats</title>\n
      
      <meta name="description" content="Real-time Reddit Blackout Stats">\n
      <meta property="og:site_name" content="DarkTotal.com">\n
      <meta property="og:title" content="darktotal.com - Real-time Reddit Blackout Stats">\n
      <meta property="og:description" content="Real-time Reddit Blackout Stats">\n
      <meta property="og:url" content="${Meteor.absoluteUrl()}">\n`;

      return;
  }

  // handle /search?q=cats
  const search = req.url.match(/\/search\?q=([a-zA-Z0-9-]+)/);
  if (search && search.length > 0) {
    const searchParam = search[1];
    req.dynamicHead += `<title>darktotal.com - Search Results for ${encode(searchParam)}</title>\n
      
    <meta name="description" content="Search Results for ${encode(searchParam)} on DarkTotal.com">\n
    <meta property="og:site_name" content="DarkTotal.com">\n
    <meta property="og:title" content="darktotal.com - Search Results for ${encode(searchParam)}">\n
    <meta property="og:description" content="Search Results for ${encode(searchParam)} on DarkTotal.com">\n
    <meta property="og:url" content="${Meteor.absoluteUrl(`/search?q=${encode(searchParam)}`)}">\n`;
    return;
  }

  // handle /r/cats
  const subreddit = req.url.match(/\/r\/([a-zA-Z0-9-]+)/);
  if (subreddit && subreddit.length > 0) {
    const subredditParam = subreddit[1];
    req.dynamicHead += `<title>darktotal.com - r/${encode(subredditParam)}</title>\n
      
    <meta name="description" content="r/${encode(subredditParam)} on DarkTotal.com">\n
    <meta property="og:site_name" content="DarkTotal.com">\n
    <meta property="og:title" content="darktotal.com - r/${encode(subredditParam)}">\n
    <meta property="og:description" content="r/${encode(subredditParam)} on DarkTotal.com">\n
    <meta property="og:url" content="${Meteor.absoluteUrl(`r/${encode(subredditParam)}`)}">\n`;
    return;
  }
};