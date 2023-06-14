import {
    TimeSync
} from "meteor/mizzao:timesync";
import {
    Handlebars
} from "meteor/blaze";
import {
    Template
} from "meteor/templating";
import {
    SubRedditsLog,
    SubRedditsTotals,
    subGroups
} from '../../../api/subs/subs';
import {
    Mongo
} from 'meteor/mongo';
import './home.html';

import moment from "moment-timezone";

import axios from 'axios';

const SubRedditsLocal = new Mongo.Collection(null);
Handlebars.registerHelper('formatNumber', function (number) {
    return number.toLocaleString();
});

Handlebars.registerHelper('safeName', function (name) {
    if (name) {
        return name.replace(/ /g, '-').replace(/\+/g, '');
    }
    return this.toString().replace(/ /g, '-').replace(/\+/g, '');
});

Handlebars.registerHelper("moment", function (time) {
    if (TimeSync.serverTime()) {
        return moment(time).from(TimeSync.serverTime());
    } else {
        return moment(time).fromNow();
    }
});

Template.SubLog.onCreated(function () {
    this.loading = new ReactiveVar(true);
});

Template.SubLog.onRendered(function () {

    this.subscribe('SubRedditsLog', {
        onReady: () => {
            this.loading.set(false);
        },
        onError: (err) => {
            console.error(err);
        }
    });
});
Template.SubLog.helpers({
    sub: function () {
        return SubRedditsLog.find({}, {
            sort: {
                createdAt: -1
            },
        });
    },
    loading: function () {
        return Template.instance().loading.get();
    }
});
Template.Home.onCreated(function () {
    this.showLog = new ReactiveVar(true);
});

Template.Home.helpers({
    showLog: function () {
        return Template.instance().showLog.get();
    },
});

Template.Home.events({
    'click .show-log': function (event, template) {
        template.showLog.set(!template.showLog.get());
    }
});
Template.SubRedditTotals.helpers({
    totals: function () {
        return SubRedditsTotals.findOne();
    },
    percentage: function () {
        const totals = SubRedditsTotals.findOne();
        if (!totals) {
            return 0;
        }
        return ((totals.totalDark / totals.totalParticipating) * 100).toFixed(3);
    },
    toGo: function () {
        const totals = SubRedditsTotals.findOne();
        if (!totals) {
            return 0;
        }
        return totals.totalParticipating - totals.totalDark;
    }
});

Template.SubRedditGroup.onCreated(function () {
    this.loading = new ReactiveVar(false);
    this.error = new ReactiveVar(false);
    this.loaded = new ReactiveVar(false);
});

Template.SubRedditGroup.events({
    'click .accordion-item': function (event, template) {
        const instance = Template.instance();
        instance.loading.set(true);
        axios.get(Meteor.absoluteUrl(`/api/subreddits?group=${template.data}`), {
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            })
            .then(async function (response) {
                if (!response.data) {
                    throw new Error(`Error fetching subreddits for ${template.data}. Please try again later.`);
                }
                if (response.data.status !== 200) {
                    if (response.data.message) {
                        throw new Error(response.data.message);
                    }
                }

                // if not json, throw error
                if (response.headers['content-type'] !== 'application/json') {
                    throw new Error(`Error fetching subreddits for ${template.data}. Please try again later.`);
                }

                if (!response.data.subreddits || response.data.subreddits.length === 0) {
                    instance.error.set('No subreddits found in this group.');
                }

                response.data.subreddits.forEach(async function (sub) {
                    SubRedditsLocal.updateAsync({
                        name: sub.name
                    }, {
                        $set: sub
                    }, {
                        upsert: true
                    });
                });
            }).catch(async function (error) {
                console.error(error);
                instance.error.set(error);
            }).finally(async function () {
                instance.loaded.set(true);
                instance.loading.set(false);
            });
    }
});

Template.SubRedditGroup.helpers({
    loading: function () {
        return Template.instance().loading.get();
    },
    loaded: function () {
        return Template.instance().loaded.get();
    },
    error: function () {
        return Template.instance().error.get();
    },
    groupPercent: function () {
        let dark = 0;
        let publicSubs = 0;
        SubRedditsLocal.find({
            group: this.toString()
        }).forEach(function (sub) {
            if (sub.status === "public") {
                publicSubs++;
            } else {
                dark++;
            }
        });

        // what percentage of the subs in this group are dark?
        return ((dark / (dark + publicSubs)) * 100).toFixed(3);
    },
});

Template.SubRedditList.helpers({
    groups: function () {
        // remove the empty group
        return subGroups.filter(function (group) {
            return group !== '';
        });
    },
});


Template.SubRedditsInGroup.helpers({
    subs: function () {
        return SubRedditsLocal.find({
            group: this.toString()
        }, {
            sort: {
                name: -1
            }
        });
    }
});