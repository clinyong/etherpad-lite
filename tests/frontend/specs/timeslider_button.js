describe("timeslider button takes you to the timeslider of a pad", function(){
  before(function(cb){
    helper.newPad(cb); // creates a new pad
  });

  it("sends an edit, goes to timeslider and URL contains timeslider", function(done){

    var firstLine = helper.textLines()[0];
    helper.divLines()[0].sendkeys('Testing');
    helper.waitFor(function (){
      return 'Testing'+firstLine === helper.textLines()[0];
    })
    .done(function(){
      helper.gotoTimesliderviaButton()
      .done(function(){
        var inTimeslider = !!helper.padChrome$.window.location.href.match(/\/timeslider(?:#[0-9]+)?$/);
        expect(inTimeslider).to.be(true);
        done();
      });
    })
  });
});

