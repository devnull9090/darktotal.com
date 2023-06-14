import {
  Meteor
} from 'meteor/meteor';

import '../imports/startup/server/server';

WebApp.rawConnectHandlers.use(
  Meteor.bindEnvironment(async function (req, res, next) {
    // if we are running on darktotal.com, output the analytics code
    if (req.headers.host === 'darktotal.com') {
      req.dynamicHead = `
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
        `;
    }
    next();
  }));