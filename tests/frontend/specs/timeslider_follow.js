describe("timeslider", function(){
  //create a new pad before each test run
  before(function(cb){
    helper.newPad(cb);
  });

  it("follow content as it's added to timeslider", async function() {

    // send 3 revisions
    var revs = 3;
    var message = 'a\n\n\n\n\n\n\n\n\n\n';
    for (var i=0;i<revs;i++){
      await edit(message)
    }

    await helper.gotoTimeslider(0);

    // set to follow contents as it arrives
    helper.contentWindow().$('#options-followContents').prop("checked", true);

    var originalTop = helper.contentWindow().$('#innerdocbody').offset();
    helper.contentWindow().$('#playpause_button_icon').click();

    let newTop;
    return helper.waitForPromise(function(){
      newTop = helper.contentWindow.$('#innerdocbody').offset();
      return newTop.top < originalTop.top;
    })
  })

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

});

