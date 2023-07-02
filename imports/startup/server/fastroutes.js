import {
    FastRender
} from 'meteor/communitypackages:fast-render';


// FastRender.onAllRoutes(function (path) {
//     this.subscribe('currentUser');
// })

FastRender.route('/', function () {
    this.subscribe('SubRedditsTotals');
})

FastRender.route('/r/:_subreddit', function (params) {
    this.subscribe('SubReddit', `r/${params._subreddit}`);
    this.subscribe('SubRedditLog', `r/${params._subreddit}`);
})