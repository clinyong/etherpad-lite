describe("timeslider", function(){
  let padId = 735773577357+(Math.round(Math.random()*1000000000));

  //create a new pad before each test run
  before(function(cb){
    helper.newPad(cb, padId);
  });

  it("Makes sure the export URIs are as expected when the padID is numeric", async function() {

    // make some changes to produce 1 revision
    for(let i=0; i < 1; i++) {
      await edit('a\n');
    }

    await helper.gotoTimeslider(1);
    await helper.waitForPromise(function(){return helper.contentWindow().location.hash === '#1'})

    // expect URI to be similar to
    // http://192.168.1.48:9001/p/2/2/export/html
    // http://192.168.1.48:9001/p/735773577399/0/export/html
    let rev1ExportLink = helper.contentWindow().$('#exporthtmla').attr('href');
    let rev1Regex = new RegExp(padId + "/1/export/html");
    expect(rev1ExportLink).to.match(rev1Regex);


    // Click somewhere left on the timeslider to go to revision 0
    helper.sliderClick(30);

    let rev0ExportLink = helper.contentWindow().$('#exporthtmla').attr('href');
    let rev0Regex = new RegExp(padId + "/0/export/html");
    expect(rev0ExportLink).to.match(rev0Regex);
  });
});

  /**
   * Sends the edit to the last line and waits until its written
   */
  async function edit(message){
    var lines = helper.textLines().length
    helper.divLines()[lines-1].sendkeys(message);
    return helper.waitFor(function(){
      return helper.textLines().length === lines + message.split('\n').length - 1;
    })
  }
