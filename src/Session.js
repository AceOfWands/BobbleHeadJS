export default class Session{
	constructor(info = null, user = null){
		this.info = info;
		this.user = user;
	}
	getInfo(){
		return this.info;
	}
	getUser(){
		return this.user;
	}
}