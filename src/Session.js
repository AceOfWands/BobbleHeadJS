export default class Session{
	constructor(info = null){
		this.info = info;
	}
	getInfo(){
		return this.info;
	}
}