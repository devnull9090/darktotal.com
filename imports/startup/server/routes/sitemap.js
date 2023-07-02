import {
    Picker
} from 'meteor/communitypackages:picker';
import {
    Meteor
} from 'meteor/meteor';
import {
    SubReddits
} from '../../../../api/subs/subs';


Picker.route('/sitemap.xml', function (params, req, res, next) {
    res.setHeader('Content-Type', 'application/xml');
    res.setHeader('Cache-Control', 'public, max-age=3600');

    // Allow all robots!!!
    res.setHeader('X-Robots-Tag', 'all');

    const lastUpdatedAt = SubReddits.findOne({}, {
        sort: {
            updatedAt: -1
        },
    });

    res.end(
        `<?xml version="1.0" encoding="UTF-8"?>
      <sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
        <sitemap>
          <loc>${Meteor.absoluteUrl('/sitemaps/subreddits.xml')}</loc>
          <lastmod>${lastUpdatedAt.updatedAt.toISOString()}</lastmod>
        </sitemap>
      </sitemapindex>`);
});


Picker.route('/sitemaps/subreddits.xml', async function (params, req, res, next) {
    res.setHeader('Content-Type', 'application/xml');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    // Allow all robots!!!
    res.setHeader('X-Robots-Tag', 'all');

    const subreddits = SubReddits.find({}, {
        sort: {
            lastUpdated: -1,
            createdAt: -1,
        },
        limit: 50000, // google limits results to 50k
        fields: {
            lastUpdated: 1,
            createdAt: 1,
            name: 1,
        }
    });

    if (!subreddits.count()) {
        res.setHeader('Cache-Control', 'public, max-age=0');
        return res.end('404');
    }

    // cache for 1 hour
    res.setHeader('Cache-Control', 'public, max-age=3600');

    res.write(`<?xml version="1.0" encoding="UTF-8"?>
      <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
            xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">`);


    subreddits.forEach(function (subreddit) {
        const lastMod = subreddit.lastUpdated ? subreddit.lastUpdated.toISOString() : subreddit.createdAt.toISOString();
        res.write(`<url>
        <loc>${Meteor.absoluteUrl(subreddit.name)}</loc>
        <lastmod>${lastMod}</lastmod>
        <changefreq>daily</changefreq>
        </url>`);
    });

    res.end(`</urlset>`);
});