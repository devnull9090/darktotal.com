import './routes.js';
import $ from 'jquery';

Meteor.startup(function () {
  Meteor.setInterval(async function () {
    if ($('[data-bs-toggle="tooltip"]:not([data-bs-original-title]').length) {
      $('[data-bs-toggle="tooltip"]:not([data-bs-original-title]').tooltip();
    }
  }, 1000);
});