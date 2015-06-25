Meteor.Paginator = function(_opts) {

	var opts = {
		templates: {
	        content: null
		}
		, pagination: {
			currentPage: 0
			, resultsPerPage: 5
			, resultsPerPageRange: []
			, totalRecords: 0
			, totalPages: 0
		}
		, callbacks: {
			onPagingCompleted: null
			, getDependentSubscriptionsHandles: null
			, getTotalRecords: null
			, onDataLoading: null
			, onTemplateRendered: null
			, onTemplateCreated: null
			, onTemplateDestroyed: null
			, onResultsPerPageChanged: null
		}
	};

	_.extend(opts, _opts);

	var _self = this
		, _instance = Random.id()
		, _sessionMultiplePages = opts.templates.content+'__hasMultiplePages'
		, _sessionButtons = opts.templates.content+"__sessionButtons"
		, _sessionRPP = opts.templates.content+"__resultsPerPage";

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
			_renderButtons();
			//_setBtnStyles();
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
	    		_btns.push({ r: p, p: p + 1, instance: _instance });
	    	}
		} else {
	    	for(p = 0; p < opts.pagination.totalPages; p++) {
	    		_btns.push({ r: p, p: p + 1, instance: _instance });
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
			_renderButtons();

			//wire up paging events
			window.setTimeout(function() {
				$("body").on("click", ".pageButton[data-instance-id='" + _instance + "']", function(e) {
					if (!$(this).parent().hasClass("disabled") && !$(this).parent().hasClass("active")) {
						_setPaging($(this));
					}
				});
			}, 100);
		});
	};

	_self.refreshPagination = function(rpp) {
		opts.pagination.currentPage = 0;
		if (rpp) opts.pagination.resultsPerPage = rpp;
		opts.callbacks.getTotalRecords(function(tot) {
			opts.pagination.totalRecords = tot;
			_setPagination();
			_renderButtons();
			opts.callbacks.onPagingCompleted && opts.callbacks.onPagingCompleted(0, opts.pagination.resultsPerPage);
		});
	};

	var _subWatchers = [];
	var _changer;
	Template[opts.templates.content].created = function() {
    	var _autorun = window.setInterval(function() {
			var _dependentSubscriptions = opts.callbacks.getDependentSubscriptionsHandles();
    		var _allReady =  _dependentSubscriptions.length > 0 ? _.every(_dependentSubscriptions, function(s) { return s && s.ready && s.ready(); }) : true;
	    	if (_allReady) {
    			window.clearInterval(_autorun);
				opts.callbacks.onTemplateCreated && opts.callbacks.onTemplateCreated();
	    		_init();
				setTimeout(function() { _renderButtons(); }, 100);

				if (Tracker) {
		    		//set up autorun -- important for 1.0
		    		Tracker.autorun(function() {
		    			if (Session.get(_sessionButtons)) {
		    				_renderButtons();
		    			}
		    		});
		    	}

	    	}
	    }, 250);
	};

	var templates = {
		buttons: "<ul class='pagination'>" +
					"<li><a href='javascript:' data-page='first' class='pageButton' data-instance-id='{instance}'><i class='fa fa-angle-double-left'></i></a></li>" +
					"<li><a href='javascript:' data-page='back' class='pageButton' data-instance-id='{instance}'><i class='fa fa-angle-left'></i></a></li>" +
					"{buttons}" +
					"<li><a href='javascript:' data-page='next' class='pageButton' data-instance-id='{instance}'><i class='fa fa-angle-right'></i></a></li>" +
					"<li><a href='javascript:' data-page='last' class='pageButton' data-instance-id='{instance}'><i class='fa fa-angle-double-right'></i></a></li>" +
				"</ul>"
		, indiv: "<li><a href='javascript:' data-page='{r}' class='pageButton' data-instance-id='{instance}'>{p}</a></li>"
		, rpp:  "<div class='pull-left'>" +
				"	<small>records per page:</small>" +
				"</div>" +
				"<div class='pull-left'>" +
				"	<select id='selectPerPage' class='form-control' data-instance-id='{instance}'> " +
				"		<option value='5'>5</option>" +
				"		<option value='10'>10</option>" +
				"		<option value='20'>20</option>" +
				"		<option value='30'>30</option>" +
				"		<option value='40'>40</option>" +
				"		<option value='50'>50</option>" +
				"		<option value='60'>60</option>" +
				"		<option value='70'>70</option>" +
				"		<option value='80'>80</option>" +
				"		<option value='90'>90</option>" +
				"		<option value='100'>100</option>" +
				"	</select>" +
				"</div>"
	};

	function _renderButtons() {
		if (Session.get(_sessionMultiplePages) > 1) {
			var _html = templates.buttons.replace(/{instance}/gi, _instance);
			var _templ = templates.indiv.replace(/{instance}/gi, _instance);
			var _btns = [];
			_.each(Session.get(_sessionButtons), function(b) {
				var _btnx = _templ.replace(/{r}/gi, b.r).replace(/{p}/gi, b.p).replace(/{instance}/gi, _instance);
				_btns.push(_btnx);
			});
			_html = _html.replace(/{buttons}/gi, _btns.join(""));

			window.setTimeout(function() {
				if ($(".paging_buttons_" + _instance).length > 0) {
					//window.clearInterval(_rb);
					$(".paging_buttons_" + _instance).html(_html);
					window.setTimeout(_setBtnStyles(), 10);
				} else {
					console.log("****PAGINATION BUG: could not find .paging_buttons_" + _instance);
				}
			}, 500);

		} else {
			$(".paging_buttons_" + _instance).html("");
		}
	};

	function _renderRpp() {
		var _html = templates.rpp.replace(/{instance}/gi, _instance);
		window.setTimeout(function() {
			$("#rpp_" + _instance).html(_html);
			$("#rpp_" + _instance).val(Session.get(window.edSpring.sessionLimit));
			_bindRppEvents();
		}, 10);
	};

	function _bindRppEvents() {
		$("#selectPerPage[data-instance-id='" + _instance + "']").unbind();
		if (opts.pagination.resultsPerPageRange && opts.pagination.resultsPerPageRange.length > 0) {
			$("#selectPerPage[data-instance-id='" + _instance + "']").html("");
			_.each(opts.pagination.resultsPerPageRange, function(n) {
				$("#selectPerPage[data-instance-id='" + _instance + "']").append($("<option value='" + n + "'>" + n + "</option>"));
			});
		}
		$("#selectPerPage[data-instance-id='" + _instance + "']").change(function() {
			var _rpp = parseInt($(this).val());
			opts.callbacks.onResultsPerPageChanged && opts.callbacks.onResultsPerPageChanged(_rpp);
			_self.refreshPagination(_rpp);
		});

		$("#selectPerPage[data-instance-id='" + _instance + "']").val(opts.pagination.resultsPerPage + "");
	};

	if (Template[opts.templates.content].helpers) {

		Template[opts.templates.content].helpers({
			paginationButtons: function() {
				if (!Tracker) {
					window.setTimeout(function() {
						_renderButtons();
					}, 1);
				}
				return "<span class='paging_buttons_" + _instance + "'></span>";
			},
			selectPerPage: function() {
				window.setTimeout(function() { _renderRpp() }, 100);
				return "<span id='rpp_" + _instance + "'></span>";
			}
		});

	} else {

		Template[opts.templates.content].paginationButtons = function() {
			// window.setTimeout(function() {
			// 	_renderButtons();
			// }, 1);
			return "<span class='paging_buttons_" + _instance + "'></span>";
		};

		Template[opts.templates.content].selectPerPage = function() {
			window.setTimeout(function() { _renderRpp() }, 100);
			return "<span id='rpp_" + _instance + "'></span>";
		};

	}



	// Template.pagination_buttons.instance = function() {
	// 	return _instance;
	// };

	// Template.select_per_page.instance = function() {
	// 	return _instance;
	// };

	// Template.select_per_page.rendered = function() {

	// };

	// Template.pagination_buttons.hasMultiplePages = function() {
	// 	console.log("has multiple? ", _sessionMultiplePages, Session.get(_sessionMultiplePages));
	// 	return Session.get(_sessionMultiplePages) > 1;
	// };

	// Template.pagination_buttons.pageButton = function() {
	// 	//console.log("binding ", Session.get(_sessionButtons), $(".pageButton[data-instance-id='" + _instance + "']").length);
	// 	setTimeout(function() {
	// 		_setBtnStyles();
	// 	}, 500);
	// 	return Session.get(_sessionButtons);
	// };

	Template[opts.templates.content].destroyed = function() {
		opts.callbacks.onTemplateDestroyed && opts.callbacks.onTemplateDestroyed();
		setTimeout(function() {
			delete Session.keys[_sessionMultiplePages];
			delete Session.keys[_sessionButtons];
			delete _self;
			$("document").off("click", ".pageButton[data-instance-id='" + _instance + "']", function(e) { });
		}, 0); //self destruct
	};

	Template[opts.templates.content].rendered = function() {
		var s = this;
		opts.callbacks.onTemplateRendered &&  opts.callbacks.onTemplateRendered(s);
	};

	function _setBtnStyles() {
		if (typeof opts.pagination.currentPage === 'undefined') opts.pagination.currentPage = 0;
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
