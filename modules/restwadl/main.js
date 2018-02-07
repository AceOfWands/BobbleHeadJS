class RestWadlModule extends BobbleHead.Module{
	constructor(){
		super('restwadl');
	}
	load(context, dom){}
}

RestWadlModule.Rest = {
		ResourceRequest: class{
			constructor(resource, crud, data){
				this.resource = resource;
				this.data = data || [];
			}
			getResource(){
				return this.resource;
			}
			getCRUD(){
				return this.crud;
			}
			*getData(){
				for(var x in this.data){
					var v = this.data[x];
					yield {'name':x,'value':v};
				}
			}
		},
		Server: class{
		constructor(id = null,resources = null, resource_types = null, params = null, representations = null){
				this.id = id;
				this.resources = resources;
				this.resource_types = resource_types;
				this.params = params;
				this.representations = representations;
			}
		},
			Resources: class{
			constructor(base = null, elements = null){
				this.base = base;
				this.elements = elements;
			}
		},
		Resource: class{
			constructor(id = null, path = null, type = null, queryType = null, resource_type = null, resources = null,
				methods = null, params = null){
				this.id = id;
				this.path = path;
				this.type = type;
				this.queryType = queryType;
				this.resource_type = resource_type;
				this.resources = resources;
				this.methods = methods;
				this.params = params;
			}
		},
		ResourceType: class{
			constructor(id = null, params = null, methods = null){
				this.id = id;
				this.params = params;
				this.methods = methods;
			}
		},
		Param: class{
			constructor(name, style, id = null, type = null, _default = null, path = null, required = null, repeating = null, fixed = null,
				options = null, links = null){
				this.id = id;
				this.name = name;
				this.style = style;
				this.type = type;
				this._default = _default;
				this.path = path;
				this.required = required;
				this.repeating = repeating;
				this.fixed = fixed;
				this.options = options;
				this.links = links;
			}
		},
		Option: class{
			constructor(value, mediaType){
				this.value = value;
				this.mediaType = mediaType;
			}
		},
		Link: class{
			constructor(resource_type = null, rel = null, rev = null){
				this.resource_type = resource_type;
				this.rel = rel;
				this.rev = rev;
			}
		},
		Method: class{
			constructor(name, id = null, requests = null, responds = null){
				this.name = name;
				this.id = id;
				this.requests = requests;
				this.responds = responds;
			}
		},
		CommunicationMethod: class{
			constructor(params, representations){
				this.params = params;
				this.representations = representations;
			}
		},
		Representation: class{
			constructor(id, mediaType, element, profile, params = null){
				this.id = id;
				this.mediaType = mediaType;
				this.element = element;
				this.profile = profile;
				this.params = params;
			}
		},
		CrossReference: class{
			constructor(reference){
				var dashPos = reference.indexOf('#');
				if(dashPos<1) //Inter-document references not supported
					throw new BobbleHead.NotSupportedException('Inter-document references not supported');
				this.reference = reference.substr(dashPos);
			}
		},
		Wadl: class{
			constructor(id,xmldoc){
				var application = xmldoc.getElementsByTagName("application")[0];
				this.server = new BobbleHead.Rest.Server();
				this.server.resources = this.findResources(application);
				this.server.resource_types = this.findResource_Types(application);
				this.server.params = this.findParams(application);
				this.server.methods = this.findMethods(application);
				this.server.representations = this.findRepresentations(application);
				//TODO: replace resource types in resource string list
				// replace element in Representation with right grammar
				// replace cross reference (also in link)
			}
			findResources(root){
				var ress = root.getElementsByTagName("resources");
				var _ress = [];
				for(var i=0; i<ress.length; i++){
					var temp = new BobbleHead.Rest.Resources(ress[i].getAttribute("base"));
					temp.elements = this.findResource(ress[i]);
					_ress.push(temp);
				}
				return _ress;
			}
			findResource(root){
				var ress = root.getElementsByTagName("resource");
				var _ress = [];
				for(var i=0; i<ress.length; i++){
					var type = ress[i].getAttribute("type") ? ress[i].getAttribute("type").split(' ') : [];
					var temp = new BobbleHead.Rest.Resource(ress[i].getAttribute("id"), ress[i].getAttribute("path"),
						type, ress[i].getAttribute("queryType") ? ress[i].getAttribute("queryType") : 'application/x-www-form-urlencoded',
						null, this.findResource(ress[i]), this.findMethods(ress[i]), this.findParams(ress[i]));
					_ress.push(temp);
				}
				return _ress;
			}
			findResource_Types(root){
				var ress = root.getElementsByTagName("resource_type");
				var _ress = [];
				for(var i=0; i<ress.length; i++){
					var temp = new BobbleHead.Rest.ResourceType(ress[i].getAttribute("id"), this.findParams(ress[i]),
						this.findMethods(ress[i]));
					_ress.push(temp);
				}
				return _ress;
			}
			findParams(root){
				var ress = root.getElementsByTagName("param");
				var _ress = [];
				for(var i=0; i<ress.length; i++){
					var temp = null;
					if(ress[i].getAttribute("href")){
						temp = new BobbleHead.Rest.ParameterReference(ress[i].getAttribute("href"));
					}else{
						temp = new BobbleHead.Rest.Param(ress[i].getAttribute("name"), ress[i].getAttribute("style"), ress[i].getAttribute("id"),
							ress[i].getAttribute("type"), ress[i].getAttribute("default"), ress[i].getAttribute("path"),
							ress[i].getAttribute("required") === 'true' ? true : false,
							ress[i].getAttribute("repeating") === 'true' ? true : false, ress[i].getAttribute("fixed"), this.findOptions(ress[i]),
							this.findLinks(ress[i]));
						_ress.push(temp);
					}
				}
				return _ress;
			}
			findOptions(){
				var ress = root.getElementsByTagName("option");
				var _ress = [];
				for(var i=0; i<ress.length; i++){
					var temp = new BobbleHead.Rest.Option(ress[i].getAttribute("value"),ress[i].getAttribute("mediaType"));
					_ress.push(temp);
				}
				return _ress;
			}
			findLinks(){
				var ress = root.getElementsByTagName("link");
				var _ress = [];
				for(var i=0; i<ress.length; i++){
					var rt = null;
					if(ress[i].getAttribute("resource_type"))
						rt = new BobbleHead.Rest.ResourceTypeReference(ress[i].getAttribute("resource_type"));
					var temp = new BobbleHead.Rest.Option(rt, ress[i].getAttribute("rel"), ress[i].getAttribute("rev"));
					_ress.push(temp);
				}
				return _ress;
			}
			findMethods(root){
				var ress = root.getElementsByTagName("method");
				var _ress = [];
				for(var i=0; i<ress.length; i++){
					var temp = null;
					if(ress[i].getAttribute("href")){
						temp = new BobbleHead.Rest.MethodReference(ress[i].getAttribute("href"));
					}else{
						temp = new BobbleHead.Rest.Method(ress[i].getAttribute("name"), ress[i].getAttribute("id")
							, this.findRequests(ress[i]), this.findResponses(ress[i]));
						_ress.push(temp);
					}
				}
				return _ress;
			}
			findRequests(root){
				var ress = root.getElementsByTagName("request");
				var _ress = [];
				for(var i=0; i<ress.length; i++){
					var temp = new BobbleHead.Rest.Request(this.findParams(ress[i]), this.findRepresentations(ress[i]));
					_ress.push(temp);
				}
				return _ress;
			}
			findResponses(root){
				var ress = root.getElementsByTagName("response");
				var _ress = [];
				for(var i=0; i<ress.length; i++){
					var temp = new BobbleHead.Rest.Response(this.findParams(ress[i]), this.findRepresentations(ress[i]));
					_ress.push(temp);
				}
				return _ress;
			}
			findRepresentations(root){
				var ress = root.getElementsByTagName("representation");
				var _ress = [];
				for(var i=0; i<ress.length; i++){
					var temp = null;
					if(ress[i].getAttribute("href")){
						temp = new BobbleHead.Rest.RepresentationReference(ress[i].getAttribute("href"));
					}else{
						temp = new BobbleHead.Rest.Representation(ress[i].getAttribute("id"), ress[i].getAttribute("mediaType"),
							ress[i].getAttribute("element"), ress[i].getAttribute("profile"), this.findParams(ress[i]));
						_ress.push(temp);
					}
				}
				return _ress;
			}
			getServer(){
				return this.server;
			}
		}
	}

RestWadlModule.Rest.Request = class extends RestWadlModule.Rest.CommunicationMethod{};
RestWadlModule.Rest.Response = class extends RestWadlModule.Rest.CommunicationMethod{};
RestWadlModule.Rest.RepresentationReference = class extends RestWadlModule.Rest.CrossReference{};
RestWadlModule.Rest.MethodReference = class extends RestWadlModule.Rest.CrossReference{};
RestWadlModule.Rest.ParameterReference = class extends RestWadlModule.Rest.CrossReference{};
RestWadlModule.Rest.ResourceTypeReference = class extends RestWadlModule.Rest.CrossReference{};
RestWadlModule.Rest.RestServerConnector = class extends BobbleHead.GenericConnector{
	addServer(wadl){
		//TODO:
	}
	request(resourceRequest,onSuccess = BobbleHead.defaultCallback,onFailure = BobbleHead.defaultCallback){
		//TODO:
	}
};
RestWadlModule.Rest.RestServerConnector.serverList = [];

bobblehead.registerModule(new RestWadlModule());