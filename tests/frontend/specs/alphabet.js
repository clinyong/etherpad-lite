describe("All the alphabet works n stuff", function(){
  var expectedString = "abcdefghijklmnopqrstuvwxyz";

  //create a new pad before each test run
  beforeEach(function(cb){
    helper.newPad(cb);
  });

  it("when you enter any char it appears right", async function() {

    let firstLine = helper.textLines()[0];
    await helper.edit(expectedString,1); // insert the string on line 1

    return helper.waitForPromise(function(){
      return helper.textLines()[0] === expectedString + firstLine;
    })
  });
});
