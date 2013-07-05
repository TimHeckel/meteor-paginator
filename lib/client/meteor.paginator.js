Meteor.Paginator = function(_opts) {

	var _self = this
		, _instance = Random.id()
		, _sessionMultiplePages = '__hasMultiplePages__' + _instance
		, _sessionButtons = "__sessionButtons__" + _instance
		, _sessionRPP = "__resultsPerPage__"  + _instance;

	var opts = {
		templates: {
	        content: null
		}
		, pagination: {
			currentPage: 0
			, resultsPerPage: 5
			, totalRecords: 0
			, totalPages: 0
		}
		, callbacks: {
			onPagingCompleted: null
			, getDependentSubscriptionsHandles: null
			, getTotalRecords: null
			, onTemplateRendered: null
			, onTemplateCreated: null
			, onTemplateDestroyed: null
			, onResultsPerPageChanged: null
		}
	};

	_.extend(opts, _opts);

	var _setPaging = function(ele) {
		var _scheduledPage = opts.pagination.currentPage;
		$(".pageButton[data-instance-id='" + ele.attr("data-instance-id") + "']").each(function() { $(this).parent().removeClass("active").removeClass("disabled"); });
		switch (ele.attr("data-page")) {
			case "next":
				_scheduledPage++;
				break;
			case "back":
				_scheduledPage--;
				break;
			case "first":
				_scheduledPage = 0;
				break;
			case "last":
				_scheduledPage = opts.pagination.totalPages - 1;
				break;
			default:
				_scheduledPage = parseInt(ele.attr("data-page")) || 0; //zero if pagination is missing
				break;
		}
		
		if (opts.pagination.currentPage !== _scheduledPage) {
    		opts.pagination.currentPage = _scheduledPage;
    		var skip = _scheduledPage * opts.pagination.resultsPerPage, limit = opts.pagination.resultsPerPage;
    		opts.callbacks.onPagingCompleted && opts.callbacks.onPagingCompleted(skip, limit);
			_setPagination();
			_setBtnStyles();
		}
	};

	var _setPagination = function() {

		opts.pagination.totalPages = Math.ceil(opts.pagination.totalRecords/opts.pagination.resultsPerPage);
		var _btns = [], _max = Math.min(parseInt($(window).width()/140), 10);

		while (_max % 2 !== 0 && _max < opts.pagination.totalPages)
			_max++;

		if (opts.pagination.totalPages > _max) {
			var _start = opts.pagination.currentPage > _max/2 ? opts.pagination.currentPage - _max/2 : 0;
			if (_start > opts.pagination.totalPages - _max) _start = opts.pagination.totalPages - _max;
			for(p = _start; p < _start + _max; p++) {
	    		_btns.push({r: p, p: p + 1});
	    	}
		} else {
	    	for(p = 0; p < opts.pagination.totalPages; p++) {
	    		_btns.push({r: p, p: p + 1});
	    	}
    	}

    	Session.set(_sessionMultiplePages, opts.pagination.totalPages);
    	Session.set(_sessionButtons, _btns);
	};

	var _resizer;
	var _init = function() {
		opts.callbacks.getTotalRecords(function(tot) {
			opts.pagination.totalRecords = tot;
			_setPagination();
		});
	};

	_self.refreshPagination = function(rpp) {
		opts.pagination.currentPage = 0;
		if (rpp) opts.pagination.resultsPerPage = rpp;
		opts.callbacks.getTotalRecords(function(tot) {
			opts.pagination.totalRecords = tot;
			_setPagination();
			opts.callbacks.onPagingCompleted && opts.callbacks.onPagingCompleted(0, opts.pagination.resultsPerPage);
		});
	};

	var _subWatchers = [];
	Template[opts.templates.content].created = function() {
    	var _autorun = window.setInterval(function() {
			var _dependentSubscriptions = opts.callbacks.getDependentSubscriptionsHandles();
    		var _allReady = _.every(_dependentSubscriptions, function(s) { return s.ready() === true; });
	    	if (_allReady) {
    			window.clearInterval(_autorun);
				opts.callbacks.onTemplateCreated && opts.callbacks.onTemplateCreated();
	    		_init();	    		
	    	}
	    }, 250);
	};

	Template[opts.templates.content].paginationButtons = function() {
		return Template.pagination_buttons({ instance: _instance, hasMultiplePages: Session.get(_sessionMultiplePages) > 1, pageButton: Session.get(_sessionButtons) });
	};

	Template[opts.templates.content].selectPerPage = function() {
		return Template.select_per_page({ instance: _instance });
	};

	Template[opts.templates.content].destroyed = function() {
		opts.callbacks.onTemplateDestroyed && opts.callbacks.onTemplateDestroyed();
		setTimeout(function() { delete _self; }, 0); //self destruct
	};

	var _doneRendering;
	Template[opts.templates.content].rendered = function() {
		window.clearTimeout(_doneRendering);
		var s = this;

		_doneRendering = window.setTimeout(function() {

			//do all the event binding
			$("#selectPerPage[data-instance-id='" + _instance + "']").change(function() {
				var _rpp = parseInt($(this).val());
				opts.callbacks.onResultsPerPageChanged && opts.callbacks.onResultsPerPageChanged(_rpp);
				_self.refreshPagination(_rpp);
			});

			$(".pageButton[data-instance-id='" + _instance + "']").click(function() {
				if (!$(this).parent().hasClass("disabled") && !$(this).parent().hasClass("active")) {
					_setPaging($(this));
				}
			});

			_setBtnStyles();

			$("#selectPerPage[data-instance-id='" + _instance + "']").val(opts.pagination.resultsPerPage + "");

			opts.callbacks.onTemplateRendered &&  opts.callbacks.onTemplateRendered(s);
		}, 100);
	};

	function _setBtnStyles() {
		var _base = ".pageButton[data-instance-id='" + _instance + "']";
		if (opts.pagination.currentPage === (opts.pagination.totalPages - 1)) {
			$(_base + "[data-page='next']").parent().addClass("disabled");
			$(_base + "[data-page='last']").parent().addClass("disabled");
		} else if (opts.pagination.currentPage === 0) {
			$(_base + "[data-page='back']").parent().addClass("disabled");
			$(_base + "[data-page='first']").parent().addClass("disabled");
		}
		$(_base + "[data-page='" + opts.pagination.currentPage + "']").parent().addClass("active");
	};

	var _resetPagination;
	$(window).bind("resize", function(e) {
		window.clearTimeout(_resetPagination);
		_resetPagination = window.setTimeout(function() {
			_setPagination();
		}, 250);
	});

	return _self;
};