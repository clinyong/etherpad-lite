describe("timeslider button takes you to the timeslider of a pad", function(){
  before(function(cb){
    helper.newPad(cb); // creates a new pad
  });

  it("and URL contains timeslider", function(done){
    var inner$ = helper.padInner$;

    // get the first text element inside the editable space
    var $firstTextElement = inner$("div span").first();
    var originalValue = $firstTextElement.text(); // get the original value
    $firstTextElement.sendkeys("Testing"); // send line 1 to the pad

    var modifiedValue = $firstTextElement.text(); // get the modified value
    expect(modifiedValue).not.to.be(originalValue); // expect the value to change

    helper.gotoTimesliderviaButton()
    .done(function(){
      var inTimeslider = !!helper.padChrome$.window.location.href.match(/\/timeslider(?:#[0-9]+)?$/);
      expect(inTimeslider).to.be(true);
      done();
    });
  });
});

