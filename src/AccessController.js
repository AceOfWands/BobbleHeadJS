import Database from './Database.js';
import {log} from './Util.js';
import AuthenticationMethods from './AuthenticationMethods.js';
import AuthenticationMethod from './AuthenticationMethod.js';
import InvalidAuthenticationMethodException from './Exceptions/InvalidAuthenticationMethodException.js';
import UnauthorizedException from './Exceptions/UnauthorizedException.js';
import Session from './Session.js';
import AccessControllerLoadedEvent from './Events/AccessControllerLoadedEvent.js';

export default class AccessController{
	getCurrentSession(){
		if(this.currentAuthMethod){
			var sess = this.currentAuthMethod.getCurrentSession();
			if((this.controllerData.session && sess != this.controllerData.session)
				|| ((!this.controllerData.session) && sess)){
				this.saveSession(sess);
			}
			return sess;
		}
		return this.controllerData.session;
	}
	getCurrentUser(){
		if(this.currentAuthMethod)
			return this.currentAuthMethod.getCurrentUser();
		return null;
	}
	saveSession(sess){
		var db = Database.getInstance(true);
		sess._id = 'session';
		if(this.controllerData.session)
			sess._rev = this.controllerData.session._rev;
		this.controllerData.session = sess;
		db.put(sess,{rev: true}).then(function (response) {
			this.controllerData.session._rev = response.rev;
			log('Saved local session', 0, response);
		}.bind(this)).catch(function (err) {
			log('Cannot save local session', 1, err);
		});
	}
	processRequest(request){
		if(this.currentAuthMethod){
			this.currentAuthMethod.processRequest(request);
		}
	}
	processPage(page){
		if(this.currentAuthMethod){
			var usr = this.getCurrentUser();
			if(usr){
				var process = false;
				if(page.roles.length > 0)
					for(var i=0; i < page.roles.length; i++){
						if(usr.hasRole(page.roles[i])){
							process = true;
							break;
						}
					}
				else
					process = true;
				if(process)
					this.currentAuthMethod.processPage(page);
				else
					throw new UnauthorizedException();
			}
		}
	}
	processVirtualPage(vpage){
		if(this.currentAuthMethod){
			this.currentAuthMethod.processVirtualPage(vpage);
		}
	}
	init(authType = 'none'){
		return new Promise(function(resolve, reject){
			this.currentAuthMethod = AuthenticationMethods.getMethod(authType) ||
				AuthenticationMethods.getMethod('none');
			if(!(this.currentAuthMethod instanceof AuthenticationMethod))
				throw new InvalidAuthenticationMethodException();
			var db = Database.getInstance(true);
			this.controllerData = {};
			db.get('session').then(function(session) {
				this.controllerData.session = new Session(session.info);
				this.controllerData.session._id = session._id;
				this.controllerData.session._rev = session._rev;
				this.currentAuthMethod.replaceCurrentSession(this.controllerData.session);
				log('Fetched local session', 0, this.controllerData.session);
				document.dispatchEvent(new AccessControllerLoadedEvent());
				resolve();
			}.bind(this)).catch(function(err) {
				this.controllerData.session = null;
				log('Cannot retrive local session', 1, err);
				document.dispatchEvent(new AccessControllerLoadedEvent());
				resolve();
			}.bind(this));
		}.bind(this)).catch(function(e) {
			log(e);
		});
	}
}