Meteor.Paginator = function(_opts) {
	var _self = this, _sessionMultiplePages = '__hasMultiplePages__', _sessionButtons = "__sessionButtons__", _sessionRPP = "resultsPerPage"

	var opts = {
		templates: {
	          pager: "pagination_buttons"
	        , rpp: "select_per_page"
	        , content: null
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
		, isActive: false
	};

	var _tops = opts.templates;
	_.extend(opts, _opts);

	//reset missing defaults if overwritten with nulls
	if (!opts.templates.pager) opts.templates.pager = _tops.pager;
	if (!opts.templates.rpp) opts.templates.rpp = _tops.rpp;

	var _setPaging = function(ele) {
		var _scheduledPage = opts.pagination.currentPage, ele = ele || $(".pageButton[data-page='" + opts.pagination.currentPage + "']");
		$(".pageButton").each(function() { $(this).parent().removeClass("active").removeClass("disabled"); });
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
		var _btns = [], _max = Math.min(parseInt($(window).width()/130), 10);

		while (_max % 2 !== 0 && _max < opts.pagination.totalPages)
			_max++;

		if (opts.pagination.totalPages > _max) {
			var _start = opts.pagination.currentPage > _max/2 ? opts.pagination.currentPage - _max/2 : 0;
			if (_start > opts.pagination.totalPages - _max) _start = opts.pagination.totalPages - _max;
			for(p = _start; p < _start + _max; p++) {
	    		_btns.push({r: p, p: p + 1});
	    	}
		} else {
	    	for(p = 1; p < opts.pagination.totalPages; p++) {
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

	if (Template[opts.templates.rpp]) {
		Template[opts.templates.rpp].events({
			"change select": function(e, template) {
				if (opts.isActive) {
					var _rpp = parseInt($(e.target).val());
					opts.callbacks.onResultsPerPageChanged && opts.callbacks.onResultsPerPageChanged(_rpp);
					_self.refreshPagination(_rpp);
				}
			}
		});

		Template[opts.templates.rpp].rendered = function() {
			opts.isActive && $(this.find("select")).val(opts.pagination.resultsPerPage);
		}
	}

	Template[opts.templates.content].created = function() {
		opts.isActive = true;
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

	Template[opts.templates.content].destroyed = function() {
		opts.isActive = false;
		opts.callbacks.onTemplateDestroyed && opts.callbacks.onTemplateDestroyed();
	};

	var _doneRendering;
	Template[opts.templates.content].rendered = function() {
		window.clearTimeout(_doneRendering);
		var _self = this;
		_doneRendering = window.setTimeout(function() {
			opts.callbacks.onTemplateRendered &&  opts.callbacks.onTemplateRendered(_self);
		}, 250);
	};

	Template[opts.templates.pager].events({
		"click .pageButton": function(e, template) {
			if (opts.isActive && !$(e.target).parent().hasClass("disabled") && !$(e.target).parent().hasClass("active")) {
				_setPaging($(e.target));
			}
		}
	});

	Template[opts.templates.pager].hasMultiplePages = function() {
		return Session.get(_sessionMultiplePages) > 1;
	};

	Template[opts.templates.pager].pageButton = function() {
		return Session.get(_sessionButtons);
	};

	Template[opts.templates.pager].rendered = function() {
		_setBtnStyles();		
	};

	function _setBtnStyles() {
		if (opts.pagination.currentPage === (opts.pagination.totalPages - 1)) {
			$(".pageButton[data-page='next']").parent().addClass("disabled");
			$(".pageButton[data-page='last']").parent().addClass("disabled");
		} else if (opts.pagination.currentPage === 0) {
			$(".pageButton[data-page='back']").parent().addClass("disabled");
			$(".pageButton[data-page='first']").parent().addClass("disabled");
		}
		$(".pageButton[data-page='" + opts.pagination.currentPage + "']").parent().addClass("active");
	};

	var _resetPagination;
	$(window).bind("resize", function(e) {
		window.clearTimeout(_resetPagination);
		_resetPagination = window.setTimeout(function() {
			_setPagination();
		})
	});

};