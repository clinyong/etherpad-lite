describe("timeslider", function(){
  //create a new pad before each test run
  beforeEach(function(cb){
    helper.newPad(cb);
  });

  it("Shows a date and time in the timeslider and make sure it doesn't include NaN", async function() {

    // make some changes to produce 3 revisions
    let revs = 3;

    for(let i=0; i < revs; i++) {
      await edit('a\n');
    }

    await helper.gotoTimeslider();

    // the datetime of last edit
    let timerTimeOld = new Date(helper.timesliderTimerTime()).getTime();

    // the day of this revision, e.g. August 12, 2020
    let dateOld = new Date(helper.revisionDateElem().text()).getTime();

    // the label/revision, e.g. Version 3
    let labelOld = helper.revisionLabelElem().text();
    let labelMatcher = new RegExp('Version '+revs);

    // the datetime should be a date
    expect( Number.isNaN(timerTimeOld)).to.eql(false);

    // the Date object of the day should not be NaN
    expect( Number.isNaN(dateOld) ).to.eql(false)

    // the label should match Version `Number`
    expect( labelOld ).to.match( labelMatcher );


    let sliderBar = helper.sliderBar();

    // Click somewhere left on the timeslider to go to revision 0
    let e = new jQuery.Event('mousedown');
    e.pageX = 30;
    e.pageY = sliderBar.offset().top;
    sliderBar.trigger(e);
    sliderBar.trigger('mouseup');

    // the datetime of last edit
    let timerTime = new Date(helper.timesliderTimerTime()).getTime();

    // the day of this revision, e.g. August 12, 2020
    let date = new Date(helper.revisionDateElem().text()).getTime();

    // the label/revision, e.g. Version 0
    let label = helper.revisionLabelElem().text();

    // the datetime should be a date
    expect( Number.isNaN(timerTime)).to.eql(false);
    // the old revision should be older or have the same time
    expect(timerTimeOld - timerTime >= 0);

    // the Date object of the day should not be NaN
    expect( Number.isNaN(date) ).to.eql(false)

    // the label should match Version 0
    expect( label ).to.match( /Version 0/);
  });
});

/**
 * Sends the edit to the last line and waits until its written
 */
async function edit(message){
  let lines = helper.textLines().length
  helper.divLines()[lines-1].sendkeys(message);
  return helper.waitFor(function(){
    return helper.textLines().length === lines + message.split('\n').length - 1;
  })
}

