function init() {
    ga.init();
    //ga.generations(3);
    //ga.printScores();
    ga.setMaxGen(1000000);
    ga.run();
    ga.enQueue(function () {
        //ga.run();
    });
}