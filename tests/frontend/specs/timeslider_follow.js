describe("timeslider follow", function(){
  //create a new pad before each test run
  before(function(cb){
    helper.newPad(cb);
  });

  it("content as it's added to timeslider", async function() {

    // send 3 revisions
    let revs = 3;
    let message = 'a\n\n\n\n\n\n\n\n\n\n';
    for (let i=0;i<revs;i++){
      await helper.edit(message)
    }

    await helper.gotoTimeslider(0);
    //todo move to helper
    await helper.waitForPromise(function(){return helper.contentWindow().location.hash === '#0'})
    let originalTop = helper.contentWindow().$('#innerdocbody').offset();

    // set to follow contents as it arrives
    helper.contentWindow().$('#options-followContents').prop("checked", true);
    helper.contentWindow().$('#playpause_button_icon').click();

    let newTop;
    return helper.waitForPromise(function(){
      newTop = helper.contentWindow().$('#innerdocbody').offset();
      return newTop.top < originalTop.top;
    })
  })
});

