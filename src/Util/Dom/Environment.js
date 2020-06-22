import RestrictedDomElement from './RestrictedDomElement.js';
import {getClassFromName} from '../../Util.js';
import EnvironmentNotReadyException from '../../Exceptions/EnvironmentNotReadyException.js';
import SafeBobbleHead from '../../SafeBobbleHead.js';

export default class Environment{
    constructor(document, container, baseURI, permissions){

        this.iframeAdapted = false;
        this.iframeReady = false;
        this.container = container;
        this.baseURI = baseURI;
        this.permissions = permissions;

        let id = Date.now().toString(36);

        this.hiddenIframe = document.createElement('iframe');
        this.hiddenIframe.style.display = 'none';
        this.hiddenIframe.sandbox = 'allow-scripts allow-same-origin';
        
        this.loadingTask = new Promise(function(resolve){
            if(this.hiddenIframe.contentDocument &&
                this.hiddenIframe.contentDocument.readyState == 'complete'){

                this.adaptIframe();
                this.iframeReady = true;
                resolve()
            }else{
                window.addEventListener('message', function(e){
                    if (e['data'] === `${id} slave iframe loaded`) {
                        this.adaptIframe();
                        this.iframeReady = true;
                        resolve();
                    }
                }.bind(this), false);
                
                let poolingTryer = function(itself, iframe){
                    if(iframe.contentDocument && iframe.contentDocument.readyState == 'complete'){
                        this.adaptIframe();
                        this.iframeReady = true;
                        resolve()
                    }else
                        setTimeout(itself, 200, itself, iframe);
                }.bind(this);
                
                setTimeout(poolingTryer, 500, poolingTryer, this.hiddenIframe);
            }

            const iframeContentBlob = new Blob([`
                <html>
                    <body onload="__fireloadedmessage()">
                        <script>
                            function __fireloadedmessage(){
                                setTimeout(() => {
                                    window.parent.postMessage('${id} slave iframe loaded', '*');
                                }, 0);
                            }
                        </script>
                    </body>
                </html>
            `], {type: 'text/html'});
            this.hiddenIframe.src = window.URL.createObjectURL(iframeContentBlob);

            document.body.appendChild(this.hiddenIframe);
        }.bind(this));
    }

    adaptIframe(){
        if(this.iframeAdapted)
            return;

        this.iframeAdapted = true;

        for(let v in window){
            if(!(v in this.hiddenIframe.contentWindow) && v != BobbleHead)
                try{
                    this.hiddenIframe.contentWindow[v] = window[v];
                }catch(e){
                    if(!(e instanceof TypeError))
                        throw e;
                }
        }
        this.hiddenIframe.contentWindow.Promise = window.Promise;
        this.hiddenIframe.contentWindow.Array = window.Array;
        this.hiddenIframe.contentWindow.Element = window.Element;
        if(this.permissions.indexOf('pages') > -1)
            this.hiddenIframe.contentWindow._document = new RestrictedDomElement(this.container);
        this.hiddenIframe.contentWindow.BobbleHead = new SafeBobbleHead(this.permissions);
        this.hiddenIframe.contentWindow.parent = null;
        
        let iframeBase = this.hiddenIframe.contentDocument.createElement("base");
        iframeBase.setAttribute("href", this.baseURI);
        this.hiddenIframe.contentDocument
            .getElementsByTagName("head")[0]
            .appendChild(iframeBase);
    }

    addFile(fileNamePath, modulesPath){
        return new Promise(function(resolve, reject){
            this.loadingTask.then(function(){
                let script = document.createElement("script");
                script.src = modulesPath + fileNamePath;
                script.type = 'module';
                script.onload = ()=>{
                    resolve(script);
                };

                this.appendScriptToIframe(script, fileNamePath, modulesPath, reject);
                
            }.bind(this));
        }.bind(this));
    }

    appendScriptToIframe(script, fileNamePath, modulesPath, error){
        if(modulesPath.startsWith('file:')){
            var xhr = new XMLHttpRequest();
            xhr.onload = function(){
                let blob = xhr.response;
                let contentBlob = new Blob([blob], {type: 'text/javascript'});
                script.src = URL.createObjectURL(contentBlob);
                this.hiddenIframe.contentDocument.head.appendChild(script);
            }.bind(this);
            xhr.onerror = error;
            xhr.open('get', modulesPath + fileNamePath);
            xhr.responseType = 'blob';
            xhr.send();
        }else{
            this.hiddenIframe.contentDocument.head.appendChild(script);
        }
    }

    getExposed(name){
        if(!this.iframeReady)
            throw new EnvironmentNotReadyException();
        return getClassFromName(name, this.hiddenIframe.contentWindow);
    }
}