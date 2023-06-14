import {
    Mongo
} from 'meteor/mongo';

import SimpleSchema from 'simpl-schema';


export const SubReddits = new Mongo.Collection('SubReddits');
export const SubRedditsTotals = new Mongo.Collection('SubRedditsTotals');
export const SubRedditsTotalsLog = new Mongo.Collection('SubRedditsTotalsLog');
export const SubRedditsLog = new Mongo.Collection('SubRedditsLog');
export const SubRedditsBlacklist = new Mongo.Collection('SubRedditsBlacklist');

export const subGroups = [
    '40+ million',
    '30+ million',
    '20+ million',
    '10+ million',
    '5+ million',
    '1+ million',
    '500k+',
    '250k+',
    '100k+',
    '50k+',
    '5k+',
    '5k and below',
    '1k+',
    '1k and below',
    ''
];

export function mapState(state) {
    switch (state) {
        case "PUBLIC":
            return "public";
        case "PRIVATE":
            return "private";
        case "RESTRICTED":
            return "restricted";
        default:
            return "unknown";
    }
}
const SubRedditSchema = new SimpleSchema({
    name: {
        type: String,
        label: "Name",
        max: 200
    },
    group: {
        type: String,
        label: "Group",
        allowedValues: subGroups,
    },
    description: {
        type: String,
        label: "Description",
        max: 200,
        optional: true
    },
    createdAt: {
        type: Date,
        label: "Created At",
        autoValue: function () {
            return new Date()
        }
    },
    status: {
        type: String,
        label: "Status",
        allowedValues: ['public', 'private', 'restricted', 'unknown'],
    },
    updatedAt: {
        type: Date,
        label: "Updated At",
        autoValue: function () {
            return new Date()
        }
    },
});

SubReddits.attachSchema(SubRedditSchema);

const SubRedditLogSchema = new SimpleSchema({
    name: {
        type: String,
        label: "Name",
        max: 200
    },
    statusFrom: {
        type: String,
        label: "Status From",
        allowedValues: ['public', 'private', 'restricted', 'unknown'],
    },
    statusTo: {
        type: String,
        label: "Status To",
        allowedValues: ['public', 'private', 'restricted', 'unknown'],
    },
    group: {
        type: String,
        label: "Group",
        allowedValues: subGroups,
    },
    createdAt: {
        type: Date,
        label: "Created At",
        autoValue: function () {
            return new Date()
        }
    },
});

SubRedditsLog.attachSchema(SubRedditLogSchema);

const SubRedditBlacklistSchema = new SimpleSchema({
    name: {
        type: String,
        label: "Name",
        max: 200
    },
    createdAt: {
        type: Date,
        label: "Created At (when this subreddit was blacklisted)",
        autoValue: function () {
            return new Date()
        }
    },
    reason: {
        type: String,
        label: "Reason this subreddit is blacklisted (e.g. spamming status changes)",
        max: 200
    },
});

SubRedditsBlacklist.attachSchema(SubRedditBlacklistSchema);

const SubRedditTotalsSchema = new SimpleSchema({
    totalDark: {
        type: Number,
        label: "Total Dark",
    },
    totalPublic: {
        type: Number,
        label: "Total Public",
    },
    totalRestricted: {
        type: Number,
        label: "Total Restricted",
    },
    totalPrivate: {
        type: Number,
        label: "Total Private",
    },
    totalParticipating: {
        type: Number,
        label: "Total Participating",
    },
    lastUpdated: {
        type: Date,
        label: "Last Updated",
        autoValue: function () {
            return new Date()
        },
    },
});


export const subFilter = function (obj) {
    let filter = {};

    const status = obj.status || null;
    const group = obj.group || null;

    if (status) {
        filter.status = status;
    }

    if (group) {
        filter.group = group;
    }


    return filter;
}