import {
    SubReddits,
    SubRedditsLog
} from '../../../api/subs/subs';
import './subreddits.html';
import {
    FlowRouter
} from 'meteor/ostrio:flow-router-extra';

Template.Subreddit.onCreated(function () {
    this.loadedComments = new ReactiveVar(false);

    document.title = 'darktotal.com - r/' + Handlebars._escape(FlowRouter.getParam('_subreddit'));
    $('meta[name=description]').attr('content', `darktotal.com - r/${Handlebars._escape(FlowRouter.getParam('_subreddit'))}`);
});

Template.Subreddit.onRendered(function () {
    disqus_config = function () {
        this.page.url = Meteor.absoluteUrl(`r/${FlowRouter.getParam('_subreddit')}`);
        this.page.identifier = `r/${FlowRouter.getParam('_subreddit')}`;
    };

    (function () {
        var d = document,
            s = d.createElement('script');
        s.src = 'https://darktotal.disqus.com/embed.js';
        s.setAttribute('data-timestamp', +new Date());
        (d.head || d.body).appendChild(s);
    })();
});


Template.Subreddit.helpers({
    subreddit() {
        return SubReddits.findOne({
            name: `r/${FlowRouter.getParam('_subreddit')}`
        });
    },
    subredditLog() {
        return SubRedditsLog.findOne({
            name: `r/${FlowRouter.getParam('_subreddit')}`
        });
    },
});