var ga = (function () {
    var X1 = {};
    var X2 = {};
    var Xr = {};
    var Queue = new Array();
    var busy = false;
    var maxGen = 100;
    var maxPop = 100;
    var Thread;
    try {
        Thread = ThreadFarm.seed.prototype.extend({
            include:['js/Library.js','js/ga.js'],
            autoStart: false,
            autoDestroy: true
        });
    } catch (e) {
        
    }
    function init () {
        new Thread({
            data: {
                X1:X1
            },
            run: function (data) {
                data.X1 = ga.genPop(data.X1);
            },
            callback: function (res) {
                X1 = res.X1;
                ready();
            }
        }).start();
    }
    function run () {
        new Thread({
            data: {
                X1:X1
            },
            run: function (data) {
                data.X1 = ga.generations(data.X1,100);
            },
            callback: function (res) {
                X1 = res.X1;
                for(var i = 0;i < maxPop;i++)
                    console.log(getScore(X1[i]));
                ready();
            }
        }).start();
    }
    function generation (_X1) {
        if(typeof _X1 !== 'undefined')
            X1 = _X1;
        copyX1X2();
        mutateX2Xr();
        sortToX1();
        return X1;
    }
    function generations (_X1,num) {
        generation(_X1);
        for(var i = 1;i < num;i++)
            generation();
        return X1;
    }
    function copyX1X2 () {
        X2 = JSON.parse(JSON.stringify(X1));
    }
    function mutateX2Xr () {
        for(var i = 0;i < maxPop;i++)
            Xr[i] = mutate(X2[i]);
    }
    function sortToX1 () {
        var scores = {};
        for(var i = 0,j = (-1)*maxPop;i < maxPop*2;i++,j++) {
            function fun(i,j) {
                if(i < maxPop)
                    scores[i] = {index:i,score:getScore(X2[i])};
                else
                    scores[i] = {index:i,score:getScore(Xr[j])};
            }
            fun(i,j);
        }
        for(var j = 0;j < maxPop;j++) {
            X1[j] = {score:5000};
            for(var i = 0;i < maxPop*2;i++)
                if(scores[i] && scores[i].score < X1[j].score) {
                    X1[j] = scores[i];
                    scores[i] = null;
                }
        }
        for(var i = 0;i < maxPop;i++) {
            if(X1[i].index < maxPop)
                X1[i] = X2[X1[i].index];
            else
                X1[i] = Xr[X1[i].index-maxPop];
        }
    }
    function mutatePop(X1) {
        var X2 = {};
        for(var i = 0;i < maxPop;i++)
            X2[i] = mutate(X1[i]);
        return X2;
    }
    function enQueue (task) {
        if(typeof task === 'function') {
            Queue.push(task);
        }
        //ready();
    }
    function ready () {
        if(!busy && Queue.length > 0) {
            Queue.pop()();
        }
    }
    function genPop (X1) {
        for(var i = 0;i < maxPop;i++)
            X1[i] = getNew();
        return X1;
    }
    function getNew () {
        return {
            op:'*',
            l:3,
            r:{
                op:'+',
                l:4,
                r:3
            }
        };
    }
    function mutate (obj) {
        switch(typeof obj) {
            case 'number':
                return Math.random()*20-10;
                break;
            case 'string':
                break;
            case 'object':
                return {
                    op:obj.op,
                    l:mutate(obj.l),
                    r:mutate(obj.r)
                };
                break;
        }
    }
    function eval (obj) {
        switch(typeof obj) {
            case 'number':
                return obj;
                break;
            case 'string':
                break;
            case 'object':
                switch (obj.op) {
                    case '+': return eval(obj.l)+eval(obj.r);
                    case '-': return eval(obj.l)-eval(obj.r);
                    case '*': return eval(obj.l)*eval(obj.r);
                    case '/': 
                        if(obj.r === 0) obj.r = 0.000001;
                        return eval(obj.l)/eval(obj.r);
                }
                break;
        }
    }
    function getScore (indi) {
        return Math.abs(eval(indi));
    }
    function initThreads () {
        //setRun({data},function (res) {});
        for(var i = 0;i < maxThreads;i++)
            threads[i] = new Thread();
        //function (min,maxPop,function(data.X1[i]=>e) {e = ga.getNew();})
        
    }
    var maxThreads = 16;
    var threads = [];
    function multiEach () {
        threads.forEach(function (thread,j) {
            thread.setData({
                from:Math.floor((j)*(maxPop/maxThreads)),
                to:Math.floor((j+1)*(maxPop/maxThreads))-1
            });
            thread.busy();
            thread.setRun(function (data) {
                data.X1 = {};
                for(var i = data.from;i < data.to;i++)
                    data.X1[i] = ga.getNew();
            });
            thread.setCallback(function (res) {
                for(var i in res.X1)
                    X1[i] = res.X1[i];
                thread.ready();
                var ready = true;
                for(var i = 0;i < threads.length;i++) {
                    if(threads[i].isBusy) {
                        ready = false;
                        break;
                    }
                }
                if(ready) {
                    console.log(JSON.stringify(X1));
                }
            });
        });
    }
    function startThreads (index) {
        if(typeof index !== 'undefined') 
            threads[index].start();
        else
            for(var i = 0;i < maxThreads;i++)
                threads[i].start();
    }
    return {
        init:init,
        run:run,
        genPop:genPop,
        generation:generation,
        generations:generations,
        enQueue:enQueue,
        mutatePop:mutatePop
    };
})();