/*
ThreadFarm JS v0.1.0 (alpha)
Copyright (c) 2014, Tyler W. Chase-Nason
All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this
   list of conditions and the following disclaimer. 
2. Redistributions in binary form must reproduce the above copyright notice,
   this list of conditions and the following disclaimer in the documentation
   and/or other materials provided with the distribution.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR
ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

The views and conclusions contained in the software and documentation are those
of the authors and should not be interpreted as representing official policies, 
either expressed or implied, of the FreeBSD Project.
*/
var ThreadFarm = {};
(function () {
    var oopiLite = {};
    (function () {
        var pub = oopiLite;
        var rand = {
            len: 6,
            chars: 'abacdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890',
            gen: function () {
                var str = '';
                var charlen = this.chars.length;
                for(var i = this.len;i > 0;i--)
                    str += this.chars.charAt(Math.floor(Math.random()*charlen));
                return str;
            }
        };
        var base = {
            extend: function (child,abstract) {
                function newobj(obj) {
                    if(obj === 'object') {
                        var newobj = {};
                        for(var i in obj)
                            newobj[i] = newobj(obj[i]);
                        return newobj;
                    } else {
                        return obj;
                    }
                }
                for(var i in this)
                    if(typeof child[i] === 'undefined' && i !== 'super') {
                        child[i] = newobj(this[i]);
                    } else {
                        if(typeof child.super === 'undefined') {
                            child.super = {};
                        }
                        if(typeof this[i] === 'function') {
                            child.super[i] = this[i].bind(child);
                        } else {
                            child.super[i] = newobj(this[i]);
                        }
                    }

                function F(obj) {
                    if(abstract)
                        throw new Error('Cannot construct abstract class.');
                    else if(typeof this.construct === 'function')
                        this.construct(obj);
                }
                F.prototype = child;
                return F;
            }
        };
        pub.abstract = function (child) {
            return base.extend(child,true);
        };
        pub.class = function (child) {
            return base.extend(child);
        };
    })();
    var pub = ThreadFarm;
    pub.init = function init() {};
    pub.config = function config() {
        
    };
    pub.newThread = function newThread(task) {
        return grow();
    };
    pub.grow = function grow(task) {
        return new Thread(task);
    };
    pub.extendThread = function extendThread(obj) {
        return Thread.prototype.extend(obj);
    };
    //private
    var Thread = oopiLite.class({
        id:0,
        blob: null,
        worker: null,
        responseName: 'res',
        data: '{}',
        include: [],
        inprogress: false,
        autoDestroy: false,
        autoStart: false,
        isBusy: false,
        onmessage: function (e) {console.log(e);},
        construct: function (params) {
            if(typeof params !== 'object') params = {};
            this.addIncludes(params.include);
            this.setData(params.data);
            this.setRun(params.run);
            this.setCallback(params.callback);
            this.setAutoDestroy(params.autoDestroy);
            this.setAutoStart(params.autoStart);
            if(this.blob === null)
                this.setBlob(this.buildFunStr());
            if(this.autoStart) this.start();
        },
        setData: function (v) {
            if(typeof v !== 'undefined')
                this.data = JSON.stringify(v);
        },
        setAutoStart: function (v) {
            if(typeof v !== 'undefined')
                this.autoStart = v;
        },
        setAutoDestroy: function (v) {
            if(typeof v !== 'undefined')
                this.autoDestroy = v;
        },
        addIncludes:function (str) {
            if(typeof str !== 'undefined' && str instanceof Array) {
                for(var i = 0;i < str.length;i++)
                    this.addIncludes(str[i]);
            } else if(typeof str === 'string') {
                this.include.push(str);
            }
        },
        getBaseURL: function () {
            var url = document.location.href;
            var index = url.lastIndexOf('/');
            if (index != -1) {
                url = url.substring(0, index+1);
            }
            return url;
        },
        setCallback: function (v) {
            if(typeof v !== 'undefined')
                this.callback = v;
        },
        removeInclude: function (str) {
            var found = false;
            for(var i = 0;i < this.include.length;i++)
                if(this.include[i] === str)  {
                    this.include[i].unshif();
                    found = true;
                    break;
                }
            return found;
        },
        getIncludes: function () {
            
            if(this.include.length > 0) {
                var url = this.getBaseURL();
                return 'importScripts(\''+url+this.include.join('\',\''+url+'')+'\');';
            } else
                return 'importScripts();';
        },
        setBlob: function (str) {
            if(typeof str !== 'undefined') {
                try {
                    this.blob = window.URL.createObjectURL(new Blob([str],{type:"text/javascript"}));
                } catch (e) {
                    this.blob = window.webkitURL.createObjectURL(new Blob([str],{type:"text/javascript"}));
                }
            }
        },
        setRun: function (v) {
            if(typeof v != 'undefined') {
                this.run = v;
                this.setBlob(this.buildFunStr());
            }
        },
        setResponseName: function (v) {
            if(typeof v === 'string' && v.length > 0)
                this.responseName = v;
        },
        buildFunStr: function () {
            if(typeof this.run !== 'undefined') {
                var funstr = this.run.toString();
                this.setResponseName(funstr.substr(funstr.indexOf('(')+1,funstr.indexOf(')')-funstr.indexOf('(')-1));
                var start = funstr.indexOf('{')+1;
                var prefix = 'var '+this.responseName+' = '+this.data+';'+this.getIncludes();
                var suffix = 'postMessage("complete "+JSON.stringify('+this.responseName+'));';
                funstr = prefix+funstr.substr(start,funstr.lastIndexOf('}')-start)+suffix;
                delete start,prefix,suffix;
                return funstr;
            }
        },
        parseMessage: function (e) {
            var arr = e.data.split(' ',2);
            switch (arr[0]) {
                case 'complete': 
                    this.setResponse(arr[1]);
                    this.callCallback();
                    this.inprogress = false;
                    if(this.autoDestroy) this.destroy();
                    break;
                default: this.onmessage(e.data);break;
            }
        },
        setResponse: function (str) {
            if(typeof str !== 'undefined')
                this.response = JSON.parse(str);
        },
        getResponse: function () {
            if(typeof this.response === 'undefined')
                return {};
            else
                return this.response;
        },
        callCallback: function () {
            if(typeof this.callback !== 'undefined') 
                this.callback(this.getResponse());
        },
        destroy: function () {
            this.worker.terminate();
            window.URL.revokeObjectURL(this.blob);
            delete this.blob,this.worker,this.callback,this.include;
        },
        start: function () {
            this.inprogress = true;
            this.worker = new Worker(this.blob);
            var self = this;
            this.worker.onmessage = function (e) {
                self.parseMessage(e);
            };
        },
        busy: function () {
            this.isBusy = true;
        },
        ready: function () {
            this.isBusy = false;
        }
    });
    pub.Thread = Thread;
    pub.seed = Thread;
    var rand = {
        len: 6,
        chars: 'abacdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890',
        gen: function () {
            var str = '';
            var charlen = this.chars.length;
            for(var i = this.len;i > 0;i--)
                str += this.chars.charAt(Math.floor(Math.random()*charlen));
            return str;
        }
    };
})();