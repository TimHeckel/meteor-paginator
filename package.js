Package.describe({
    summary: "Simple meteor pagination"
});

Package.on_use(function (api) {
    api.use(['jquery', 'underscore', 'templating'], 'client');
    api.add_files([
         'lib/client/meteor.paginator.js'
        , 'lib/client/paginationTemplates.html'
        , 'lib/client/css/pagination.css'
    ], 'client');
});