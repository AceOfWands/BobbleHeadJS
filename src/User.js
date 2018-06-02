export default class User{
	constructor(username,password,roles){
		this.username = username;
		this.password = password;
		this.roles = roles
	}
	getRoles(){
		return this.roles;
	}
	hasRole(role){
		return this.roles.indexOf(role) != -1;
	}
	giveRole(role){
		this.roles.push(role);
	}
}