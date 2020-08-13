/**
 * Returns true if the settings menu is visible
 *
 * @returns {boolean} is the settings menu shown?
 */
helper.isSettingsShown = function() {
  return helper.padChrome$('#settings').hasClass('popup-show');
}

/**
 * Returns true if the chat box is shown
 *
 * @returns {boolean} visibility of the chat box
 */
helper.isChatboxShown = function() {
  return helper.padChrome$('#chatbox').hasClass('visible');
}

/**
 * Returns true if the chat box is sticky
 *
 * @returns {boolean} stickyness of the chat box
 */
helper.isChatboxSticky = function() {
  return helper.padChrome$('#chatbox').hasClass('stickyChat');
}

/**
 * the contentWindow is either the normal pad or timeslider
 *
 * @returns {HTMLElement} contentWindow
 */
helper.contentWindow = function(){
  return $('#iframe-container iframe')[0].contentWindow;
}

/**
 * The ui-slidar-bar element in the timeslider
 */
helper.sliderBar = function(){
  return helper.contentWindow().$('#ui-slider-bar')
}

/**
 * revision_date element
 */
helper.revisionDateElem = function(){
  return helper.contentWindow().$('#revision_date').text();
}

/**
 * revision_label element
 */
helper.revisionLabelElem = function(){
  return helper.contentWindow().$('#revision_label')
}

/**
 * Gets the chat icon from the bottom right of the page
 *
 * @returns {HTMLElement} the chat icon
 */
helper.chatIcon = function(){return helper.padChrome$('#chaticon')}

/**
 * Gets the titlecross icon
 *
 * @returns {HTMLElement} the titlecross icon
 */
helper.titlecross = function(){return helper.padChrome$('#titlecross')}

/**
 * Gets the settings button
 *
 * @returns {HTMLElement} the settings button
 */
helper.settingsButton = function(){return helper.padChrome$("button[data-l10n-id='pad.toolbar.settings.title']") }

/**
 * The save revision button
 */
helper.saveRevisionButton = function(){
  return $('.buttonicon-savedRevision');
}

/**
 * An array of divs that represent the saved revisions
 * @todo check position etc
 */
helper.savedRevisionStars = function(){
  return $('.star')
}

/**
 * Gets the timeslider button
 *
 * @returns {HTMLElement} the timeslider button
 */
helper.timesliderButton = function(){return helper.padChrome$("button[data-l10n-id='pad.toolbar.timeslider.title']") }

/**
 * Gets the settings menu
 *
 * @returns {HTMLElement} the settings menu
 */
helper.settingsMenu = function(){return helper.padChrome$('#settings') };

/**
 * Gets the timer div of a timeslider that has the datetime of the revision
 *
 * @returns {HTMLElement} timer
 */
helper.timesliderTimer = function(){
  if(typeof helper.contentWindow().$ == 'function'){
    return helper.contentWindow().$('#timer') }
  }

/**
 * Gets the time of the revision on a timeslider
 *
 * @returns {HTMLElement} timer
 */
helper.timesliderTimerTime = function(){
  if(helper.timesliderTimer()){
    return helper.timesliderTimer().text()
  }
}
