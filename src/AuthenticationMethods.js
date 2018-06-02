import AuthenticationMethod from './AuthenticationMethod.js';
import {execFuncWithArgList, log} from './Util.js';
import User from './User.js';
import Session from './Session.js';
import UnauthorizedException from './Exceptions/UnauthorizedException.js';

export default class AuthenticationMethods{
	static addMethod(name, method, args = null){
		AuthenticationMethods.methods[name] = [method, args];
	}
	static getMethod(name){
		var retrive = AuthenticationMethods.methods[name];
		return (retrive) ? (new (execFuncWithArgList(retrive[0], retrive[1]))()) : null;
	}
};
AuthenticationMethods.methods = {};
AuthenticationMethods.NoneAuthentication = class extends AuthenticationMethod{};
AuthenticationMethods.addMethod('none',AuthenticationMethods.NoneAuthentication);
AuthenticationMethods.BasicAuthentication = class extends AuthenticationMethod{
	login(data = null){
		if(data.name && data.password){
			var user = new User(data.name, data.password, ['user']);
			this.session = new Session({'user': user});
		}else
			log('BasicAuthentication',1,'Invalid user');
		return null;
	}
	logout(){
		this.replaceCurrentSession(null);
		return null;
	}
	processRequest(request = null){
		if(request){
			if(this.session){
				var userInfo = this.session.getInfo();
				var userObj = userInfo.user;
				request.setHeader('Authorization','Basic ' + btoa(userObj.name+':'+userObj.password));
			}
		}
	}
	processPage(page = null){
		if(page && page.roles){
			if(this.session){
				var userInfo = this.session.getInfo();
				var userObj = userInfo.user;
				var flag = false;
				for(var i=0; i<page.roles.length; i++){
					if(userObj.roles.indexOf(page.roles[i])!=-1)
						flag = true;
				}
				if(!flag){
					throw new UnauthorizedException();
				}
			}else if(page.roles.length>0)
				throw new UnauthorizedException();
		}
	}
};
AuthenticationMethods.addMethod('basic',AuthenticationMethods.BasicAuthentication);