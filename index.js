/**
 * Dispatcher.
 */
function Dispatcher(){
  this.stores = [];
  this.onDispatchCompleted = null;
  this.dispatch = Dispatcher.prototype.dispatch.bind(this);
}

/**
 * Invoke `dispatch` with a method name and any number of parameters.
 * If a method with that name exists on any store, it will be invoked with the
 * supplied parameters.
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
 * StateHelper
 */
function StateHelper(state){
  this.state = state || {};
  this.stores = [];
}

/**
 * Uses React.addons.update (http://facebook.github.io/react/docs/update.html)
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
