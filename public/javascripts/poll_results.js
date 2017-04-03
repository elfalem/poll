function getData(pollId, jwt) {
  jQuery.getJSON(`/poll/${pollId}/results.json?signed_request=${jwt}`).done(updateResultsTable);
}

function updateResultsTable(data) {
  let tableBody = jQuery("<tbody>");

  for (let vote of data.votes) {
    let row = jQuery("<tr>");
    row.append(`<td><strong>${vote.optionText}</strong></td>`);
    row.append(`<td>${vote.votes} votes (${vote.pct}%)</td>`);
    let avatarsCell = jQuery("<td>");
    for (let voter of vote.voters) {
      avatarsCell.append(`<div id="avatar-${voter.userId}"><img class="avatar" src="${voter.avatar}">
        <div class="mdl-tooltip" data-mdl-for="avatar-${voter.userId}">${voter.name}</div></div>`);
    }

    row.append(avatarsCell);
    tableBody.append(row);
  }

  jQuery("#options_table tbody").remove();
  jQuery("#options_table").append(tableBody);
  jQuery("#options_table").show();
  jQuery("#options_spinner").remove();

  componentHandler.upgradeDom();
  resizeWindow();
}
