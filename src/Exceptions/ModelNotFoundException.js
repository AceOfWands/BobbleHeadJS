import FrameworkException from './FrameworkException.js';

export default class ModelNotFoundException extends FrameworkException{
	constructor(model){
		super(model + ' model not found!');
	}
};