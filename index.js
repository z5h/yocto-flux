/**
 * In this file:
 * Dispatcher: to dispatch actions to stores
 * StateHelper: to facilitate reactive communication between stores.
 */

/**
 * Dispatcher.
 * A Dispatcher has stores that it dispatches to.
 * It has an onDispatchCompleted field that can be set as a callback.
 * It has a dispatch method.
 */
function Dispatcher(){
  this.stores = [];
  this.onDispatchCompleted = null;
  this.dispatch = Dispatcher.prototype.dispatch.bind(this);
}

/**
 * Invoke `dispatch` with an action name and any number of parameters.
 * e.g.
 * dispatcher.dispatch("SOME_ACTION", actionParameter1, actionParameter2, ...)
 *
 * If a method with the action name exists on any store, it will be invoked with
 * on those stores with the given parameters.
 *
 * If a store, while responding to a dispatch, dispatches a new action, the
 * new action will be queued using JavaScript's built-in setTimeout.
 */
Dispatcher.prototype.dispatch = function(){

  var args = Array.prototype.slice.call(arguments);

  if (this.dispatching){
    setTimeout(function(){
      this.dispatch.apply(this, args);
    }.bind(this), 0);
    return;
  }

  this.dispatching = true;
  var fnName = args.shift();
  for (var i=0; i< this.stores.length; i++){
    var store = this.stores[i],
        fn    = store[fnName];

    if (typeof(fn) === 'function') {
      fn.apply(store, args);
    }
  }
  this.dispatching = false;

  if (this.onDispatchCompleted) this.onDispatchCompleted();
};

/**
 * StateHelper.
 * A StateHelper has an internal state which should not be modified.
 * Updating the state is to be done with the update method which does a
 * non-destructive update and notifies stores of the new and old values.
 */
function StateHelper(state){
  this.stores = [];
  this.state = state || {};
}

/**
 * Uses the update command syntax from React.addons.update
 * to perform a non-desctructive update and notify stores of old/new state.
 */
StateHelper.prototype.update = function(command){

  var last = this.state;
  this.state = React.addons.update(last, command);

  for (var i=0; i< this.stores.length; i++) {
    var store = this.stores[i],
      fn = store['onNewState'];

    if (typeof(fn) === 'function') {
      fn.call(store, this.state, last);
    }
  }

  return this.state;
};

exports.Dispatcher = Dispatcher;
exports.StateHelper = StateHelper;
