
define(["when", "reconnecting-websocket", 'ws-rpc', 'hub'],
function(when, ReconnectingWebSocket, WsRpc, Hub) {

    var Context = function(server, path, port){
	var self = this;

	this.path = path || 'ws';
	this.port = port || parseInt(window.location.port);
	this.server = server || window.location.hostname;

	this.session = null;
    };

    /// The server to connect to.
    Context.prototype.server = window.location.hostname;
    /// The port to connect to.
    Context.prototype.port = window.location.port;
    /// The path where the WS serever is listening
    Context.prototype.path = 'ws';

    /// The session name.
    Context.prototype.session = null;

    /// The installed instance
    Context.prototype._instance = null;
    /// WsRpc instance
    Context.prototype._rpc = null;
    /// WsRpc instance
    Context.prototype._hub = null;

    // Class method
    Context.instance = function() {
	if (Context.prototype._instance == null) Context.prototype._instance = new Context();
	return Context.prototype._instance;
    };
    Context.prototype.install = function() {
	if (Context.prototype._instance) throw new Error("Context already installed");
	Context.prototype._instance = this;
    };

    /**
     * The singleton creator of WsRpc
     *
     * @property rpc
     * @return		 WsRpc instance
     */    
    Object.defineProperty(Context.prototype, "rpc", {
	get: function(){
	    if (this._rpc === null) {
		this._rpc = new WsRpc(this.server, this.path, this.port);
		this._rpc.extend(this);
	    }
	    return this._rpc;
	}
    });

    /**
     * The singleton creator of Hub
     *
     * @property hub
     * @return		 Hub instance
     */    
    Object.defineProperty(Context.prototype, "hub", {
	get: function(){
	    if (this._hub === null) {
		this._hub = new Hub(this.server, this.port+1, this.rpc, this.session);
	    }
	    return this._hub;
	}
    });

    /**
     * Modifies in-place the request to add context information
     * @fn modifyRequest
     * @memberof Context
     *
     * @param request    The JSON-RPC request.
     */
    Context.prototype.modifyRequest = function (request) {
	if (this.session === null) return;
	var _context = {session: this.session};
	if (Array.isArray(request.params)) {
	    request.params = {
		_params: request.params,
		_context: _context
	    };
	} 
	else {
	    request.params._context = _context;
	}
    };

    /**
     * Open a new session and include it in the Context so any later
     * call will execute in the context of this session
     * @fn openSession
     * @memberof Context
     *
     * @param session    The session name.
     */
    Context.prototype.openSession = function (session) {
	var self = this;
	var promise = this.rpc.call('SessionSrv.open_session', [session])
	    .then(function(){self.session = session;});
	this.session = session;
	return promise;
    };

    /**
     * Open a new session and include it in the session so any later
     * call will execute in the context of this session
     * @fn closeSession
     * @memberof Context
     *
     */
    Context.prototype.closeSession = function () {
	var self = this;
	var promise = this.rpc.call('SessionSrv.close_session', [this.session])
	    .then(function(){self.session = null;});
	return promise;
    };

    /**
     * Use a session including it in the Context so any later call
     * will execute in the context of this session
     * @fn closeSession
     * @memberof Context
     * @return isNew (Bool) Return if the session requested was
     *                      already open in the server or if was
     *                      created by this call.
     */
    Context.prototype.useSession = function (session) {
	var self = this;
	var promise = this.rpc.call('SessionSrv.use_session', [session])
	    .then(function(isNew){
		self.session = session;
		return isNew;
	    });
	return promise;
    };

    return Context;
}


);

