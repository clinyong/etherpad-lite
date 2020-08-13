/**
 * Opens the chat window unless it is already open via an
 * icon on the bottom right of the page
 */
helper.showChat = function(){
  var chaticon = helper.chatIcon();
  if(chaticon.hasClass('visible')) {
    chaticon.click()
    return helper.waitFor(function(){return !chaticon.hasClass('visible'); },2000)
  }
}

/**
 * Closes the chat window if it is shown and not sticky
 */
helper.hideChat = function(){
  if(helper.isChatboxShown() && !helper.isChatboxSticky()) {
    helper.titlecross().click()
    return helper.waitFor(function(){return !helper.isChatboxShown(); },2000);
  }
}

/**
 * Disables the stickyness of the chat window via an icon on the
 * upper right
 */
helper.disableStickyChatviaIcon = function() {
  if(helper.isChatboxShown() && helper.isChatboxSticky()) {
    helper.titlecross().click()
    return helper.waitFor(function(){return !helper.isChatboxSticky()},2000);
  }
}

/**
 * Opens the settings menu if its hidden via button
 */
helper.showSettings = function() {
  if(!helper.isSettingsShown()){
    helper.settingsButton().click()
    return helper.waitFor(function(){return helper.isSettingsShown(); },2000);
  }
}

/**
 * Hide the settings menu if its open via button
 * @todo untested
 */
helper.hideSettings = function() {
  if(helper.isSettingsShown()){
    helper.settingsButton().click()
    helper.waitFor(function(){return !helper.isSettingsShown(); },2000);
  }
}

/**
 * Makes the chat window sticky via settings menu if the settings menu is
 * open and sticky button is not checked
 */
helper.enableStickyChatviaSettings = function() {
  var stickyChat = helper.padChrome$('#options-stickychat');
  if(helper.isSettingsShown() && !stickyChat.is(':checked')) {
    stickyChat.click();
    return helper.waitFor(function(){
      return helper.isChatboxSticky();
    },2000);
  }
}

/**
 * Unsticks the chat window via settings menu if the settings menu is open
 * and sticky button is checked
 */
helper.disableStickyChatviaSettings = function() {
  var stickyChat = helper.padChrome$('#options-stickychat');
  if(helper.isSettingsShown() && stickyChat.is(':checked')) {
    stickyChat.click();
    return helper.waitFor(function(){return !helper.isChatboxSticky()},2000);
  }
}

/**
 * Makes the chat window sticky via an icon on the top right of the chat
 * window
 */
helper.enableStickyChatviaIcon = function() {
  var stickyChat = helper.padChrome$('#titlesticky');
  if(helper.isChatboxShown() && !helper.isChatboxSticky()) {
    stickyChat.click();
    return helper.waitFor(function(){return helper.isChatboxSticky()},2000);
  }
}

/**
 * Sets the src-attribute of the main iframe to the timeslider
 * In case a revision is given, sets the timeslider to this specific revision
 * It waits until the timer is filled with date and time
 * @todo for some reason this does only work the first time, you cannot
 * goto rev 0 and then via the same method to rev 5. Use buttons instead
 *
 * @param {number} [revision] the optional revision
 */
helper.gotoTimeslider = function(revision){
  revision = Number.isInteger(revision) ? '#'+revision : '';
  var iframe = $('#iframe-container iframe');
  iframe.attr('src', iframe.attr('src')+'/timeslider' + revision);
  return helper.waitForPromise(function(){return helper.timesliderTimerTime()
    && !Number.isNaN(new Date(helper.timesliderTimerTime()).getTime()) },10000);
}

/**
 * Enters timeslider via timeslider button
 * It waits until the timer is filled with date and time
 */
helper.gotoTimesliderviaButton = function(){
  if (!helper.padChrome$.window.location.href.match(/\/timeslider(?:#[0-9]+)?$/)){
    helper.timesliderButton().click();
    return helper.waitForPromise(function(){return helper.timesliderTimerTime()
      && !Number.isNaN(new Date(helper.timesliderTimerTime()).getTime()) },10000);
  }
}

/**
 * Saves a revision
 * @todo wait for SAVE_REVISION message from server
 */
helper.saveRevision = function(){
  helper.saveRevisionButton().click()
  return helper.waitForPromise(function(){return $('.saved-revision').is(':visible')})
}


/**
 * Sends a chat `message` via `sendKeys`
 *
 * @param {string} message the chat message to be sent
 */
helper.sendChatMessage = function(message){
  helper.padChrome$("#chatinput").sendkeys(message)
}

/**
 * Makes an edit via `sendkeys` and ensures ACCEPT_COMMIT
 * is returned by the server
 * It does not check if the ACCEPT_COMMIT is the edit sent
 *
 * @param {string} message The edit to make
 * @param {number} [lineNr] the optional line to make the edit on starting from 1
 * @todo currently Sends the message to the last line of a pad
 *
 */
helper.edit = async function(message, lineNr){
  let editsNr = helper.commits.length;
  lineNr = lineNr ? lineNr - 1 : helper.textLines().length - 1;
  helper.divLines()[lineNr].sendkeys(message);
  return helper.waitForPromise(function(){
    return editsNr + 1 === helper.commits.length;//helper.textLines().length === lines + message.split('\n').length - 1;
  })
}

/*
 * Array of chat messages received
 */
helper.chatMessages = [];

/*
 * Array of changeset commits from the server
 */
helper.commits = [];

/*
 * Array of userInfo messages from the server
 */
helper.userInfos = [];

/**
 * Spys on socket.io messages and saves them into several arrays
 * that are visible in tests
 */
helper.spyOnSocketIO = function (){
  helper.contentWindow().pad.socket.on('message', function(msg){
    if (msg.type == "COLLABROOM") {

      if (msg.data.type == 'ACCEPT_COMMIT') {
        helper.commits.push(msg);
      }
      else if (msg.data.type == 'USER_NEWINFO') {
        helper.userInfos.push(msg)
      }
      else if (msg.data.type == 'CHAT_MESSAGE') {
        helper.chatMessages.push(msg)
      }
    }
  })
}

/**
 * Clicks in the timeslider at a specific offset
 * It's used to navigate the timeslider
 *
 * @todo no mousemove test
 * @param {number} X coordinate
 */
helper.sliderClick = function(X){
  let sliderBar = helper.sliderBar()
  let edown = new jQuery.Event('mousedown');
  let eup = new jQuery.Event('mouseup');
  edown.clientX = eup.clientX = X;
  edown.clientY = eup.clientY = sliderBar.offset().top;

  sliderBar.trigger(edown);
  sliderBar.trigger(eup);
}

/**
 * The pad text as an array of lines
 *
 * @returns {Array.<string>} lines of text
 */
helper.textLines = function(){
  return helper.padInner$('.ace-line').map(function(){
    return $(this).text()
  }).get()
}

/**
 * The pad text as an array of divs
 *
 * @example
 * helper.linesElem()[2].sendkeys('abc') // sends abc to the third line
 *
 * @returns {Array.<HTMLElement>} array of divs
 */
helper.divLines = function(){
  return helper.padInner$('.ace-line').map(function(){
    return $(this)
  })
}
