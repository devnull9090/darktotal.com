import {
    FastRender
} from 'meteor/communitypackages:fast-render';


// FastRender.onAllRoutes(function (path) {
//     this.subscribe('currentUser');
// })

FastRender.route('/', function () {
    this.subscribe('SubRedditsTotals');
})