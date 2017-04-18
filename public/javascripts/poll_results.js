function getData(pollId, jwt) {
  jQuery.getJSON(`/poll/${pollId}/results.json?signed_request=${jwt}`).done(updateResultsTable);
}

function updateResultsTable(data) {
  let tableBody = jQuery("<tbody>");
  let i = 0;

  for (let vote of data.votes) {
    let row = jQuery("<tr>");
    row.append(`<td><strong>${vote.optionText}</strong></td>`);
    row.append(`<td>${vote.votes} votes (${vote.pct}%)</td>`);
    let avatarsCell = jQuery('<td class="avatars_cell">');
    for (let voter of vote.voters) {
      avatarsCell.append(`<span id="avatar-${voter.userId}-${++i}"><img class="avatar" src="${voter.avatar}">
        <div class="mdl-tooltip" data-mdl-for="avatar-${voter.userId}-${i}">${voter.name}</div></span>`);
    }

    row.append(avatarsCell);
    tableBody.append(row);
  }

  jQuery("#results_table tbody").remove();
  jQuery("#results_table").append(tableBody);
  jQuery("#results_table").show();
  jQuery("#results_spinner").remove();

  componentHandler.upgradeDom();
  resizeWindow();
}
