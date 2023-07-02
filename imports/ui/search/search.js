import './search.html';
import {
    FlowRouter
} from 'meteor/ostrio:flow-router-extra';
import {
    Template
} from 'meteor/templating';
import {
    ReactiveVar
} from 'meteor/reactive-var';

import $ from 'jquery';

Template.Search.onCreated(function () {
    this.loading = new ReactiveVar(true);
    this.searchResults = new ReactiveVar([]);
    this.error = new ReactiveVar(false);
    const searchParam = FlowRouter.getQueryParam('q');
    const instance = this;
    $.getJSON(`/api/subreddits?search=${searchParam}`, function (data) {
        if (!data) {
            instance.error.set('No data returned from server');
            instance.loading.set(false);
            return;
        }
        if (data.status !== 200) {
            instance.error.set(data.message);
            instance.loading.set(false);
            return;
        }
        if (!data.subreddits) {

            instance.error.set('No subreddits found for your search');
            instance.loading.set(false);
            return;
        }

        instance.searchResults.set(data.subreddits);
        instance.loading.set(false);
    });

    document.title = 'darktotal.com - Search Results for ' + Handlebars._escape(searchParam);
    $('meta[name=description]').attr('content', `Search results for ${Handlebars._escape(searchParam)} on darktotal.com`);
});
Template.Search.helpers({
    loading() {
        return Template.instance().loading.get();
    },
    error() {
        return Template.instance().error.get();
    },
    searchResults() {
        return Template.instance().searchResults.get();
    },
    searchPhrase() {
        return FlowRouter.getQueryParam('q');
    }
});