import {
    FlowRouter
} from 'meteor/ostrio:flow-router-extra';

import '../../ui/home/home.js';


FlowRouter.route('/', {
    name: 'Home',
    waitOn: function() {
        Meteor.subscribe('SubRedditsTotals');
    },
    action() {
        this.render('Home');
    }
});

// Create 404 route (catch-all)
FlowRouter.route('*', {
    action() {
        // Show 404 error page using Blaze
        this.render('404');
    }
});