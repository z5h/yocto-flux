/** @jsx React.DOM */

/**
 * We need this stuff!
 */
var
  Dispatcher  = require('../../index').Dispatcher,
  StateHelper = require('../../index').StateHelper,
  request     = require('superagent'),
  token = require('../../token') || "your github token here";

/**
 * Initialize a StateHelper and Dispatcher
 */
var
  stateHelper = new StateHelper({search : "", searching : 0}),
  dispatcher  = new Dispatcher();

/**
 * searchStore:
 *
 * On search changed, update state.
 */
var searchStore = {
  SEARCH_CHANGED : function(value){
    stateHelper.update({$merge : {search : value}});
  }
};

/**
 * usersStore:
 *
 * On state change, if the search is different make new api request to github.
 * On request response, update state.
 * Also, for fun, dispatch "SEARCHING" and "DONE_SEARCHING" requests.
 */
var usersStore = {
  onNewState : function(current, last){
    if (current.search !== last.search){
      this.search(current.search);
    }
  },

  search : function(query){
    dispatcher.dispatch('SEARCHING');

    request
      .get("https://api.github.com/search/users")
      .query({q: query})
      .set({Authorization: "token " + token})
      .end(function(err, result){
        dispatcher.dispatch('DONE_SEARCHING');
        if (result){
          dispatcher.dispatch('SEARCH_RESULT', query, result);
        }
      });
  },
  SEARCH_RESULT : function(query, result){
    if (query === stateHelper.state.search){
      stateHelper.update({$merge : {users : result.body.items}})
    }
  }
};

/**
 * statusStore:
 *
 * Responds to search start/stop events.
 */
var statusStore = {
  SEARCHING :function(){
    stateHelper.update({searching : {$apply: function(n){return n + 1}}});
  },
  DONE_SEARCHING :function(){
    stateHelper.update({searching : {$apply:  function(n){return n - 1}}});
  }
};


// Tell our minimal stateHelper and dispatcher about our stores.

stateHelper.stores = [usersStore, searchStore, statusStore];
dispatcher.stores  = [usersStore, searchStore, statusStore];

/**
 * Top level component.
 */
var Root = React.createClass({
  mixins : [React.addons.PureRenderMixin],
  /**
   * Here we create a callback that our dispatcher can trigger and force an
   * update.
   */
  componentWillMount: function(){
    this.callback = (function(){
      this.forceUpdate();
    }).bind(this);
    this.props.dispatcher.onDispatchCompleted = this.callback;
  },

  render: function(){
    var state = this.props.stateHelper.state;
    return <div>
      <div>
        <SearchField
          dispatch={this.props.dispatcher.dispatch}
          search  ={state.search}
        />
        <br/>
        Query count: {state.searching}
      </div>
      <UsersView users={state.users}/>
    </div>;
  }
});

/**
 * SearchField.
 * When the input changes, call our dispatcher with a "SEARCH_CHANGED" action.
 */
var SearchField = React.createClass({
  change: function(e){
    this.props.dispatch('SEARCH_CHANGED', e.target.value);
  },
  render : function(){
    var search = this.props.search;
    return <input ref="input"
      value    = {search}
      onChange = {this.change}
    />;
  }
});

/**
 * UsersView.
 * Pretty basic stuff here.
 */
var UsersView = React.createClass({
  render : function(){
    var users = (this.props.users || []).map(function(user){
      return <li key={user.id}>
        <UserView gitHubData={user} />
      </li>;
    });
    return <ul>{users}</ul>;
  }
});

/**
 * UserView.
 * Pretty basic stuff here
 */
var UserView = React.createClass({
  render : function(){
    var gitHubData = this.props.gitHubData;
    return <div>
      {gitHubData.login}
      <img width="32" height="32" src={gitHubData.avatar_url}/>
    </div>;
  }
});

/**
 * Render the root component to the DOM.
 */
React.render(
  <Root dispatcher={dispatcher} stateHelper={stateHelper}/>,
  document.getElementById('app')
);

/**
 * Make our dispatcher available in the console to drive with.
 */
window.reactDispatcher = dispatcher;