import './fastroutes.js';

import '../../../api/subs/server/publications.js';
import './routes/api/subreddits.js';

import {
    SubRedditsBlacklist,
    SubReddits,
    SubRedditsTotals,
    SubRedditsLog,
    mapState
} from '../../../api/subs/subs.js';

import EventSource from 'eventsource';

// initialize the SubRedditsTotals collection if it doesn't exist
if (SubRedditsTotals.find().count() === 0) {
    SubRedditsTotals.insertAsync({
        _id: 'totals',
        totalDark: 0,
        totalRestricted: 0,
        totalPublic: 0,
        totalPrivate: 0,
        totalParticipating: 0,
        lastUpdated: new Date()
    });
}

// not alerting for these subs as they've been spamming
// back and forth between private and public
const subsToFilter = [
    "r/bi_irl",
    "r/suddenlybi",
    "r/ennnnnnnnnnnnbbbbbby",
    "r/inzaghi"
];

subsToFilter.forEach(sub => {
    SubRedditsBlacklist.update({
        name: sub.toLowerCase()
    }, {
        $set: {
            name: sub.toLowerCase(),
            reason: 'spamming status changes'
        }
    }, {
        upsert: true
    });
});
let eventSource = newEventSource();

function newEventSource() {
    var eventSource = new EventSource('https://reddark.rewby.archivete.am/sse');

    eventSource.onopen = function (event) {
        console.log("Server connection open!");
    }

    eventSource.onerror = function (event) {
        console.log("Error with event source. Reconnect in 3 seconds...");
        eventSource.close();
        Meteor.setTimeout(() => {
            eventSource = newEventSource();
        }, 3000);
    };

    eventSource.onmessage = Meteor.bindEnvironment(function (event) {
        console.log('Message from server!');
        const message = JSON.parse(event.data);
        console.log('Event type:', message.type);
        switch (message.type) {
            case "CurrentStateUpdate":
                handleStateUpdate(message["content"]);
                break;
            case "Delta":
                handleDeltaUpdate(message["content"]);
                break;
            default:
                break;
        }
    });

    return eventSource;
}


function handleStateUpdate(message) {
    console.log('handleStateUpdate');

    if(!message.subreddits) {
        console.error('No subreddits in message', message);
        return;
    }

    let dark = 0;
    let publicSubs = 0;
    let privateSubs = 0;
    let restrictedSubs = 0;
    let participating = message.subreddits.length;

    message.subreddits.forEach(subreddit => {

        if(subsToFilter.includes(subreddit.name.toLowerCase())) {
            console.log('Ignoring sub', subreddit.name);
            return;
        }
        switch (subreddit.state) {
            case 'PUBLIC':
                publicSubs++;
                break;
            case 'PRIVATE':
                privateSubs++;
                dark++;
                break;
            case 'RESTRICTED':
                restrictedSubs++;
                dark++;
                break;
            default:
        }

        SubReddits.updateAsync({
            name: subreddit.name
        }, {
            $set: {
                status: mapState(subreddit.state),
                lastUpdated: new Date(),
                group: subreddit.section
            }
        }, {
            upsert: true
        });
    });


    SubRedditsTotals.updateAsync({
        _id: 'totals',
    }, {
        $set: {
            totalDark: dark,
            totalRestricted: restrictedSubs,
            totalPublic: publicSubs,
            totalPrivate: privateSubs,
            totalParticipating: participating,
            lastUpdated: new Date()
        }
    });
}


/*
    {"type":"Delta","content":{"name":"r/AskUK","section":"1+ million","previous_state":"RESTRICTED","state":"PUBLIC"}}
    {"type":"Delta","content":{"name":"r/EdgeTogether","section":"50k+","previous_state":"PRIVATE","state":"RESTRICTED"}}
*/
function handleDeltaUpdate(data) {
    console.log('handleDeltaUpdate event', data);

    console.log(`${data.name} is now ${data.state}`);
    if (data.state !== 'PUBLIC') {


        const update = {
            $inc: {
                totalDark: 1
            },
            $set: {
                lastUpdated: new Date()
            }
        };

        if (data.state === "RESTRICTED") {
            update.$inc.totalRestricted = 1;
        } else if (data.state === "PRIVATE") {
            update.$inc.totalPrivate = 1;
        }

        SubRedditsTotals.updateAsync({
            _id: 'totals',
        }, {
            $inc: {
                totalDark: 1
            },
            $set: {
                lastUpdated: new Date()
            }
        });
        return;
    }

    // get the last status if it exists
    const lastStatus = SubReddits.findOne({
        name: data.name
    });

    const update = {
        $inc: {
            totalPublic: 1,
            totalDark: -1
        },
        $set: {
            lastUpdated: new Date()
        }
    };

    if (lastStatus) {
        if (lastStatus.status === "restricted") {
            update.$inc.totalRestricted = -1;
        } else if (lastStatus.status === "private") {
            update.$inc.totalPrivate = -1;
        }
    }

    SubRedditsTotals.updateAsync({
        _id: 'totals',
    }, update);

    SubReddits.updateAsync({
        name: data.name
    }, {
        $set: {
            status: mapState(data.state),
            lastUpdated: new Date(),
            group: data.section
        }
    }, {
        upsert: true
    });

    SubRedditsLog.insertAsync({
        name: data.name,
        status: mapState(data.state),
        createdAt: new Date(),
        statusFrom: mapState(data.previous_state),
        statusTo: mapState(data.state),
        group: data.section
    });
}