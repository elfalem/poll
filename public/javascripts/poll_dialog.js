function buttonClicked(event) {
  if (event.action === "dialog.create") {
    createPoll();
  } else if (event.action == "dialog.vote") {
    submitPollVote();
  } else {
    HipChat.dialog.close();
  }
}

function submitPollVote() {
  var selections = [];
  var selected = jQuery('#options_table input:checked');
  if (selected.length == 0) {
    jQuery('#options_table').animateCss('shake');
    return;
  }
  var i = 0;
  for (; i < selected.length; i++) {
    selections.push(selected.eq(i).val());
  }
  var data = {
    selections: selections,
    jwt: jwt
  };

  jQuery.post('/poll/' + pollId + '/vote', data).then(submitPollVoteDone);
}

function submitPollVoteDone() {
  location.reload();
}

function selectRowRadio(a) {
  jQuery(a).find('label.option-label')[0].MaterialRadio.check();
}

function selectRowCheck(a) {
  var isChecked = jQuery(a).find("input[type='checkbox']").prop('checked');
  if (isChecked) {
    jQuery(a).find('label.option-label')[0].MaterialCheckbox.uncheck();
  } else {
    jQuery(a).find('label.option-label')[0].MaterialCheckbox.check();
  }
}

function addRow() {
  var row = jQuery('#options_table tbody tr').last();
  var n = parseInt(row.attr('data-row')) + 1;
  var newRow = row.clone();
  newRow.attr('data-row', n);
  newRow.find('.number_cell').html(n + '.');
  // mdl components must be re-registered after they are cloned. this
  // requires the 'upgraded' attributes and classes to be removed
  // prior to being added to the dom.
  newRow.find('.text_cell div').removeClass('is-upgraded');
  newRow.find('.text_cell div').removeAttr('data-upgraded');
  newRow.find('.text_cell input').attr('id', 'option_text_' + n);
  newRow.find('.text_cell input').val('');
  newRow.find('.text_cell label').attr('for', 'option_text_' + n);
  row.after(newRow);
  componentHandler.upgradeElement(newRow.find('.text_cell div')[0]);
  newRow.find('.text_cell input').focus();
}

function removeRow(a) {
  var rows = jQuery('#options_table tbody tr');
  if (rows.length == 1) {
    rows.eq(0).find('.text_cell input').val('');
    return false;
  }
  jQuery(a).parent().parent().remove();

  rows = jQuery('#options_table tbody tr');
  var i = 0;
  for (; i < rows.length; i++) {
    rows.attr('data-row', i + 1);
    rows.eq(i).find('.number_cell').html((i + 1) + '.');
  }
  return false;
}

function createPoll() {
  var data = {};
  data.jwt = jwt;
  data.question = jQuery('#poll_question').val();
  data.question_type = 1;
  if (jQuery('#type-check:checked').length > 0)
    data.question_type = 2;
  data.expires_value = jQuery('#expires_value').val();
  data.expires_time = jQuery('#expires_time option:selected').text();
  data.options = [];

  var rows = jQuery('#options_table tbody tr');
  var i = 0;
  for (; i < rows.length; i++) {
    data.options.push(rows.eq(i).find('.text_cell input').val());
  }

  jQuery.post('/poll', data).then(createPollDone);
}

function createPollDone() {
  HipChat.dialog.close();
}

function resizeWindow() {
  if (typeof HipChat === "undefined" || jQuery('#container').height() == 0) {
    return;
  }
  var newSize = Math.min(jQuery('#container').height() + 70, 600);

  HipChat.dialog.update({
    options: {
      size: {
        height: newSize.toString() + 'px'
      }
    }
  });
}

if (typeof AP !== 'undefined' && typeof HipChat !== 'undefined') {
  AP.register({
    "dialog-button-click": buttonClicked
  });
  jQuery(resizeWindow);
}

// for removing animation CSS classes after the animation ends so they can be triggered again
$.fn.extend({
  animateCss: function (animationName) {
    var animationEnd = 'webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend';
    this.addClass('animated ' + animationName).one(animationEnd, function () {
      $(this).removeClass('animated ' + animationName);
    });
  }
});