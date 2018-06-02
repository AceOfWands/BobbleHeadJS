import {isRemoteURIPattern} from './Util.js';
import Context from './Context.js';
import InternalConnector from './InternalConnector.js';
import ExternalConnector from './ExternalConnector.js';

export default class GenericConnector{
	request(request){
		var test = isRemoteURIPattern.test(request.uri);
		var connector = null;
		var context = Context.getGlobal();
		context.accessController.processRequest(request);
		if(!test){
			connector = InternalConnector.getInstance();
		}else{
			connector = ExternalConnector.getInstance();
		}
		return connector.doRequest(request);
	}
}