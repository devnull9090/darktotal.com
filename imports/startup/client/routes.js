import {
    FlowRouter
} from 'meteor/ostrio:flow-router-extra';

import '../../ui/home/home.js';
import '../../ui/subreddits/subreddits.js';
import '../../ui/search/search.js';

FlowRouter.route('/', {
    name: 'Home',
    waitOn: function() {
        Meteor.subscribe('SubRedditsTotals');
    },
    action() {
        this.render('Home');
    }
});

// add route for /r/subreddit
FlowRouter.route('/r/:_subreddit', {
    name: 'Subreddit',
    waitOn: function(params) {
        const subreddit = params._subreddit;
        Meteor.subscribe('SubReddit', `r/${subreddit}`);
        Meteor.subscribe('SubRedditLog', `r/${subreddit}`);
    },
    action() {
        this.render('Subreddit');
    }
});

// add route for /r/subreddit
FlowRouter.route('/search', {
    name: 'Search',
    action() {
        this.render('Search');
    }
});

// Create 404 route (catch-all)
FlowRouter.route('*', {
    action() {
        // Show 404 error page using Blaze
        this.render('404');
    }
});