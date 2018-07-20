export default class AuthenticationMethod{
	constructor(){
		this.session = null;
	}
	processRequest(request = null){}
	processPage(page = null){}
	processVirtualPage(vpage = null){}
	getCurrentSession(){
		return this.session;
	}
	replaceCurrentSession(session){
		this.session = session;
	}
	getCurrentUser(){
		if(this.session)
			return this.session.getUser();
		return null;
	}
}