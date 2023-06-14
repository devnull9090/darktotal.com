import {
    Meteor
} from 'meteor/meteor';

import {
    SubReddits,
    SubRedditsLog,
    SubRedditsTotals
} from '../subs.js';

Meteor.publish('SubReddits', function (group) {
    return SubReddits.find({
        group: group
    });
});


Meteor.publish('SubRedditsLog', function () {
    return SubRedditsLog.find({}, {
        sort: {
            createdAt: -1
        },
        limit: 20
    });
});

Meteor.publish('SubRedditsTotals', function () {
    return SubRedditsTotals.find();
});