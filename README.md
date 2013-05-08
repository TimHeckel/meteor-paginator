###Meteor Paginator - Meteor Smart Package

This package provides a simple mechanism to paginate your data subscriptions in Meteor. Full details coming *very* soon.

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
        {{> pagination_buttons }}
        {{> select_per_page }}
     </div>
     
  </template>
  
Both `pagination_buttons` and `select_per_page` are templates included in Meteor.Paginator. The styling all comes from Twitter Bootstrap.



