Package.describe({
	name: "mrt:paginator"
    , summary: "Simple meteor pagination"
    , version: "0.1.2"
});

Package.on_use(function (api) {
    api.use(['jquery@1.11.3', 'underscore@1.0.2', 'templating@1.0.11'], 'client');
    api.add_files([
         'lib/client/meteor.paginator.js'
        , 'lib/client/css/pagination.css'
    ], 'client');
});