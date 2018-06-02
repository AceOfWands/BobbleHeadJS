export default class ModelInstance{
	constructor(id, model, change = null, allowEdit = true){
		this.id = id;
		this.model = model;
		this.change = (change != null) ? change.bind(this) : null;
		this.allowEdit = allowEdit;
	}
}