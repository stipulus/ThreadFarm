function init() {
    var Thread = ThreadFarm.seed.prototype.extend({
        include:['js/Library.js'],
        run: function () {
            response.primes = getPrimes(100);
        },
        callback: function (response) {
            console.log(response.primes.join(','));
        },
        autoStart: false,
        autoDestroy: true
    });
    var thread = new Thread();
    thread.start();
}