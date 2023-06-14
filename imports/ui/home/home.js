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
    SubRedditsTotalsLog,
    subGroups
} from '../../../api/subs/subs';
import {
    Mongo
} from 'meteor/mongo';
import './home.html';

import {
    Session
} from 'meteor/session';
import moment from "moment-timezone";

import axios from 'axios';


import Chart from 'chart.js/auto';

import 'chartjs-adapter-moment';
import zoomPlugin from 'chartjs-plugin-zoom';

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


Template.GraphTotalsNew.onCreated(function () {
    this.chart = null;
    this.timer = null;
    const instance = this;

    Session.set('dataset_0_hidden', false);
    Session.set('dataset_1_hidden', false);
    Session.set('dataset_2_hidden', false);
    Session.set('dataset_3_hidden', false);
    Session.set('dataset_4_hidden', false);


    this.getDatasets = function (data) {

        return [{
                label: 'New Dark',
                data: data.map(item => item.totalNewDark),
                backgroundColor: 'rgba(255, 99, 132, 0.2)',
                borderColor: 'rgba(255, 99, 132, 1)',
                borderWidth: 1,
                fill: false,
                hidden: Session.get('dataset_0_hidden'),
            },
            {
                label: 'New Public',
                data: data.map(item => item.totalNewPublic),
                backgroundColor: 'rgba(54, 162, 235, 0.2)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1,
                hidden: Session.get('dataset_1_hidden'),
            },
            {
                label: 'New Restricted',
                data: data.map(item => item.totalNewRestricted),
                backgroundColor: 'rgba(255, 206, 86, 0.2)',
                borderColor: 'rgba(255, 206, 86, 1)',
                borderWidth: 1,
                fill: false,
                hidden: Session.get('dataset_2_hidden'),
            },
            {
                label: 'New Private',
                data: data.map(item => item.totalNewPrivate),
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1,
                fill: false,
                hidden: Session.get('dataset_3_hidden'),
            },
        ];
    }
    this.startFetch = function ({
        chart
    }) {
        const {
            min,
            max
        } = chart.scales.x;
        clearTimeout(instance.timer);
        instance.timer = setTimeout(() => {
            if (Meteor.isDevelopment) {
                console.log('Fetching data between ' + min + ' and ' + max);
                console.log('chart.scales.x', chart.scales.x);
            }
            /* 
            Fetched data between 1659301696280.1804 and 1659331258541.7686
            Fetched data between 1659250389965 and 1659423189965
            */
            const startDate = new Date(min);
            const endDate = new Date(max);
            if (Meteor.isDevelopment) {
                console.log('startDate', startDate, startDate.toUTCString());
                console.log('endDate', endDate, endDate.toUTCString());
            }

            axios(Meteor.absoluteUrl(`/api/subreddits/time-series?start=${startDate.toUTCString()}&end=${endDate.toUTCString()}`)).then(response => {
                if (Meteor.isDevelopment) {
                    console.log('Fetched data between ' + min + ' and ' + max);
                }
                const data = response.data;
                const labels = data.map(item => item._id);
                chart.data.labels = labels;

                // update title
                chart.options.plugins.title.text = 'Reddit Changes from ' + moment(startDate).format('MMMM Do YYYY, h:mm:ss a') + ' to ' + moment(endDate).format('MMMM Do YYYY, h:mm:ss a z')

                chart.data.datasets = instance.getDatasets(data);
                chart.stop(); // make sure animations are not running
                chart.update('none');
            });
        }, 500);
    };
});


Template.GraphTotalsNew.onRendered(function () {

    // get the last 6 hours
    const startDate = new Date();
    startDate.setHours(startDate.getHours() - 6);
    const endDate = new Date();

    const instance = this;

    Meteor.subscribe('SubRedditsTotalsLog');


    axios(Meteor.absoluteUrl(`/api/subreddits/time-series?start=${startDate.toUTCString()}&end=${endDate.toUTCString()}`)).then(response => {
        const data = response.data;
        const labels = data.map(item => item._id);

        const ctx = document.getElementById('dark-time-series-all-chart').getContext('2d');
        Chart.register(zoomPlugin);
        const defaultLegendClickHandler = Chart.defaults.plugins.legend.onClick;
        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: instance.getDatasets(data)
            },
            options: {
                responsive: true,
                plugins: {

                    zoom: {
                        pan: {
                            enabled: true,
                            mode: 'x',
                            modifierKey: 'ctrl',
                            onPanComplete: instance.startFetch
                        },
                        zoom: {
                            wheel: {
                                enabled: true,
                            },
                            drag: {
                                enabled: true,
                            },
                            pinch: {
                                enabled: true
                            },
                            mode: 'x',
                            onZoomComplete: instance.startFetch
                        }
                    },

                    legend: {
                        onClick: function (e, legendItem, legend) {
                            const index = legendItem.datasetIndex;
                            Session.set(`dataset_${index}_hidden`, !legendItem.hidden);
                            console.log(`dataset_${index}_hidden`, !legendItem.hidden);
                            defaultLegendClickHandler.call(this, e, legendItem, legend);
                        },
                        position: 'bottom',
                    },
                    title: {
                        display: true,
                        text: 'Reddit Changes from ' + moment(startDate).format('MMMM Do YYYY, h:mm:ss A') + ' to ' + moment(endDate).format('MMMM Do YYYY, h:mm:ss A z')
                    }
                },
                scales: {
                    x: {
                        type: 'timeseries',
                    },
                }
            }
        });

        SubRedditsTotalsLog.find({
            createdAt: {
                $gte: startDate,
            }
        }).observeChanges({
            added: function (id, fields) {
                instance.startFetch({
                    chart: instance.chart
                });
            },
            changed: function (id, fields) {
                instance.startFetch({
                    chart: instance.chart
                });
            },
            removed: function (id) {
                instance.startFetch({
                    chart: instance.chart
                });
            }
        });
    }).catch(error => {
        console.log(error);
    });
});




Template.GraphTotals.onCreated(function () {
    this.chart = null;
    this.timer = null;
    const instance = this;

    Session.set('dataset_0_hidden', false);
    Session.set('dataset_1_hidden', false);
    Session.set('dataset_2_hidden', false);
    Session.set('dataset_3_hidden', false);
    Session.set('dataset_4_hidden', false);


    this.getDatasets = function (data) {

        return [{
                label: 'Dark',
                data: data.map(item => item.totalDark),
                backgroundColor: 'rgba(255, 99, 132, 0.2)',
                borderColor: 'rgba(255, 99, 132, 1)',
                borderWidth: 1,
                fill: false,
                hidden: Session.get('dataset_0_hidden'),
            },
            {
                label: 'Public',
                data: data.map(item => item.totalPublic),
                backgroundColor: 'rgba(54, 162, 235, 0.2)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1,
                hidden: Session.get('dataset_1_hidden'),
            },
            {
                label: 'Restricted',
                data: data.map(item => item.totalRestricted),
                backgroundColor: 'rgba(255, 206, 86, 0.2)',
                borderColor: 'rgba(255, 206, 86, 1)',
                borderWidth: 1,
                fill: false,
                hidden: Session.get('dataset_2_hidden'),
            },
            {
                label: 'Private',
                data: data.map(item => item.totalPrivate),
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1,
                fill: false,
                hidden: Session.get('dataset_3_hidden'),
            },
            {
                label: 'Total Participating',
                data: data.map(item => item.totalParticipating),
                backgroundColor: 'rgba(153, 102, 255, 0.2)',
                borderColor: 'rgba(153, 102, 255, 1)',
                borderWidth: 1,
                fill: false,
                hidden: Session.get('dataset_4_hidden'),
            }
        ];
    }
    this.startFetch = function ({
        chart
    }) {
        const {
            min,
            max
        } = chart.scales.x;
        clearTimeout(instance.timer);
        instance.timer = setTimeout(() => {
            if (Meteor.isDevelopment) {
                console.log('Fetching data between ' + min + ' and ' + max);
                console.log('chart.scales.x', chart.scales.x);
            }
            /* 
            Fetched data between 1659301696280.1804 and 1659331258541.7686
            Fetched data between 1659250389965 and 1659423189965
            */
            const startDate = new Date(min);
            const endDate = new Date(max);
            if (Meteor.isDevelopment) {
                console.log('startDate', startDate, startDate.toUTCString());
                console.log('endDate', endDate, endDate.toUTCString());
            }

            axios(Meteor.absoluteUrl(`/api/subreddits/time-series?start=${startDate.toUTCString()}&end=${endDate.toUTCString()}`)).then(response => {
                if (Meteor.isDevelopment) {
                    console.log('Fetched data between ' + min + ' and ' + max);
                }
                const data = response.data;
                const labels = data.map(item => item._id);
                chart.data.labels = labels;

                // update title
                chart.options.plugins.title.text = 'Total Reddit Dark Status from ' + moment(startDate).format('MMMM Do YYYY, h:mm:ss a') + ' to ' + moment(endDate).format('MMMM Do YYYY, h:mm:ss a z')

                chart.data.datasets = instance.getDatasets(data);
                chart.stop(); // make sure animations are not running
                chart.update('none');
            });
        }, 500);
    };
});


Template.GraphTotals.onRendered(function () {

    // get the last 6 hours
    const startDate = new Date();
    startDate.setHours(startDate.getHours() - 6);
    const endDate = new Date();

    const instance = this;

    Meteor.subscribe('SubRedditsTotalsLog');


    axios(Meteor.absoluteUrl(`/api/subreddits/time-series?start=${startDate.toUTCString()}&end=${endDate.toUTCString()}`)).then(response => {
        const data = response.data;
        const labels = data.map(item => item._id);

        const ctx = document.getElementById('dark-time-series-chart').getContext('2d');
        Chart.register(zoomPlugin);
        const defaultLegendClickHandler = Chart.defaults.plugins.legend.onClick;
        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: instance.getDatasets(data)
            },
            options: {
                responsive: true,
                plugins: {

                    zoom: {
                        pan: {
                            enabled: true,
                            mode: 'x',
                            modifierKey: 'ctrl',
                            onPanComplete: instance.startFetch
                        },
                        zoom: {
                            wheel: {
                                enabled: true,
                            },
                            drag: {
                                enabled: true,
                            },
                            pinch: {
                                enabled: true
                            },
                            mode: 'x',
                            onZoomComplete: instance.startFetch
                        }
                    },

                    legend: {
                        onClick: function (e, legendItem, legend) {
                            const index = legendItem.datasetIndex;
                            Session.set(`dataset_${index}_hidden`, !legendItem.hidden);
                            console.log(`dataset_${index}_hidden`, !legendItem.hidden);
                            defaultLegendClickHandler.call(this, e, legendItem, legend);
                        },
                        position: 'bottom',
                    },
                    title: {
                        display: true,
                        text: 'Reddit Changes from ' + moment(startDate).format('MMMM Do YYYY, h:mm:ss A') + ' to ' + moment(endDate).format('MMMM Do YYYY, h:mm:ss A z')
                    }
                },
                scales: {
                    x: {
                        type: 'timeseries',
                    },
                }
            }
        });

        SubRedditsTotalsLog.find({
            createdAt: {
                $gte: startDate,
            }
        }).observeChanges({
            added: function (id, fields) {
                instance.startFetch({
                    chart: instance.chart
                });
            },
            changed: function (id, fields) {
                instance.startFetch({
                    chart: instance.chart
                });
            },
            removed: function (id) {
                instance.startFetch({
                    chart: instance.chart
                });
            }
        });
    }).catch(error => {
        console.log(error);
    });
});