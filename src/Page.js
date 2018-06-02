export default class Page{
	constructor(path,vid,lock,configuration = null, modules = null, keepLive = false, allowDuplicate = false, ghostPage = false, roles = null){
		this.path = path;
		this.vid = vid;
		this.lock = lock;
		this.configuration = configuration;
		this.modules = modules;
		this.roles = roles;
		this.keepLive = keepLive;
		this.allowDuplicate = allowDuplicate;
		this.ghostPage = ghostPage;
	}
}