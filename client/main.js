import './main.html';
import '../imports/startup/client/client';
import {
    FlowRouter
} from 'meteor/ostrio:flow-router-extra';

document.addEventListener('DOMContentLoaded', function () {
    document.getElementsByTagName('html')[0].setAttribute('data-bs-theme', 'dark');
});

Template.header.helpers({
    searchPhrase() {
        // if we have a "q" query param, return it
        if (FlowRouter.getQueryParam('q')) {
            return FlowRouter.getQueryParam('q');
        }
        // otherwise return an empty string
        return '';
    }
})