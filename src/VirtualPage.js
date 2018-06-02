export default class VirtualPage{
	constructor(page, data, context, success, fail){
		this.page = page;
		this.data = data;
		this.context = context;
		this.success = success;
		this.fail = fail;
	}
}