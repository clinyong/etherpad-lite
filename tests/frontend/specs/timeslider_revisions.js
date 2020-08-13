describe("timeslider revisions", function(){
  //create a new pad before each test run
  beforeEach(function(cb){
    helper.newPad(cb);
  });

  /**
   *
   * This test is slow and has nothing special in it 
   * except save revision check thats now a separate test
   * 
   * @todo have tests for large revisions though
   */
  xit("loads adds a hundred revisions", async function() { // passes
    // make some changes to produce 100 revisions
    let revs = 99;
    this.timeout(revs*900+20000);
    for(var i=0; i < revs; i++) {
      await helper.edit('a\n')
    }

    await helper.saveRevision();

    await helper.gotoTimeslider();

    var latestContents = helper.textLines().join('\n');

    // Click somewhere left on the timeslider to go to revision 0
    helper.sliderClick(30);

    //make sure the text has changed
    expect( helper.textLines().join('\n') ).not.to.eql( latestContents );

    // there should only be one saved revision star at this point
    expect(helper.savedRevisionStars.is(":visible") === true);
  });


  it("changes the url when clicking on the timeslider", async function() {

    // make some changes to produce 7 revisions
    var timePerRev = 900
      , revs = 7;
    this.timeout(revs*timePerRev+20000);
    for(var i=0; i < revs; i++) {
      await helper.edit('a\n')
    }

    // open the timeslider at revision 3
    await helper.gotoTimeslider(3);

    // @todo
    // move the check if `helper.gotoTimeslider(XXX)` is at revision XXX
    // to `helper.gotoTimeslider(XXX)`. 
    await helper.waitForPromise(function(){return helper.contentWindow().location.hash === '#3'})

    // click somewhere left to go to revision 0
    helper.sliderClick(20);

    await helper.waitForPromise(function(){
      return helper.contentWindow().location.hash === '#0';
    })

    // this should right enough to go to another revision
    helper.sliderClick(400); 
    await helper.waitForPromise(function(){
      return helper.contentWindow().location.hash > '#0';
    })

    let oldRev = helper.contentWindow().location.hash;

    // this should be even more right enough to go to another revision
    helper.sliderClick(700); 

    await helper.waitForPromise(function(){
      return helper.contentWindow().location.hash > oldRev;
    })

  });
  xit("jumps to a revision given in the url", function(done) {
    var inner$ = helper.padInner$;
    this.timeout(40000);

    // wait for the text to be loaded
    helper.waitFor(function(){
      return inner$('body').text().length != 0;
    }, 10000).always(function() {
      var newLines = inner$('body div').length;
      var oldLength = inner$('body').text().length + newLines / 2;
      expect( oldLength ).to.not.eql( 0 );
      inner$("div").first().sendkeys('a');
      var timeslider$;

      // wait for our additional revision to be added
      helper.waitFor(function(){
        // newLines takes the new lines into account which are strippen when using
        // inner$('body').text(), one <div> is used for one line in ACE.
        var lenOkay = inner$('body').text().length + newLines / 2 != oldLength;
        // this waits for the color to be added to our <span>, which means that the revision
        // was accepted by the server.
        var colorOkay = inner$('span').first().attr('class').indexOf("author-") == 0;
        return lenOkay && colorOkay;
      }, 10000).always(function() {
        // go to timeslider with a specific revision set
        $('#iframe-container iframe').attr('src', $('#iframe-container iframe').attr('src')+'/timeslider#0');

        // wait for the timeslider to be loaded
        helper.waitFor(function(){
          try {
            timeslider$ = $('#iframe-container iframe')[0].contentWindow.$;
          } catch(e){}
          if(timeslider$){
            return timeslider$('#innerdocbody').text().length == oldLength;
          }
        }, 10000).always(function(){
          //todo expected 413 to sort of equal 412 
          expect( timeslider$('#innerdocbody').text().length ).to.eql( oldLength );
          done();
        });
      });
    });
  });

  it("checks the export url when using timeslider bar", async function() {
    let revs = 3;
    this.timeout(revs*900+20000);
    for(var i=0; i < revs; i++) {
      await helper.edit('a\n')
    }
    await helper.gotoTimeslider(3)

    // @todo
    // move the check if `helper.gotoTimeslider(XXX)` is at revision XXX
    // to `helper.gotoTimeslider(XXX)`. 
    await helper.waitForPromise(function(){return helper.contentWindow().location.hash === '#3'})

    expect(helper.contentWindow().$('#exportplaina').attr('href')).to.match(/\/3\/export\/txt/);

    // revision 0
    helper.sliderClick(20);

    await helper.waitForPromise(function(){
      return helper.contentWindow().$('#exportplaina').attr('href').match(/\/0\/export\/txt/);
    })

    // click the play button to move to latest revision
    helper.contentWindow().$('#playpause_button_icon').click()
    await helper.waitForPromise(function(){
      return helper.contentWindow().$('#exportplaina').attr('href').match(/\/3\/export\/txt/);
    })
  });
});
