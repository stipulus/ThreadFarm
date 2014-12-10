function init() {
    ga.init();
    ga.enQueue(function () {
        ga.run();
    });
}