###Meteor Paginator - Meteor Smart Package

This package provides a simple mechanism to paginate your data subscriptions in Meteor.

###Installation

1. Install [meteorite](https://github.com/oortcloud/meteorite)
2. `mrt add paginator`

###How To Use

Meteor Paginator provides templates and callbacks to easily page your subscribed data, provided you follow the below conventions.

####Server Code

You'll need to expose your publication with arguments for `limit` and `skip`

    Meteor.publish("myCollection", function(skip, limit) {
      return MyCollection.find({}, {
        skip: skip || 0
        , limit: limit || 10
      });
    });
  
Next, you'll need a server method that gives you a total record count for your collection.

    Meteor.methods({
      totalCount: function() {
        return MyCollection.find().count();
      }
    });
  
####Client Code

Wire up your subscription with `Session` variables for both `skip` and `limit`
 
    Deps.autorun(function() {
      Meteor.subHandle = Meteor.subscribe("myCollection", Session.get("pagingSkip"), Session.get("pagingLimit"));
    }
  
Next, in your `Template` where you want to page the data, instantiate the Paginator:

    var _pager = new Meteor.Paginator({
      	templates: {
			content: "my_template"
		}
		, pagination: {
	    	resultsPerPage: 5 //default limit
		}
		, callbacks: {
			onPagingCompleted: function(skip, limit) {
                Session.set("pagingSkip", skip);
                Session.set("pagingLimit", limit);
			}
			, getDependentSubscriptionsHandles: function() {
				  return [Meteor.subHandle];
			}
			, getTotalRecords: function(cb) {
                  //you need to return the total record count here
                  //using the provided callback
                  Meteor.call("totalCount", function(err, result) {
                    cb(result);
                  });
			}
			, onTemplateRendered: function() {
                //regular render code
			}
			, onTemplateCreated: function() {
                Session.set("pagingSkip", 0);
                Session.set("pagingLimit", 5);
			}
		}
	});

And ensure you're sending in the collection to the template:

     Template.my_template.person = function() {
        return MyCollection.find();
     };

Finally, in your HTML

  <template name="my_template">
  
     <table class="table table-striped table-bordered">
        <tr>
          <th>Name</th>
          <th>Occupation</th>
        </tr>
        <tr>
          {{#each person}}
            <td>{{name}}</td>
            <td>{{occupation}}</td>
          {{/each}}
        </tr>
     </table>
     
     <div class="well well-small">
        {{{ paginationButtons }}}
        {{{ selectPerPage }}}
     </div>
     
  </template>
  
Both `{{{paginationPuttons}}}` and `{{{selectPerPage}}}` are dynamically-creatd templates included in Meteor.Paginator. The styling all comes from Twitter Bootstrap.


## For multiple paginator support, please see the below

Live Example: http://multipage.meteor.com

You may want to page the same data twice, or page different data, within the same view. The below example illustrates how this works.

### Javascript

    Kittens = new Meteor.Collection("kittens");
    KittensView = new Meteor.Collection("kittensView");
    Puppies = new Meteor.Collection("puppies");

    if (Meteor.isClient) {

      Template.kittens_template.kitten = function() {
        return Kittens.find();
      };

      Template.kittens_view_template.kitten = function() {
        return KittensView.find();
      };

      Template.puppies_template.puppy = function() {
        return Puppies.find();
      };

      function _pager(templ, num, handle) {
        var p = new Meteor.Paginator({
            templates: {
              content: templ + "_template"
            }
            , pagination: {
                resultsPerPage: 5 //default limit
              }
              , callbacks: {
                onPagingCompleted: function(skip, limit) {
                    Session.set("pagingSkip_" + num, skip);
                    Session.set("pagingLimit_" + num, limit);
                    console.log("setting " + num);
                  }
                , getDependentSubscriptionsHandles: function() {
                    return [handle];
                  }
                , getTotalRecords: function(cb) {
                  //you need to return the total record count here
                  //using the provided callback
                  Meteor.call("totalCount", templ, function(err, result) {
                    cb(result);
                  });
                }
                , onTemplateRendered: function() {
                  //regular render code
                }
                , onTemplateCreated: function() {
                  Session.set("pagingSkip_" + num, 0);
                  Session.set("pagingLimit_" + num, 5);
                }
            }
        });

        return p;
      }

      Template.kittens_parent.created = function() {
        Deps.autorun(function() {
          Meteor.subHandle1 = Meteor.subscribe("kittens", Session.get("pagingSkip_1"), Session.get("pagingLimit_1"));
        });
        Meteor.Pager1 = _pager("kittens", 1, Meteor.subHandle1);
      };

      Template.puppies_parent.created = function() {
        Deps.autorun(function() {
          Meteor.subHandle2 = Meteor.subscribe("puppies", Session.get("pagingSkip_2"), Session.get("pagingLimit_2"));
        });
        Meteor.pager2 = _pager("puppies", 2, Meteor.subHandle2);
      };

      Template.kittens_view_parent.created = function() {
        Deps.autorun(function() {
          Meteor.subHandle3 = Meteor.subscribe("kittens2", Session.get("pagingSkip_3"), Session.get("pagingLimit_3"));
        });
        Meteor.pager3 = _pager("kittens_view", 3, Meteor.subHandle3);
      };
    }

    if (Meteor.isServer) {

      Meteor.startup(function () {
        if (Kittens.find().count() === 0) {
          _.times(500, function(n) {
            Kittens.insert({ number: n, name: Random.hexString(5), toy: Random.hexString(10) })
          });
        }

        if (Puppies.find().count() === 0) {
          _.times(500, function(n) {
            Puppies.insert({ number: n, name: Random.hexString(7), toy: Random.hexString(10) })
          });
        }
      });

      Meteor.publish("kittens", function(skip, limit) {
        return Kittens.find({}, {
          skip: skip || 0
          , limit: limit || 10
        });
      });

      Meteor.publish("kittens2", function(skip, limit) {

        var self = this, skip = skip || 0, limit = limit || 10;

        self.ready();

        var _watchKittens = Kittens.find({}, {skip: skip, limit: limit}).observe({
          added: function(doc) {
            self.added("kittensView", doc._id, doc);
          }
          , changed: function(doc) {
             console.log("changed ", init);
            self.changed("kittensView", doc._id, doc);
          }
          , removed: function(doc) {
            self.removed("kittensView", doc._id, doc);
          }
        });

        self.onStop(function () {
            _watchKittens.stop();
        });

      });

      Meteor.publish("puppies", function(skip, limit) {
        return Puppies.find({}, {
          skip: skip || 0
          , limit: limit || 10
        });
      });

      Meteor.methods({
        totalCount: function(templ) {
          switch (templ) {
            case "kittens":
            case "kittens_view":
              console.log("total", templ);
              return Kittens.find().count();
            case "puppies":
              return Puppies.find().count();
          }
        }
      });
    }

### HTML

<head>
		<title>multipage</title>
	</head>

	<body>
		<div class="container-fluid">
			<div class="row-fluid">
				<div class="span6">
					{{> kittens_parent}}
				</div>
				<div class="span6">
					{{> puppies_parent}}
				</div>
			</div>
			<div class="row-fluid">
				<div class="span6">
					{{> kittens_view_parent}}
				</div>
			</div>
		</div>
	</body>

	<template name="kittens_parent">
		{{> kittens_template}}
	</template>

	<template name="kittens_view_parent">
		{{> kittens_view_template}}
	</template>

	<template name="puppies_parent">
		{{> puppies_template }}
	</template>

	<template name="kittens_template">
		<h2>Kittens</h2>
		<table class="table table-striped table-bordered">
			<tr>
				<th>Number</th>
				<th>Name</th>
				<th>Toy</th>
			</tr>
			{{#each kitten}}
				<tr>
					<td>{{number}}</td>
					<td>{{name}}</td>
					<td>{{toy}}</td>
				</tr>
			{{/each}}
		</table>
		<div class="well well-small">
			{{{ paginationButtons }}}
			{{{ selectPerPage }}}
		</div>
	</template>

	<template name="kittens_view_template">
		<h2>Kittens View</h2>
		<table class="table table-striped table-bordered">
			<tr>
				<th>Number</th>
				<th>Name</th>
				<th>Toy</th>
			</tr>
			{{#each kitten}}
				<tr>
					<td>{{number}}</td>
					<td>{{name}}</td>
					<td>{{toy}}</td>
				</tr>
			{{/each}}
		</table>
		<div class="well well-small">
			{{{ paginationButtons }}}
			{{{ selectPerPage }}}
		</div>
	</template>

	<template name="puppies_template">
		<h2>Puppies</h2>
		<table class="table table-striped table-bordered">
			<tr>
				<th>Number</th>
				<th>Name</th>
				<th>Toy</th>
			</tr>
			{{#each puppy}}
				<tr>
					<td>{{number}}</td>
					<td>{{name}}</td>
					<td>{{toy}}</td>
				</tr>
			{{/each}}
		</table>
		<div class="well well-small">
			{{{ paginationButtons }}}
			{{{ selectPerPage }}}
		</div>
	</template>


