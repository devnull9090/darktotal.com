import {
    Picker
} from 'meteor/communitypackages:picker';
import {
    SubReddits,
    subFilter
} from '../../../../../api/subs/subs';

import escapeStringRegexp from 'escape-string-regexp';

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