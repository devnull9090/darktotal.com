import {
    Picker
} from 'meteor/communitypackages:picker';
import {
    SubReddits,
    SubRedditsTotalsLog,
    subFilter
} from '../../../../../api/subs/subs';

import {
    Meteor
} from 'meteor/meteor';
import bodyParser from 'body-parser';

import moment from 'moment-timezone';

Picker.middleware(bodyParser.json());
Picker.middleware(bodyParser.urlencoded({
    extended: false
}));

Picker.route('/api/subreddits/time-series', async function (params, req, res) {
    if (Meteor.isDevelopment) {
        console.log('/api/subreddits/time-series', req.body);
    }

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');

    if (req.method == 'OPTIONS') {
        res.statusCode = 200;
        return res.end();
    }
    if (req.method !== 'GET') {
        return routeError(res, 'Invalid use of time-series graph API');
    }
    res.setHeader('content-type', 'text/json');

    if (Meteor.isDevelopment) {
        // don't cache right now
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Expires', '0');
    } else {
        // cache for 1 minute
        res.setHeader('Cache-Control', 'public, max-age=60');
        res.setHeader('Expires', new Date(Date.now() + 60 * 1000).toUTCString());
    }

    let startDate = moment().subtract(6, 'hours').toDate();
    let endDate = moment().toDate();
    if (params && params.query) {
        if (params.query.start) {
            startDate = moment(params.query.start).toDate();
        }
        if (params.query.end) {
            endDate = moment(params.query.end).toDate();
        }
    }

    // Depending on the time scale, we may want to average the data over a period of time
    // For example, if we're looking at a day, we may want to average the data over the last hour
    // If we're looking at a week, we may want to average the data over the last day

    let formatString = "%Y-%m-%dT%H:%M:%S.%LZ";

    if (moment(endDate).diff(startDate, 'hours') < 0.5) {
        formatString = "%Y-%m-%dT%H:%M:%S.%LZ";
    } else if (moment(endDate).diff(startDate, 'hours') < 1) {
        formatString = "%Y-%m-%dT%H:%M:%S.000Z";
    }

    if (moment(endDate).diff(startDate, 'hours') > 1) {
        formatString = "%Y-%m-%dT%H:%M:00.000Z";
    }

    if (moment(endDate).diff(startDate, 'hours') > 8) {
        formatString = "%Y-%m-%dT%H:00:00.000Z";
    }

    const aggregate = await SubRedditsTotalsLog.rawCollection().aggregate([{
            $match: {
                createdAt: {
                    $gte: startDate,
                    $lte: endDate
                }
            }
        },
        {
            $group: {
                _id: {
                    $dateToString: {
                        format: formatString,
                        date: "$createdAt"
                    },
                },
                'totalDark': {
                    $max: "$totalDark"
                },
                'totalPublic': {
                    $max: "$totalPublic"
                },
                'totalRestricted': {
                    $max: "$totalRestricted"
                },
                'totalPrivate': {
                    $max: "$totalPrivate"
                },
                'totalParticipating': {
                    $max: "$totalParticipating"
                },
                'totalNewDark': {
                    $max: "$totalNewDark"
                },
                'totalNewPublic': {
                    $max: "$totalNewPublic"
                },
                'totalNewRestricted': {
                    $max: "$totalNewRestricted"
                },
                'totalNewPrivate': {
                    $max: "$totalNewPrivate"
                },
                count: {
                    $sum: 1
                }
            },
        }, {
            $sort: {
                '_id': 1
            }
        }
    ]).toArray();

    res.end(JSON.stringify(aggregate));
});


function routeError(res, message) {
    res.setHeader('content-type', 'application/json');
    res.writeHead(401);
    res.end(JSON.stringify({
        status: 401,
        message: message
    }));
}

Picker.route('/api/subreddits', function (params, req, res, next) {
    res.setHeader('Content-Type', 'application/json');

    // cache for 5 minutes
    res.setHeader('Cache-Control', 'public, max-age=300');


    // possible query params
    // limit: number
    // page: number
    // sort: string
    // group: string
    // status: string

    const limit = parseInt(params.query.limit) || null;
    const page = parseInt(params.query.page) || 1;
    const sort = params.query.sort || 'name';
    const group = params.query.group || '';
    const status = params.query.status || null;


    const filter = subFilter({
        group,
        status
    });

    const allowedSortOptions = ['name', 'createdAt', 'lastUpdated', 'status', 'group'];

    if (!allowedSortOptions.includes(sort)) {
        return res.end(JSON.stringify({
            status: 'error',
            message: 'Invalid sort option'
        }));
    }

    console.log('filter', filter);

    const extra = {
        fields: {
            _id: 0,
            createdAt: 0,
            lastUpdated: 0,
        }
    };

    if (limit) {
        extra.limit = limit;
        if (page > 1) {
            extra.skip = (page - 1) * limit;
        }
    }

    if (sort) {
        const sortObj = {};
        sortObj[sort] = 1;
        extra.sort = sortObj;
    }

    const subReddits = SubReddits.find(filter, extra);

    if (!subReddits.count()) {
        return res.end(JSON.stringify({
            status: 'error',
            message: 'No subreddits found'
        }));

    }
    res.end(JSON.stringify({
        status: 200,
        subreddits: subReddits.fetch()
    }));
});

// /api/subreddits/time-series